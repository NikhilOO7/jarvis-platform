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
}): Promise<number[] | null> {
  try {
    const embedding = await createEmbedding(input.text);
    if (!embedding) return null;

    const literal = toVectorLiteral(embedding);
    if (input.rawSourceItemId) {
      await prisma.$executeRaw`UPDATE "RawSourceItem" SET embedding = ${literal}::vector WHERE id = ${input.rawSourceItemId}`;
    }
    if (input.knowledgeItemId) {
      await prisma.$executeRaw`UPDATE "KnowledgeItem" SET embedding = ${literal}::vector WHERE id = ${input.knowledgeItemId}`;
    }
    return embedding;
  } catch {
    return null;
  }
}

export type NearDuplicate = { id: string; title: string; score: number };

/**
 * Semantic near-duplicate check: same idea saved with different words, which
 * hash dedupe cannot catch. Flag-don't-merge — the threshold is conservative
 * and the result is surfaced to the operator, never auto-merged.
 */
export async function findNearDuplicates(
  embedding: number[],
  excludeKnowledgeItemId: string,
  threshold = 0.92
): Promise<NearDuplicate[]> {
  try {
    const literal = toVectorLiteral(embedding);
    const rows = await prisma.$queryRaw<Array<{ id: string; title: string; score: number }>>`
      SELECT id, title, 1 - (embedding <=> ${literal}::vector) AS score
      FROM "KnowledgeItem"
      WHERE embedding IS NOT NULL AND id != ${excludeKnowledgeItemId}
      ORDER BY embedding <=> ${literal}::vector
      LIMIT 3
    `;
    return rows
      .map((row) => ({ ...row, score: Number(row.score) }))
      .filter((row) => row.score >= threshold);
  } catch {
    return [];
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

async function searchKnowledgeWithMode(
  query: string,
  limit: number
): Promise<{ matches: KnowledgeMatch[]; mode: "semantic" | "keyword" | "unavailable" }> {
  try {
    const vectorMatches = await searchByVector(query, limit);
    if (vectorMatches.length > 0) return { matches: vectorMatches, mode: "semantic" };
  } catch {
    // vector search unavailable (no key, no embeddings yet, or extension issue) — fall through
  }

  try {
    return { matches: await searchByKeywords(query, limit), mode: "keyword" };
  } catch {
    return { matches: [], mode: "unavailable" };
  }
}

export async function searchKnowledge(query: string, limit = 6): Promise<KnowledgeMatch[]> {
  const result = await searchKnowledgeWithMode(query, limit);
  if (result.mode === "unavailable") throw new Error("Saved-knowledge retrieval is unavailable.");
  return result.matches;
}

/** Search matches for a question, falling back to recent knowledge when the database is reachable. */
export async function getGroundingContext(
  question: string,
  limit = 8
): Promise<{ matches: KnowledgeMatch[]; mode: "semantic" | "keyword" | "recent" | "unavailable" }> {
  const search = await searchKnowledgeWithMode(question, limit);
  if (search.matches.length > 0) return search;
  if (search.mode === "unavailable") return search;

  try {
    const recent = await prisma.knowledgeItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, title: true, summary: true, category: true, insights: true, actions: true }
    });
    return {
      matches: recent.map((item) => ({ ...item, category: String(item.category), score: null })),
      mode: "recent"
    };
  } catch {
    return { matches: [], mode: "unavailable" };
  }
}
