import { z } from "zod";
import type { EntityType } from "@prisma/client";
import { getOpenAIClient } from "@/lib/openai";
import { env } from "@/lib/env";

export type ExtractedEntity = {
  type: EntityType;
  name: string;
  context?: string;
};

const ENTITY_TYPES: EntityType[] = [
  "FOOD",
  "INGREDIENT",
  "WORKOUT",
  "MUSCLE",
  "EQUIPMENT",
  "COMPANY",
  "JOB",
  "SKILL",
  "PRODUCT",
  "CONCEPT",
  "PERSON",
  "GOAL",
  "NOTE"
];

const MAX_ENTITIES = 8;

const extractionSchema = z.object({
  entities: z
    .array(
      z.object({
        type: z.string(),
        name: z.string().min(1),
        context: z.string().optional()
      })
    )
    .default([])
});

function normalizeName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, 60);
}

/**
 * Extracts typed entities from captured content via the LLM. Returns [] when no
 * API key is configured — the graph simply stays sparse in offline mode.
 */
export async function extractEntities(input: {
  title?: string | null;
  summary?: string | null;
  text?: string | null;
}): Promise<ExtractedEntity[]> {
  const client = getOpenAIClient();
  if (!client) return [];

  const combined = [input.title, input.summary, input.text].filter(Boolean).join("\n").slice(0, 6000);
  if (combined.length < 20) return [];

  try {
    const response = await client.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "Extract the distinct real-world entities from saved personal content.",
            `Valid types: ${ENTITY_TYPES.join(", ")}.`,
            `Return JSON: {"entities": [{"type": string, "name": string, "context": string (≤10 words, why it appears)}]}.`,
            `At most ${MAX_ENTITIES}, most important first. Canonical short names ("creatine", not "creatine monohydrate supplementation"). No duplicates, no generic words.`
          ].join("\n")
        },
        { role: "user", content: combined }
      ]
    });

    const parsed = extractionSchema.parse(JSON.parse(response.choices[0]?.message.content ?? "{}"));
    const seen = new Set<string>();
    const entities: ExtractedEntity[] = [];

    for (const entity of parsed.entities) {
      const type = entity.type.toUpperCase() as EntityType;
      if (!ENTITY_TYPES.includes(type)) continue;
      const name = normalizeName(entity.name);
      if (!name) continue;
      const key = `${type}:${name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entities.push({ type, name, context: entity.context?.slice(0, 120) });
      if (entities.length >= MAX_ENTITIES) break;
    }

    return entities;
  } catch {
    return [];
  }
}
