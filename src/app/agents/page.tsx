import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";
import { agentModules, automationStack, executionSteps } from "@/lib/agent-features";

const STATUS_BY_INDEX = ["online", "online", "warn", "online", "idle", "online"] as const;
const TELEMETRY = [
  { p50: "180ms", runs: 42, extra: { label: "APPROVALS", val: 2 } },
  { p50: "210ms", runs: 18, extra: { label: "APPROVALS", val: 1 } },
  { p50: "340ms", runs: 9, extra: { label: "RETRIES", val: 2, warn: true } },
  { p50: "1.2s", runs: 27, extra: { label: "SOURCES", val: 198 } },
  { p50: "—", runs: 0, extra: { label: "CONNECTOR", val: "OFF" } },
  { p50: "12ms", runs: 156, extra: { label: "FAILED", val: 0 } }
];

export default function AgentsPage() {
  return (
    <AppShell>
      <TopBar label="J.A.R.V.I.S · AGENT BAY" uplink="active" center="DELEGATION READY" />
      <SubRail
        extras={[
          { label: "QUEUE", value: 3, variant: "warn" },
          { label: "RUNNING", value: 2 },
          { label: "ROUTER", value: "gpt-4o" }
        ]}
      />

      <PageHeader
        eyebrow="Agent Ecosystem // Expansion Bay"
        title="Delegated [b]workflow command[/b] layer."
        description="Six modules online. Approval gates engaged on impactful actions. Voice channel and Telegram bridge optional."
        meta={[
          { label: "BAY ·", value: "04 / EXP" },
          { label: "CLASS::", value: "ALPHA", highlight: true },
          { label: "OPS", value: "6 / 6 ARMED" }
        ]}
      />

      <section className="module-grid">
        {agentModules.map((module, i) => {
          const status = STATUS_BY_INDEX[i] ?? "online";
          const tel = TELEMETRY[i];
          return (
            <article className="module" key={module.title}>
              <div className="module-head">
                <div className="module-id">
                  <span className="bracket">⟦</span> MODULE-0{i + 1} <span className="bracket">⟧</span>{" "}
                  <span className="open">{status === "idle" ? "› IDLE" : "› OPEN"}</span>
                </div>
                <div className={`module-status ${status === "online" ? "" : status}`}>
                  <span className="led" />
                  {status === "online" ? "ONLINE" : status === "warn" ? "DEGRADED" : "IDLE"}
                </div>
              </div>
              <h3>{module.title}</h3>
              <p className="desc">{module.description}</p>
              <div className="caps">
                {module.capabilities.slice(0, 5).map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
              <div className="telemetry">
                <span>P50 <b>{tel.p50}</b></span>
                <span>RUNS <b>{tel.runs}</b></span>
                <span>
                  {tel.extra.label}{" "}
                  <b className={tel.extra.warn ? "warn" : ""}>{tel.extra.val}</b>
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid content-grid" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panel-head"><h3>EXECUTION MODEL</h3><span className="tag">7 STEPS</span></div>
          <div className="timeline-list">
            {executionSteps.map((step, index) => (
              <div className="timeline-item" key={step}>
                <div className="timeline-index">{index + 1}</div>
                <div className="module-icon compact">
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>›</span>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>
                    STEP {index + 1}
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>{step}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h3>VOICE + AUTOMATION STACK</h3><span className="tag">8 LAYERS</span></div>
          <div className="timeline-list">
            {automationStack.map((item, index) => (
              <div className="timeline-item" key={item.title}>
                <div className="timeline-index">{index + 1}</div>
                <div className="module-icon compact">
                  <item.icon size={14} />
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 3 }}>
                    {item.title}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head"><h3>SAFETY GATES · APPROVAL REQUIRED</h3><span className="tag">6 RULES</span></div>
        <div className="module-grid">
          {[
            "Emails drafted automatically but sent only after explicit approval.",
            "Calendar changes show attendees, time, title, description before execution.",
            "Contact edits, financial records, sensitive data transfers require confirmation.",
            "Internet research separates saved knowledge, external sources, uncertain claims.",
            "Every workflow step is logged for review, debugging, and memory updates.",
            "Personality stays useful and original, without imitating real people or voices."
          ].map((rule, i) => (
            <div className="list-item" key={i}>
              <div className="mono" style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 6 }}>
                RULE · {String(i + 1).padStart(2, "0")}
              </div>
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{rule}</div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
