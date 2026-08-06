import { AppShell } from "@/components/app-shell";
import { ChatBox } from "@/components/chat-box";
import { PageHeader } from "@/components/page-header";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";
import { env } from "@/lib/env";

export default function ChatPage() {
  return (
    <AppShell>
      <TopBar label="J.A.R.V.I.S · DIALOGUE" uplink="ready" center="ASSISTANT CORE ONLINE" />
      <SubRail
        extras={[
          { label: "MODEL", value: env.OPENAI_API_KEY ? env.OPENAI_CHAT_MODEL : "OFFLINE" },
          { label: "MEMORY", value: "LIVE" },
          { label: "RAG", value: "SEMANTIC" }
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
