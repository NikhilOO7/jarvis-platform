import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        eyebrow="Knowledge // Memory Lattice"
        title="Structured memory matrix."
        description="Every processed capture can become summaries, insights, actions, entities, relationships, and retrieval vectors."
      />

      <section className="card">
        {items.length === 0 ? (
          <div className="empty-state">No memory nodes detected. Connect Postgres and capture a few signals to activate the lattice.</div>
        ) : (
          <div className="list">
            {items.map((item) => (
              <article className="list-item" key={item.id}>
                <div className="pill-row">
                  <span className="pill">{categoryLabels[item.category]}</span>
                  {item.source?.platform ? <span className="pill">{item.source.platform}</span> : null}
                </div>
                <h3 style={{ marginTop: 12 }}>{item.title}</h3>
                <p className="muted">{item.summary}</p>
                <div className="label">Next action</div>
                <div>{item.actions[0]}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
