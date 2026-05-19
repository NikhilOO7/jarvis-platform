import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { env } from "@/lib/env";

const connectorChecks = [
  {
    name: "Postgres + pgvector",
    description: "Stores raw content, memory, graph records, agents, workflow runs, approvals, and vector search.",
    configured: Boolean(env.DATABASE_URL)
  },
  {
    name: "OpenAI API",
    description: "Powers classification, extraction, summarization, chat, speech-to-text, embeddings, and command routing.",
    configured: Boolean(env.OPENAI_API_KEY)
  },
  {
    name: "Telegram API",
    description: "Future text and voice command surface for Jarvis 2.0 workflows.",
    configured: Boolean(process.env.TELEGRAM_BOT_TOKEN)
  },
  {
    name: "n8n Webhook",
    description: "Future workflow orchestration endpoint for external automation runs.",
    configured: Boolean(process.env.N8N_WEBHOOK_URL)
  },
  {
    name: "Text-To-Speech",
    description: "Future spoken responses through ElevenLabs or another voice provider.",
    configured: Boolean(process.env.ELEVENLABS_API_KEY)
  },
  {
    name: "Email Connector",
    description: "Future inbox summaries, draft replies, labels, and approval-gated sending.",
    configured: Boolean(process.env.EMAIL_CONNECTOR_ENABLED)
  },
  {
    name: "Calendar Connector",
    description: "Future availability checks, event drafting, meeting prep, and approval-gated scheduling.",
    configured: Boolean(process.env.CALENDAR_CONNECTOR_ENABLED)
  }
];

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Settings // Connector Bay"
        title="System readiness and integration map."
        description="Track the keys, connectors, webhooks, and approval gates needed to turn the Jarvis shell into a real execution system."
      />

      <section className="module-grid two-column">
        {connectorChecks.map((connector) => (
          <article className="module-card" key={connector.name}>
            <div className={connector.configured ? "status-light online" : "status-light"} />
            <div>
              <div className="pill-row">
                <span className="pill">{connector.configured ? "Configured" : "Not Configured"}</span>
              </div>
              <h3 style={{ marginTop: 12 }}>{connector.name}</h3>
              <p className="muted">{connector.description}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Required Environment Placeholders</h2>
        <div className="capability-list large">
          <span>DATABASE_URL</span>
          <span>OPENAI_API_KEY</span>
          <span>TELEGRAM_BOT_TOKEN</span>
          <span>N8N_WEBHOOK_URL</span>
          <span>ELEVENLABS_API_KEY</span>
          <span>EMAIL_CONNECTOR_ENABLED</span>
          <span>CALENDAR_CONNECTOR_ENABLED</span>
        </div>
      </section>
    </AppShell>
  );
}
