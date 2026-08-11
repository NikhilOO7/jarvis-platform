import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RunActions } from "@/components/run-actions";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { sweepStaleRuns } from "@/lib/agents/executor";

type RunLog = { at?: string; event?: string; message?: string };
type RunOutputShape = {
  summary?: string;
  engine?: string;
  artifacts?: Array<{ type?: string; title?: string }>;
};

function normalizeOutput(output: unknown): RunOutputShape | null {
  return output && typeof output === "object" && !Array.isArray(output) ? (output as RunOutputShape) : null;
}

export const dynamic = "force-dynamic";

async function getWorkflowRuns() {
  if (!env.DATABASE_URL) return [];
  try {
    await sweepStaleRuns();
    return await prisma.workflowRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        workflowTemplate: true,
        approvals: { orderBy: { createdAt: "asc" } }
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
    logs: [{ at: new Date().toISOString(), event: "COMMAND_ROUTED", message: "Command routed to Email Agent. Approval gate armed." }]
  },
  {
    id: "design-research-run",
    command: "Research competitors for my AI assistant product",
    status: "QUEUED",
    workflowTemplate: { name: "Research Brief Generator" },
    approvals: [],
    logs: [{ at: new Date().toISOString(), event: "COMMAND_ROUTED", message: "Research workflow queued for connector execution." }]
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
      <TopBar label="J.A.R.V.I.S · RUNS" uplink="active" center={designMode ? "DESIGN MODE · NO DB" : "LIVE RUNTIME"} />
      <SubRail
        extras={[
          { label: "RUNS", value: visibleRuns.length },
          { label: "MODE", value: designMode ? "DEMO" : "LIVE" }
        ]}
      />
      <PageHeader
        eyebrow="Runs // Native Runtime"
        title="Workflow [b]execution monitor[/b]."
        description="Track routed commands as native Jarvis workflow runs with status, approval gates, and execution logs."
        meta={[
          { label: "QUEUE ·", value: `${visibleRuns.length} RUNS`, highlight: true }
        ]}
      />

      <section className="panel">
        <div className="panel-head"><h3>RUN QUEUE</h3><span className="tag">{designMode ? "DESIGN MODE" : "LIVE"}</span></div>

        <div className="grid" style={{ gap: 12 }}>
          {visibleRuns.map((run) => {
            const logs = normalizeLogs(run.logs);
            const isWaiting = run.status === "WAITING_FOR_APPROVAL";
            const output = normalizeOutput("output" in run ? run.output : null);

            return (
              <article className="file-card" key={run.id}>
                <div className="fhead">
                  <span>RUN-{run.id.slice(0, 8).toUpperCase()}</span>
                  <span><b>{run.status}</b></span>
                </div>
                <div className="ftitle">{run.workflowTemplate?.name || "Workflow run"}</div>
                <div className="fdesc">{run.command}</div>
                <div className="fmeta">
                  <span className={isWaiting ? "warn" : "alpha"}>{run.approvals.length} GATES</span>
                  <span>LOG · {logs.length}</span>
                  {output?.engine ? <span>ENGINE · {output.engine.toUpperCase()}</span> : null}
                </div>
                {output?.summary ? (
                  <div className="routing-card" style={{ marginTop: 12 }}>
                    <h4>RESULT</h4>
                    <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>{output.summary}</div>
                    {output.artifacts && output.artifacts.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {output.artifacts.map((artifact, index) => (
                          <span className="pill" key={`${run.id}-artifact-${index}`}>
                            {(artifact.type || "artifact").replaceAll("_", " ").toUpperCase()}
                            {artifact.title ? ` · ${artifact.title}` : ""}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <RunActions id={run.id} status={run.status} disabled={designMode} />
                {logs.length > 0 ? (
                  <div className="timeline-list" style={{ marginTop: 12 }}>
                    {logs.slice(-4).map((log, index) => (
                      <div className="timeline-item" key={`${run.id}-${log.event}-${index}`}>
                        <div className="timeline-index">{index + 1}</div>
                        <div className="module-icon compact">
                          <span style={{ fontSize: 11 }}>›</span>
                        </div>
                        <div>
                          <div className="mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 3 }}>
                            {log.event || "RUN_EVENT"}
                          </div>
                          <div className="muted" style={{ fontSize: 12 }}>{log.message || "Workflow status updated."}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
