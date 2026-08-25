import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";
import { categoryLabels } from "@/lib/categories";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

async function getKnowledgeData() {
  if (!env.DATABASE_URL) {
    return { items: [], entityCount: 0, state: "OFFLINE" as const };
  }
  try {
    const [items, entityCount] = await Promise.all([
      prisma.knowledgeItem.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { source: true, entities: { include: { entity: true } } }
      }),
      prisma.entity.count()
    ]);
    return { items, entityCount, state: "LIVE" as const };
  } catch {
    return { items: [], entityCount: 0, state: "DEGRADED" as const };
  }
}

type NearDupFlag = { knowledgeItemId: string; title: string; score: number };

function getNearDuplicates(rawMetadata: unknown): NearDupFlag[] {
  if (!rawMetadata || typeof rawMetadata !== "object") return [];
  const flags = (rawMetadata as { nearDuplicates?: unknown }).nearDuplicates;
  return Array.isArray(flags) ? (flags as NearDupFlag[]) : [];
}

export default async function KnowledgePage() {
  const { items, entityCount, state } = await getKnowledgeData();

  return (
    <AppShell>
      <TopBar label="J.A.R.V.I.S · MEMORY" uplink={state.toLowerCase()} center={`SAVED KNOWLEDGE · ${state}`} />
      <SubRail
        extras={[
          { label: "NODES", value: items.length },
          { label: "ENTITIES", value: entityCount },
          { label: "STATE", value: state, variant: state === "LIVE" ? "ok" : "warn" }
        ]}
      />
      <PageHeader
        eyebrow="Knowledge // Memory Lattice"
        title="Structured [b]memory matrix[/b]."
        description="Every processed capture can become summaries, insights, actions, entities, relationships, and retrieval vectors."
        meta={[
          { label: "TOTAL", value: String(items.length), highlight: true },
          { label: "RETRIEVAL", value: "RUNTIME SELECTED" }
        ]}
      />

      <section className="panel">
        <div className="panel-head"><h3>MEMORY NODES</h3><span className="tag">{items.length} ITEMS</span></div>
        {items.length === 0 ? (
          <div className="empty-state">
            <div>
              <p className="mono" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)" }}>
                NO MEMORY NODES DETECTED
              </p>
              <p style={{ marginTop: 8 }}>
                {state === "OFFLINE"
                  ? "Set DATABASE_URL and run migrations to enable saved knowledge."
                  : state === "DEGRADED"
                    ? "Knowledge could not be loaded. Check the database connection and application logs."
                    : "Capture a few signals to create saved knowledge."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid" style={{ gap: 12 }}>
            {items.map((item) => (
              <article className="file-card" key={item.id}>
                <div className="fhead">
                  <span>FILE-{item.id.slice(0, 6).toUpperCase()}</span>
                  <span><b>{categoryLabels[item.category]}</b></span>
                </div>
                <div className="ftitle">{item.title}</div>
                <div className="fdesc">{item.summary}</div>
                <div className="fmeta">
                  {item.source?.platform ? <span>{item.source.platform}</span> : null}
                  <span className="alpha">CONF {item.confidence.toFixed(2)}</span>
                  {item.actions[0] ? <span>NEXT · {item.actions[0].slice(0, 24)}</span> : null}
                </div>
                {item.entities.length > 0 || getNearDuplicates(item.source?.rawMetadata).length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {item.entities.map((mention) => (
                      <span className="pill" key={mention.id} title={mention.context ?? undefined}>
                        {mention.entity.type} · {mention.entity.name}
                      </span>
                    ))}
                    {getNearDuplicates(item.source?.rawMetadata).map((dup) => (
                      <span
                        className="pill"
                        key={`${item.id}-dup-${dup.knowledgeItemId}`}
                        style={{ borderColor: "var(--accent-2, #ffd27a)", color: "var(--accent-2, #ffd27a)" }}
                        title={`Semantically similar saved item (${Math.round(dup.score * 100)}% match)`}
                      >
                        ≈ SIMILAR · {dup.title.slice(0, 32)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
