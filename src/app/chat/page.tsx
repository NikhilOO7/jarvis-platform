import { AppShell } from "@/components/app-shell";
import { ChatBox } from "@/components/chat-box";
import { PageHeader } from "@/components/page-header";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";
import { env } from "@/lib/env";

export default function ChatPage() {
  const databaseConfigured = Boolean(env.DATABASE_URL);
  const modelConfigured = Boolean(env.OPENAI_API_KEY);

  return (
    <AppShell>
      <TopBar
        label="J.A.R.V.I.S · DIALOGUE"
        uplink={databaseConfigured ? "configured" : "offline"}
        center="SAVED-MEMORY QUERY"
      />
      <SubRail
        extras={[
          { label: "MODEL", value: modelConfigured ? env.OPENAI_CHAT_MODEL : "NOT CONFIGURED" },
          { label: "DATABASE", value: databaseConfigured ? "CONFIGURED" : "OFFLINE", variant: databaseConfigured ? "ok" : "warn" },
          { label: "RETRIEVAL", value: "RUNTIME SELECTED" }
        ]}
      />
      <PageHeader
        eyebrow="Dialogue // Assistant Core"
        title="Query [b]saved intelligence[/b]."
        description="Ask across memory nodes, plans, saved claims, categories, products, roles, workouts, recipes, and research."
        meta={[
          { label: "CHANNEL", value: "WEB" },
          { label: "CONTEXT", value: "SAVED MEMORY", highlight: true }
        ]}
      />

      <ChatBox />
    </AppShell>
  );
}
