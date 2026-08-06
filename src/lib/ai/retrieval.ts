import { prisma } from "@/lib/prisma";
import { createEmbedding } from "@/lib/ai/embeddings";

export type KnowledgeMatch = {
  id: string;
  title: string;
  summary: string;
  category: string;
  insights: string[];
  actions: string[];
  score: number | null;
};

function toVectorLiteral(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

export async function storeItemEmbeddings(input: {
  rawSourceItemId?: string | null;
  knowledgeItemId?: string | null;
  text: string;
}) {
  try {
    const embedding = await createEmbedding(input.text);
    if (!embedding) return false;

    const literal = toVectorLiteral(embedding);
    if (input.rawSourceItemId) {
      await prisma.$executeRaw`UPDATE "RawSourceItem" SET embedding = ${literal}::vector WHERE id = ${input.rawSourceItemId}`;
    }
    if (input.knowledgeItemId) {
      await prisma.$executeRaw`UPDATE "KnowledgeItem" SET embedding = ${literal}::vector WHERE id = ${input.knowledgeItemId}`;
    }
    return true;
  } catch {
    return false;
  }
}

async function searchByVector(query: string, limit: number): Promise<KnowledgeMatch[]> {
  const embedding = await createEmbedding(query);
  if (!embedding) return [];

  const literal = toVectorLiteral(embedding);
  const rows = await prisma.$queryRaw<
    Array<Omit<KnowledgeMatch, "category" | "score"> & { category: string; score: number }>
  >`
    SELECT id, title, summary, category::text AS category, insights, actions,
           1 - (embedding <=> ${literal}::vector) AS score
    FROM "KnowledgeItem"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${literal}::vector
    LIMIT ${limit}
  `;

  return rows.map((row) => ({ ...row, score: Number(row.score) }));
}

async function searchByKeywords(query: string, limit: number): Promise<KnowledgeMatch[]> {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2)
    .slice(0, 8);

  const items = await prisma.knowledgeItem.findMany({
    where: terms.length
      ? {
          OR: terms.flatMap((term) => [
            { title: { contains: term, mode: "insensitive" as const } },
            { summary: { contains: term, mode: "insensitive" as const } }
          ])
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, title: true, summary: true, category: true, insights: true, actions: true }
  });

  return items.map((item) => ({ ...item, category: String(item.category), score: null }));
}

export async function searchKnowledge(query: string, limit = 6): Promise<KnowledgeMatch[]> {
  try {
    const vectorMatches = await searchByVector(query, limit);
    if (vectorMatches.length > 0) return vectorMatches;
  } catch {
    // vector search unavailable (no key, no embeddings yet, or extension issue) — fall through
  }

  try {
    return await searchByKeywords(query, limit);
  } catch {
    return [];
  }
}
