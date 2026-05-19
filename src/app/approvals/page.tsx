import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

async function getApprovals() {
  if (!env.DATABASE_URL) return [];

  try {
    return await prisma.approvalRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        workflowRun: {
          include: {
            workflowTemplate: true
          }
        }
      }
    });
  } catch {
    return [];
  }
}

const designModeApprovals = [
  {
    title: "Send drafted client email",
    actionType: "EMAIL_SEND",
    description: "External message requires explicit approval before delivery.",
    status: "PENDING",
    workflow: "Email Draft And Reply"
  },
  {
    title: "Create calendar event",
    actionType: "CALENDAR_WRITE",
    description: "Meeting creation requires confirmation of attendees, time, and details.",
    status: "PENDING",
    workflow: "Calendar Scheduling Assistant"
  },
  {
    title: "Save parsed expense",
    actionType: "EXPENSE_WRITE",
    description: "Financial record creation requires review before storage.",
    status: "PENDING",
    workflow: "Expense Receipt Logger"
  }
];

export default async function ApprovalsPage() {
  const approvals = await getApprovals();
  const designMode = approvals.length === 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Approvals // Safety Gate"
        title="Human control before external action."
        description="Review emails, calendar changes, contact edits, financial records, and sensitive data transfers before Jarvis executes them."
      />

      <section className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">{designMode ? "Design Mode" : "Live Queue"}</div>
            <h2>Approval Queue</h2>
          </div>
          <span className="pill">{designMode ? "No Database Items" : `${approvals.length} Items`}</span>
        </div>

        <div className="module-grid">
          {designMode
            ? designModeApprovals.map((approval) => (
                <article className="module-card" key={approval.title}>
                  <div className="status-light" />
                  <div>
                    <div className="pill-row">
                      <span className="pill">{approval.status}</span>
                      <span className="pill">{approval.actionType}</span>
                    </div>
                    <h3 style={{ marginTop: 12 }}>{approval.title}</h3>
                    <p className="muted">{approval.description}</p>
                    <div className="label">{approval.workflow}</div>
                  </div>
                </article>
              ))
            : approvals.map((approval) => (
                <article className="module-card" key={approval.id}>
                  <div className={approval.status === "PENDING" ? "status-light" : "status-light online"} />
                  <div>
                    <div className="pill-row">
                      <span className="pill">{approval.status}</span>
                      <span className="pill">{approval.actionType}</span>
                    </div>
                    <h3 style={{ marginTop: 12 }}>{approval.title}</h3>
                    <p className="muted">{approval.description}</p>
                    <div className="label">{approval.workflowRun?.workflowTemplate?.name || "Workflow run"}</div>
                  </div>
                </article>
              ))}
        </div>
      </section>
    </AppShell>
  );
}
