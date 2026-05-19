import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";
import { env } from "@/lib/env";

const connectorChecks = [
  { name: "Postgres + pgvector", description: "Stores raw content, memory, graph records, agents, workflow runs, approvals, and vector search.", configured: Boolean(env.DATABASE_URL) },
  { name: "OpenAI API", description: "Powers classification, extraction, summarization, chat, speech-to-text, embeddings, and command routing.", configured: Boolean(env.OPENAI_API_KEY) },
  { name: "Telegram API", description: "Future text and voice command surface for Jarvis 2.0 workflows.", configured: Boolean(process.env.TELEGRAM_BOT_TOKEN) },
  { name: "Jarvis Workflow Runtime", description: "Native orchestration layer for multi-step runs, approvals, retries, logs, and connector actions.", configured: Boolean(env.DATABASE_URL) },
  { name: "Text-To-Speech", description: "Future spoken responses through ElevenLabs or another voice provider.", configured: Boolean(process.env.ELEVENLABS_API_KEY) },
  { name: "Email Connector", description: "Future inbox summaries, draft replies, labels, and approval-gated sending.", configured: Boolean(process.env.EMAIL_CONNECTOR_ENABLED) },
  { name: "Calendar Connector", description: "Future availability checks, event drafting, meeting prep, and approval-gated scheduling.", configured: Boolean(process.env.CALENDAR_CONNECTOR_ENABLED) }
];

export default function SettingsPage() {
  const onlineCount = connectorChecks.filter((c) => c.configured).length;

  return (
    <AppShell>
      <TopBar label="J.A.R.V.I.S · SETTINGS" uplink="config" center="CONNECTOR BAY" />
      <SubRail
        extras={[
          { label: "ONLINE", value: `${onlineCount} / ${connectorChecks.length}`, variant: onlineCount === connectorChecks.length ? "ok" : "warn" }
        ]}
      />
      <PageHeader
        eyebrow="Settings // Connector Bay"
        title="System readiness and [b]integration map[/b]."
        description="Track the keys, connectors, webhooks, and approval gates needed to turn the Jarvis shell into a real execution system."
        meta={[
          { label: "CONNECTORS", value: `${onlineCount}/${connectorChecks.length}`, highlight: true }
        ]}
      />

      <section className="module-grid">
        {connectorChecks.map((connector, i) => (
          <article className="module" key={connector.name}>
            <div className="module-head">
              <div className="module-id">
                <span className="bracket">⟦</span> CON-{String(i + 1).padStart(2, "0")} <span className="bracket">⟧</span>{" "}
                <span className="open">› {connector.configured ? "ONLINE" : "OFFLINE"}</span>
              </div>
              <div className={`module-status${connector.configured ? "" : " idle"}`}>
                <span className="led" />
                {connector.configured ? "CONFIGURED" : "AWAITING"}
              </div>
            </div>
            <h3>{connector.name}</h3>
            <p className="desc">{connector.description}</p>
          </article>
        ))}
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head"><h3>ENVIRONMENT PLACEHOLDERS</h3><span className="tag">6 KEYS</span></div>
        <div className="caps">
          {["DATABASE_URL", "OPENAI_API_KEY", "TELEGRAM_BOT_TOKEN", "ELEVENLABS_API_KEY", "EMAIL_CONNECTOR_ENABLED", "CALENDAR_CONNECTOR_ENABLED"].map((k) => (
            <span key={k}>{k}</span>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
