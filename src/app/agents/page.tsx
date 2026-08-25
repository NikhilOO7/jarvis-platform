import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";
import { agentModules, automationStack, executionSteps } from "@/lib/agent-features";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getGoogleStatus } from "@/lib/connectors/google";

async function getRunCounts() {
  if (!env.DATABASE_URL) return { queued: 0, running: 0, status: "OFFLINE" as const };
  try {
    const [queued, running] = await Promise.all([
      prisma.workflowRun.count({ where: { status: "QUEUED" } }),
      prisma.workflowRun.count({ where: { status: "RUNNING" } })
    ]);
    return { queued, running, status: "LIVE" as const };
  } catch {
    return { queued: 0, running: 0, status: "DEGRADED" as const };
  }
}

type ModuleState = {
  status: "online" | "warn" | "idle";
  label: string;
  mode: string;
  effects: string;
};

export default async function AgentsPage() {
  const [{ queued, running, status: runtimeStatus }, google] = await Promise.all([getRunCounts(), getGoogleStatus()]);
  const executionConfigured = Boolean(env.DATABASE_URL && env.OPENAI_API_KEY);
  const googleReadsEnabled = Boolean(google.connected && env.JARVIS_OPERATOR_PASSWORD);
  const moduleStates: ModuleState[] = [
    { status: googleReadsEnabled && executionConfigured ? "online" : googleReadsEnabled ? "warn" : "idle", label: googleReadsEnabled ? "READ ONLY" : "NOT CONNECTED", mode: "Gmail read + local drafts", effects: "NO SEND" },
    { status: googleReadsEnabled && executionConfigured ? "online" : googleReadsEnabled ? "warn" : "idle", label: googleReadsEnabled ? "READ ONLY" : "NOT CONNECTED", mode: "Calendar read + proposals", effects: "NO WRITE" },
    { status: "idle", label: "NOT IMPLEMENTED", mode: "Schema only", effects: "NONE" },
    { status: executionConfigured ? "warn" : "idle", label: executionConfigured ? "LOCAL ONLY" : "NOT READY", mode: "Saved-memory research", effects: "NO WEB" },
    { status: executionConfigured ? "online" : "idle", label: executionConfigured ? "LOCAL" : "NOT READY", mode: "Knowledge record", effects: "LOCAL WRITE" },
    { status: executionConfigured ? "online" : "idle", label: executionConfigured ? "AVAILABLE" : "NOT READY", mode: "Deterministic parser", effects: "NO EXTERNAL" }
  ];
  const availableCount = moduleStates.filter((state) => state.status !== "idle").length;

  return (
    <AppShell>
      <TopBar label="J.A.R.V.I.S · AGENT BAY" uplink={runtimeStatus.toLowerCase()} center="CAPABILITY MAP" />
      <SubRail
        extras={[
          { label: "QUEUE", value: queued, variant: queued > 0 ? "warn" : undefined },
          { label: "RUNNING", value: running },
          { label: "ROUTER", value: env.OPENAI_API_KEY ? env.OPENAI_CHAT_MODEL : "KEYWORDS" }
        ]}
      />

      <PageHeader
        eyebrow="Agent Ecosystem // Expansion Bay"
        title="Delegated [b]workflow command[/b] layer."
        description="Configured capability state plus observed queue counts. Provider access is verified only when a workflow calls it. Phase 0 restricts Google tools to reads and local proposals."
        meta={[
          { label: "BAY ·", value: "04 / EXP" },
          { label: "CLASS::", value: "ALPHA", highlight: true },
          { label: "AVAILABLE", value: `${availableCount} / ${moduleStates.length}` }
        ]}
      />

      <section className="module-grid">
        {agentModules.map((module, i) => {
          const state = moduleStates[i] ?? { status: "idle", label: "UNKNOWN", mode: "Not measured", effects: "NONE" };
          return (
            <article className="module" key={module.title}>
              <div className="module-head">
                <div className="module-id">
                  <span className="bracket">⟦</span> MODULE-0{i + 1} <span className="bracket">⟧</span>{" "}
                  <span className="open">› {state.label}</span>
                </div>
                <div className={`module-status ${state.status === "online" ? "" : state.status}`}>
                  <span className="led" />
                  {state.status === "online" ? "AVAILABLE" : state.status === "warn" ? "LIMITED" : "IDLE"}
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
                <span>MODE <b>{state.mode}</b></span>
                <span>EFFECTS <b>{state.effects}</b></span>
                <span>METRICS <b>NOT INSTRUMENTED</b></span>
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
          <div className="panel-head"><h3>AUTOMATION STACK · CURRENT + PLANNED</h3><span className="tag">8 LAYERS</span></div>
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
        <div className="panel-head"><h3>PHASE 0 SAFETY POLICY</h3><span className="tag">6 RULES</span></div>
        <div className="module-grid">
          {[
            "Email tools create local draft artifacts only; Gmail writes and sends are disabled in Phase 0.",
            "Calendar tools read availability and create local proposals; calendar writes are disabled in Phase 0.",
            "Contact editing, purchases, payments, and sensitive data transfers are not implemented in Phase 0.",
            "Research is limited to saved knowledge until a citation-capable web tool is implemented.",
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
