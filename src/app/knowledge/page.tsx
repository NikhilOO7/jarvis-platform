import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";
import { categoryLabels } from "@/lib/categories";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

async function getKnowledge() {
  if (!env.DATABASE_URL) return [];
  try {
    return await prisma.knowledgeItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { source: true }
    });
  } catch {
    return [];
  }
}

export default async function KnowledgePage() {
  const items = await getKnowledge();

  return (
    <AppShell>
      <TopBar label="J.A.R.V.I.S · MEMORY" uplink="online" center="LATTICE INDEXED" />
      <SubRail
        extras={[
          { label: "NODES", value: items.length },
          { label: "RECENT", value: items.length > 0 ? "LIVE" : "EMPTY" }
        ]}
      />
      <PageHeader
        eyebrow="Knowledge // Memory Lattice"
        title="Structured [b]memory matrix[/b]."
        description="Every processed capture can become summaries, insights, actions, entities, relationships, and retrieval vectors."
        meta={[
          { label: "TOTAL", value: String(items.length), highlight: true },
          { label: "INDEX", value: "vector + keyword" }
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
              <p style={{ marginTop: 8 }}>Connect Postgres and capture a few signals to activate the lattice.</p>
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
                  <span className="alpha">CONF {(item.confidence ?? 0.8).toFixed(2)}</span>
                  {item.actions[0] ? <span>NEXT · {item.actions[0].slice(0, 24)}</span> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
