import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";
import { workflowTemplates } from "@/lib/workflow-templates";

export default function WorkflowsPage() {
  return (
    <AppShell>
      <TopBar label="J.A.R.V.I.S · WORKFLOWS" uplink="defined" center="PHASE 0 SAFE MODE" />
      <SubRail
        extras={[
          { label: "TEMPLATES", value: workflowTemplates.length },
          { label: "EXTERNAL WRITES", value: "DISABLED" }
        ]}
      />
      <PageHeader
        eyebrow="Workflows // Automation Matrix"
        title="Native Jarvis [b]execution templates[/b]."
        description="Reusable plans for text commands, local email drafts, calendar proposals, saved-memory research, expenses, and briefings. Every step exposes an explicit tool allowlist."
        meta={[
          { label: "MATRIX ·", value: `${workflowTemplates.length} TEMPLATES`, highlight: true }
        ]}
      />

      <section className="workflow-grid">
        {workflowTemplates.map((workflow, i) => (
          <article className="panel workflow-card" key={workflow.key}>
            <div className="module-head">
              <div className="module-id">
                <span className="bracket">⟦</span> WORKFLOW-{String(i + 1).padStart(2, "0")} <span className="bracket">⟧</span>{" "}
                <span className="open">› {workflow.trigger.toUpperCase()}</span>
              </div>
              <span className={`module-status${workflow.risk === "high" ? " warn" : ""}`}>
                <span className="led" />
                {workflow.risk.toUpperCase()} RISK
              </span>
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500, margin: "10px 0 6px" }}>
              {workflow.name}
            </h3>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{workflow.description}</p>
            <div className="pill-row" style={{ marginTop: 10 }}>
              {workflow.agentKinds.map((kind) => (
                <span className="pill" key={kind}>{kind}</span>
              ))}
            </div>
            <div className="timeline-list" style={{ marginTop: 14 }}>
              {workflow.steps.map((step, index) => (
                <div className="timeline-item" key={step.title}>
                  <div className="timeline-index">{index + 1}</div>
                  <div className="module-icon compact">
                    <span style={{ fontSize: 11 }}>›</span>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 3 }}>
                      {step.title}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>{step.description}</div>
                    {step.approvalRequired ? (
                      <span className="pill" style={{ marginTop: 6, display: "inline-block" }}>APPROVAL GATE</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="caps" style={{ marginTop: 14 }}>
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
