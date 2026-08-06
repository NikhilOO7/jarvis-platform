import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { classifyContent } from "@/lib/ai/classify";
import { deriveKnowledgeRecord } from "@/lib/ai/knowledge";
import { storeItemEmbeddings } from "@/lib/ai/retrieval";
import { summarizeContent } from "@/lib/ai/summarize";
import { normalizeUrl, stableHash } from "@/lib/hash";

type IngestInput = {
  sourceType: "MANUAL_LINK" | "MANUAL_TEXT" | "FILE_IMPORT" | "SOCIAL_EXPORT" | "BROWSER_EXTENSION" | "SHARE_SHEET" | "API_CONNECTOR";
  title?: string | null;
  url?: string | null;
  text?: string | null;
  platform?: string | null;
  author?: string | null;
  metadata?: Record<string, unknown>;
};

export async function ingestItem(input: IngestInput) {
  const canonicalUrl = normalizeUrl(input.url);
  const hashBasis = [canonicalUrl, input.title, input.text].filter(Boolean).join("\n");
  const contentHash = stableHash(hashBasis);
  const duplicateConditions = canonicalUrl ? [{ contentHash }, { canonicalUrl }] : [{ contentHash }];
  const rawMetadata = input.metadata as Prisma.InputJsonObject | undefined;
  const existing = await prisma.rawSourceItem.findFirst({
    where: { OR: duplicateConditions }
  });

  if (existing) {
    return {
      item: await prisma.rawSourceItem.create({
        data: {
          sourceType: input.sourceType,
          originalUrl: input.url,
          canonicalUrl,
          title: input.title,
          author: input.author,
          platform: input.platform,
          rawText: input.text,
          rawMetadata,
          contentHash,
          category: existing.category,
          status: "DUPLICATE",
          duplicateOfId: existing.id,
          summary: existing.summary
        }
      }),
      duplicateOf: existing
    };
  }

  const [category, summary] = await Promise.all([
    classifyContent({ title: input.title, text: input.text, url: canonicalUrl }),
    summarizeContent({ title: input.title, text: input.text, url: canonicalUrl })
  ]);
  const knowledge = deriveKnowledgeRecord({ title: input.title, summary, category, url: canonicalUrl });

  const item = await prisma.rawSourceItem.create({
    data: {
      sourceType: input.sourceType,
      originalUrl: input.url,
      canonicalUrl,
      title: input.title,
      author: input.author,
      platform: input.platform,
      rawText: input.text,
      rawMetadata,
      contentHash,
      category,
      status: "PROCESSED",
      summary,
      knowledgeItems: {
        create: knowledge
      }
    },
    include: {
      knowledgeItems: true
    }
  });

  await storeItemEmbeddings({
    rawSourceItemId: item.id,
    knowledgeItemId: item.knowledgeItems[0]?.id,
    text: [item.title, summary, input.text].filter(Boolean).join("\n").slice(0, 8000)
  });

  return { item, duplicateOf: null };
}
