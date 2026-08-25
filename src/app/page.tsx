import { AppShell } from "@/components/app-shell";
import { StandbyDesk } from "@/components/standby-desk";
import { categoryLabels } from "@/lib/categories";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

async function getDeskData() {
  if (!env.DATABASE_URL) {
    return {
      stats: { rawItems: 0, knowledgeItems: 0, duplicates: 0 },
      recent: [],
      pendingApprovals: 0,
      systemState: "OFFLINE" as const,
      statusMessage: "Database not configured"
    };
  }
  try {
    const [rawItems, knowledgeItems, duplicates, recentRaw, pendingApprovals] = await Promise.all([
      prisma.rawSourceItem.count(),
      prisma.knowledgeItem.count(),
      prisma.rawSourceItem.count({ where: { status: "DUPLICATE" } }),
      prisma.rawSourceItem.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, category: true, createdAt: true, platform: true }
      }),
      prisma.approvalRequest.count({ where: { status: "PENDING" } }).catch(() => 0)
    ]);

    return {
      stats: { rawItems, knowledgeItems, duplicates },
      recent: recentRaw.map((r) => {
        const t = new Date(r.createdAt);
        const hh = String(t.getHours()).padStart(2, "0");
        const mm = String(t.getMinutes()).padStart(2, "0");
        return {
          when: `${hh}:${mm} · ${categoryLabels[r.category]?.toUpperCase() || r.category}`,
          category: r.category,
          title: r.title || r.platform || "Captured item"
        };
      }),
      pendingApprovals,
      systemState: "LIVE" as const,
      statusMessage: "Database connected"
    };
  } catch {
    return {
      stats: { rawItems: 0, knowledgeItems: 0, duplicates: 0 },
      recent: [],
      pendingApprovals: 0,
      systemState: "DEGRADED" as const,
      statusMessage: "Database query failed"
    };
  }
}

export default async function DashboardPage() {
  const { stats, recent, pendingApprovals, systemState, statusMessage } = await getDeskData();

  return (
    <AppShell hideSidebar>
      <StandbyDesk
        stats={stats}
        recent={recent}
        pendingApprovals={pendingApprovals}
        systemState={systemState}
        statusMessage={statusMessage}
        capabilities={{
          database: systemState === "LIVE",
          ai: Boolean(env.OPENAI_API_KEY),
          auth: Boolean(env.JARVIS_OPERATOR_PASSWORD)
        }}
      />
    </AppShell>
  );
}
