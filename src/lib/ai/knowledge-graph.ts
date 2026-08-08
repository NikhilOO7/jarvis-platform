import { prisma } from "@/lib/prisma";
import type { ExtractedEntity } from "@/lib/ai/entities";

/**
 * Upserts entities, links them to a knowledge item, and reinforces
 * co-occurrence relations between entities that appear together.
 * Best-effort: failures never break ingestion.
 */
export async function linkEntities(knowledgeItemId: string, entities: ExtractedEntity[]) {
  if (entities.length === 0) return { linked: 0 };

  const entityIds: string[] = [];

  for (const entity of entities) {
    try {
      const record = await prisma.entity.upsert({
        where: { type_name: { type: entity.type, name: entity.name } },
        update: entity.context ? { description: entity.context } : {},
        create: { type: entity.type, name: entity.name, description: entity.context }
      });
      await prisma.entityMention.upsert({
        where: { entityId_knowledgeItemId: { entityId: record.id, knowledgeItemId } },
        update: entity.context ? { context: entity.context } : {},
        create: { entityId: record.id, knowledgeItemId, context: entity.context }
      });
      entityIds.push(record.id);
    } catch {
      // skip this entity, keep linking the rest
    }
  }

  // Co-occurrence: entities captured together are related; weight grows with repetition.
  for (let i = 0; i < entityIds.length; i++) {
    for (let j = i + 1; j < entityIds.length; j++) {
      const [fromEntityId, toEntityId] = [entityIds[i], entityIds[j]].sort();
      try {
        await prisma.entityRelation.upsert({
          where: {
            fromEntityId_toEntityId_relation: { fromEntityId, toEntityId, relation: "mentioned_with" }
          },
          update: { weight: { increment: 1 } },
          create: { fromEntityId, toEntityId, relation: "mentioned_with", weight: 1 }
        });
      } catch {
        // relation reinforcement is best-effort
      }
    }
  }

  return { linked: entityIds.length };
}
