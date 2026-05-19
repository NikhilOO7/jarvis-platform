import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type RunLog = {
  at?: string;
  event?: string;
  message?: string;
};

async function getWorkflowRuns() {
  if (!env.DATABASE_URL) return [];

  try {
    return await prisma.workflowRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        workflowTemplate: true,
        approvals: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
  } catch {
    return [];
  }
}

const designModeRuns = [
  {
    id: "design-email-run",
    command: "Draft a professional reply to the latest client email",
    status: "WAITING_FOR_APPROVAL",
    workflowTemplate: { name: "Email Draft And Reply" },
    approvals: [{ status: "PENDING" }],
    logs: [
      {
        at: new Date().toISOString(),
        event: "COMMAND_ROUTED",
        message: "Command routed to Email Agent. Approval gate armed."
      }
    ]
  },
  {
    id: "design-research-run",
    command: "Research competitors for my AI assistant product",
    status: "QUEUED",
    workflowTemplate: { name: "Research Brief Generator" },
    approvals: [],
    logs: [
      {
        at: new Date().toISOString(),
        event: "COMMAND_ROUTED",
        message: "Research workflow queued for connector execution."
      }
    ]
  }
];

function normalizeLogs(logs: unknown): RunLog[] {
  return Array.isArray(logs) ? (logs as RunLog[]) : [];
}

export default async function RunsPage() {
  const runs = await getWorkflowRuns();
  const visibleRuns = runs.length > 0 ? runs : designModeRuns;
  const designMode = runs.length === 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Runs // Native Runtime"
        title="Workflow execution monitor."
        description="Track routed commands as native Jarvis workflow runs with status, approval gates, and execution logs."
      />

      <section className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">{designMode ? "Design Mode" : "Live Runtime"}</div>
            <h2>Run Queue</h2>
          </div>
          <span className="pill">{visibleRuns.length} Runs</span>
        </div>

        <div className="list">
          {visibleRuns.map((run) => {
            const logs = normalizeLogs(run.logs);

            return (
              <article className="list-item" key={run.id}>
                <div className="section-heading compact">
                  <div>
                    <div className="pill-row">
                      <span className="pill">{run.status}</span>
                      <span className="pill">{run.approvals.length} approval gates</span>
                      <span className="pill">{run.id.slice(0, 10)}</span>
                    </div>
                    <h3 style={{ marginTop: 12 }}>{run.workflowTemplate?.name || "Workflow run"}</h3>
                  </div>
                </div>
                <p>{run.command}</p>
                <div className="timeline-list" style={{ marginTop: 12 }}>
                  {logs.slice(-4).map((log, index) => (
                    <div className="timeline-item" key={`${run.id}-${log.event}-${index}`}>
                      <div className="timeline-index">{index + 1}</div>
                      <div>
                        <strong>{log.event || "RUN_EVENT"}</strong>
                        <p className="muted">{log.message || "Workflow status updated."}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
