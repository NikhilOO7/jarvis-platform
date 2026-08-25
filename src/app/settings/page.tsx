import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";
import { env } from "@/lib/env";
import { ensureExtensionToken } from "@/lib/extension-auth";
import { getGoogleStatus, googleRedirectUri } from "@/lib/connectors/google";
import { GoogleDisconnect } from "@/components/google-disconnect";
import { hasSecureServiceToken } from "@/lib/credential-policy";

export const dynamic = "force-dynamic";

const connectorChecks = [
  { name: "Operator Auth", description: "16+ character passphrase login with signed 30-day sessions. Unset means OPEN MODE — anyone reaching this machine is the operator. Required before real connectors.", configured: Boolean(env.JARVIS_OPERATOR_PASSWORD) },
  { name: "Postgres + pgvector", description: "Stores raw content, memory, graph records, agents, workflow runs, approvals, and vector search.", configured: Boolean(env.DATABASE_URL) },
  { name: "OpenAI API", description: "Powers classification, extraction, summarization, chat, speech-to-text, embeddings, and command routing.", configured: Boolean(env.OPENAI_API_KEY) },
  { name: "Telegram API", description: "Text command bridge. Requires its own 32+ character JARVIS_TELEGRAM_TOKEN; voice notes are not implemented.", configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && hasSecureServiceToken(env.JARVIS_TELEGRAM_TOKEN)) },
  { name: "Jarvis Workflow Runtime", description: "Native orchestration for multi-step runs, state transitions, step logs, and allowlisted tools.", configured: Boolean(env.DATABASE_URL) },
  { name: "Text-To-Speech", description: "Future spoken responses through ElevenLabs or another voice provider.", configured: Boolean(process.env.ELEVENLABS_API_KEY) },
  { name: "Worker Credential", description: "32+ character scoped credential used only to claim queued workflow runs.", configured: hasSecureServiceToken(env.JARVIS_WORKER_TOKEN) },
  { name: "Cron Credential", description: "32+ character scoped credential used only to trigger scheduled briefing workflows.", configured: hasSecureServiceToken(env.JARVIS_CRON_TOKEN) }
];

const envKeys = [
  "DATABASE_URL",
  "OPENAI_API_KEY",
  "OPENAI_CHAT_MODEL",
  "OPENAI_EMBEDDING_MODEL",
  "JARVIS_OPERATOR_PASSWORD",
  "JARVIS_EXTENSION_TOKEN",
  "JARVIS_TELEGRAM_TOKEN",
  "JARVIS_WORKER_TOKEN",
  "JARVIS_CRON_TOKEN",
  "TELEGRAM_BOT_TOKEN",
  "ELEVENLABS_API_KEY",
  "ANTHROPIC_API_KEY"
];

