import { AppShell } from "@/components/app-shell";
import { ApprovalActions } from "@/components/approval-actions";
import { PageHeader } from "@/components/page-header";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

async function getApprovals() {
  if (!env.DATABASE_URL) return { approvals: [], mode: "OFFLINE" as const, message: "Database not configured." };
  try {
    const approvals = await prisma.approvalRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        workflowRun: { include: { workflowTemplate: true } }
      }
    });
    return { approvals, mode: "LIVE" as const, message: approvals.length === 0 ? "No approval requests recorded." : null };
  } catch {
    return { approvals: [], mode: "DEGRADED" as const, message: "Approval query failed." };
  }
}

export default async function ApprovalsPage() {
  const { approvals, mode, message } = await getApprovals();
  const pendingCount = approvals.filter((a) => a.status === "PENDING").length;

  return (
    <AppShell>
      <TopBar label="J.A.R.V.I.S · APPROVALS" uplink={mode.toLowerCase()} center="EXTERNAL WRITES DISABLED" />
      <SubRail
        extras={[
          { label: "PENDING", value: pendingCount, variant: pendingCount > 0 ? "warn" : undefined },
          { label: "MODE", value: mode, variant: mode === "DEGRADED" ? "warn" : undefined }
        ]}
      />
      <PageHeader
        eyebrow="Approvals // Safety Gate"
        title="[b]Human control[/b] before external action."
        description="Approval state is protected against replay. External execution remains disabled until approvals bind to exact immutable payloads."
        meta={[
          { label: "QUEUE ·", value: `${pendingCount} PENDING`, highlight: true }
        ]}
      />

      <section className="panel">
        <div className="panel-head">
          <h3>APPROVAL QUEUE</h3>
          <span className="tag">{mode} · {approvals.length} ITEMS</span>
        </div>

        <div className="module-grid">
          {approvals.length === 0 ? (
            <div className="empty-state"><p>{message}</p></div>
          ) : approvals.map((approval) => (
                <article className="module" key={approval.id}>
                  <div className="module-head">
                    <div className="module-id">
                      <span className="bracket">⟦</span> {approval.actionType} <span className="bracket">⟧</span>{" "}
                      <span className="open">› {approval.status}</span>
                    </div>
                    <div className={`module-status${approval.status === "PENDING" ? " warn" : ""}`}>
                      <span className="led" />
                      {approval.status}
                    </div>
                  </div>
                  <h3>{approval.title}</h3>
                  <p className="desc">{approval.description}</p>
                  <div className="caps">
                    <span>{approval.workflowRun?.workflowTemplate?.name || "Workflow run"}</span>
                  </div>
                  <div className="approval-bar" style={{ marginTop: "auto" }}>
                    <ApprovalActions id={approval.id} initialStatus={approval.status} />
                  </div>
                </article>
              ))}
        </div>
      </section>
    </AppShell>
  );
}
