import { getOpenAIClient } from "@/lib/openai";
import { env } from "@/lib/env";

export async function createEmbedding(text: string) {
  const client = getOpenAIClient();
  if (!client || !text.trim()) return null;

  const response = await client.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL,
    input: text.slice(0, 8000)
  });

  return response.data[0]?.embedding ?? null;
}
