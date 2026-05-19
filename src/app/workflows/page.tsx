import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { workflowTemplates } from "@/lib/workflow-templates";

export default function WorkflowsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Workflows // Automation Matrix"
        title="n8n-style execution templates."
        description="Reusable automation plans for voice commands, email replies, scheduling, research, expenses, and daily briefings."
      />

      <section className="workflow-grid">
        {workflowTemplates.map((workflow) => (
          <article className="card workflow-card" key={workflow.key}>
            <div className="section-heading">
              <div>
                <div className="eyebrow">{workflow.trigger}</div>
                <h2>{workflow.name}</h2>
              </div>
              <span className="pill">{workflow.risk} risk</span>
            </div>
            <p className="muted">{workflow.description}</p>
            <div className="pill-row">
              {workflow.agentKinds.map((kind) => (
                <span className="pill" key={kind}>
                  {kind}
                </span>
              ))}
            </div>
            <div className="timeline-list" style={{ marginTop: 14 }}>
              {workflow.steps.map((step, index) => (
                <div className="timeline-item" key={step.title}>
                  <div className="timeline-index">{index + 1}</div>
                  <div>
                    <strong>{step.title}</strong>
                    <p className="muted">{step.description}</p>
                    {step.approvalRequired ? <span className="pill">Approval Gate</span> : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="capability-list">
              {workflow.requiredScopes.map((scope) => (
                <span key={scope}>{scope}</span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