export default async function SettingsPage() {
  const configuredCount = connectorChecks.filter((c) => c.configured).length;
  const operatorAuthConfigured = Boolean(env.JARVIS_OPERATOR_PASSWORD);
  const extensionToken = operatorAuthConfigured ? await ensureExtensionToken() : null;
  const google = await getGoogleStatus();
  const googleStatusLabel = google.connected
    ? operatorAuthConfigured
      ? `CREDENTIAL STORED · ${google.email ?? "ACCOUNT"}`
      : "LOCKED · AUTH REQUIRED"
    : google.configured
      ? operatorAuthConfigured
        ? "READY TO CONNECT"
        : "LOCKED · AUTH REQUIRED"
      : "AWAITING KEYS";

  return (
    <AppShell>
      <TopBar label="J.A.R.V.I.S · SETTINGS" uplink="config" center="CONNECTOR BAY" />
      <SubRail
        extras={[
          { label: "CONFIGURED", value: `${configuredCount} / ${connectorChecks.length}`, variant: configuredCount === connectorChecks.length ? "ok" : "warn" }
        ]}
      />
      <PageHeader
        eyebrow="Settings // Connector Bay"
        title="System readiness and [b]integration map[/b]."
        description="Track the keys, connectors, webhooks, and approval gates needed to turn the Jarvis shell into a real execution system."
        meta={[
          { label: "CONFIGURED", value: `${configuredCount}/${connectorChecks.length}`, highlight: true }
        ]}
      />

      <section className="module-grid">
        {connectorChecks.map((connector, i) => (
          <article className="module" key={connector.name}>
            <div className="module-head">
              <div className="module-id">
                <span className="bracket">⟦</span> CON-{String(i + 1).padStart(2, "0")} <span className="bracket">⟧</span>{" "}
                <span className="open">› {connector.configured ? "CONFIGURED" : "UNSET"}</span>
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
        <div className="panel-head">
          <h3>GOOGLE ACCOUNT</h3>
          <span className="tag">{googleStatusLabel}</span>
        </div>
        <div className="muted" style={{ fontSize: 12, lineHeight: 1.7 }}>
          {google.connected && operatorAuthConfigured ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span>
                A read-only Google credential is stored; provider access is attempted at workflow runtime. Phase 0
                safety mode creates email drafts and calendar events as local proposal artifacts only, with no Gmail
                or Calendar writes. Disconnect clears the stored credential only after Google accepts revocation.
              </span>
              <GoogleDisconnect />
            </div>
          ) : google.connected ? (
            <p>
              A Google connection exists, but reads and connector management are disabled in OPEN MODE. Set{" "}
              <span className="mono">JARVIS_OPERATOR_PASSWORD</span> to inspect or revoke it.
            </p>
          ) : google.configured && operatorAuthConfigured ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span>Keys detected. Connect your Google account to arm read-only email/calendar tools.</span>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a className="button" href="/api/connectors/google/start">◉ CONNECT GOOGLE</a>
            </div>
          ) : google.configured ? (
            <p>
              Google keys are configured, but external account connection is blocked in OPEN MODE. Set{" "}
              <span className="mono">JARVIS_OPERATOR_PASSWORD</span> first.
            </p>
          ) : (
            <p>
              Create an OAuth client (Google Cloud Console → APIs &amp; Services → Credentials → OAuth client ID, type
              &quot;Web application&quot;), add this redirect URI:{" "}
              <span className="mono" style={{ userSelect: "all" }}>{googleRedirectUri()}</span>, enable the Gmail and
              Calendar APIs, then set <span className="mono">GOOGLE_CLIENT_ID</span> and{" "}
              <span className="mono">GOOGLE_CLIENT_SECRET</span> in .env.
            </p>
          )}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <h3>BROWSER COMPANION</h3>
          <span className="tag">
            {!operatorAuthConfigured ? "AUTH REQUIRED" : extensionToken ? "PAIRING READY" : "AWAITING DATABASE"}
          </span>
        </div>
        <div className="muted" style={{ fontSize: 12, lineHeight: 1.7 }}>
          <p style={{ marginBottom: 8 }}>
            Consent-first capture from open tabs (see docs/BROWSER_COMPANION_PLAN.md). Install: open{" "}
            <span className="mono">chrome://extensions</span>, enable Developer mode, choose{" "}
            <b>Load unpacked</b>, and select the <span className="mono">extension/</span> folder of this repo.
            Then paste this pairing token into the extension&apos;s options page:
          </p>
          {!operatorAuthConfigured ? (
            <p>
              Set <span className="mono">JARVIS_OPERATOR_PASSWORD</span> before minting or displaying a browser
              companion pairing token.
            </p>
          ) : extensionToken ? (
            <code
              className="mono"
              style={{
                display: "block",
                padding: "10px 12px",
                border: "1px solid rgba(var(--glow-rgb), 0.35)",
                borderRadius: 6,
                fontSize: 12,
                userSelect: "all",
                wordBreak: "break-all"
              }}
            >
              {extensionToken}
            </code>
          ) : (
            <p>
              Connect <span className="mono">DATABASE_URL</span> (or set{" "}
              <span className="mono">JARVIS_EXTENSION_TOKEN</span> in .env to a random value of at least 32
              characters) to mint or configure a pairing token.
            </p>
          )}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head"><h3>ENVIRONMENT PLACEHOLDERS</h3><span className="tag">{envKeys.length} KEYS</span></div>
        <div className="caps">
          {envKeys.map((k) => (
            <span key={k}>{k}</span>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
