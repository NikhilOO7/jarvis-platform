import { AppShell } from "@/components/app-shell";
import { ApprovalActions } from "@/components/approval-actions";
import { PageHeader } from "@/components/page-header";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

async function getApprovals() {
  if (!env.DATABASE_URL) return [];
  try {
    return await prisma.approvalRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        workflowRun: { include: { workflowTemplate: true } }
      }
    });
  } catch {
    return [];
  }
}

const designModeApprovals = [
  { title: "Send drafted client email", actionType: "EMAIL_SEND", description: "External message requires explicit approval before delivery.", status: "PENDING", workflow: "Email Draft And Reply" },
  { title: "Create calendar event", actionType: "CALENDAR_WRITE", description: "Meeting creation requires confirmation of attendees, time, and details.", status: "PENDING", workflow: "Calendar Scheduling Assistant" },
  { title: "Save parsed expense", actionType: "EXPENSE_WRITE", description: "Financial record creation requires review before storage.", status: "PENDING", workflow: "Expense Receipt Logger" }
];

export default async function ApprovalsPage() {
  const approvals = await getApprovals();
  const designMode = approvals.length === 0;
  const pendingCount = designMode
    ? designModeApprovals.length
    : approvals.filter((a) => a.status === "PENDING").length;

  return (
    <AppShell>
      <TopBar label="J.A.R.V.I.S · APPROVALS" uplink="armed" center="SAFETY GATE ENGAGED" />
      <SubRail
        extras={[
          { label: "PENDING", value: pendingCount, variant: pendingCount > 0 ? "warn" : undefined },
          { label: "MODE", value: designMode ? "DEMO" : "LIVE" }
        ]}
      />
      <PageHeader
        eyebrow="Approvals // Safety Gate"
        title="[b]Human control[/b] before external action."
        description="Review emails, calendar changes, contact edits, financial records, and sensitive data transfers before Jarvis executes them."
        meta={[
          { label: "QUEUE ·", value: `${pendingCount} PENDING`, highlight: true }
        ]}
      />

      <section className="panel">
        <div className="panel-head">
          <h3>APPROVAL QUEUE</h3>
          <span className="tag">{designMode ? "DESIGN MODE" : `${approvals.length} ITEMS`}</span>
        </div>

        <div className="module-grid">
          {designMode
            ? designModeApprovals.map((approval) => (
                <article className="module" key={approval.title}>
                  <div className="module-head">
                    <div className="module-id">
                      <span className="bracket">⟦</span> {approval.actionType} <span className="bracket">⟧</span>{" "}
                      <span className="open">› PENDING</span>
                    </div>
                    <div className="module-status warn"><span className="led" />{approval.status}</div>
                  </div>
                  <h3>{approval.title}</h3>
                  <p className="desc">{approval.description}</p>
                  <div className="caps"><span>{approval.workflow}</span></div>
                  <div className="approval-bar" style={{ marginTop: "auto" }}>
                    <ApprovalActions initialStatus={approval.status} disabled />
                  </div>
                </article>
              ))
            : approvals.map((approval) => (
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
