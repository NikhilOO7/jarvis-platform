import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

async function getBriefing() {
  if (!env.DATABASE_URL) return [];

  try {
    const latest = await prisma.knowledgeItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { source: true }
    });

    if (latest.length === 0) return [];
    return latest.map((item) => ({
      title: item.title,
      summary: item.summary,
      category: item.category
    }));
  } catch {
    return [];
  }
}

export default async function BriefingPage() {
  const briefing = await getBriefing();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Briefing // Situation Room"
        title="Current signal assessment."
        description="Patterns, priorities, useful saves, pending decisions, and plans worth generating from the knowledge core."
      />

      <section className="card">
        {briefing.length === 0 ? (
          <div className="list">
            <div className="list-item">No database-backed briefing yet. The briefing array is waiting for captured knowledge.</div>
            <div className="list-item">Recommended first signals: one recipe, one workout post, one tech article, one product, and one job.</div>
            <div className="list-item">Next system upgrade: semantic retrieval and a weekly digest generator.</div>
          </div>
        ) : (
          <div className="list">
            {briefing.map((item) => (
              <article className="list-item" key={`${item.category}-${item.title}`}>
                <span className="pill">{item.category}</span>
                <h3 style={{ marginTop: 12 }}>{item.title}</h3>
                <p className="muted">{item.summary}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
