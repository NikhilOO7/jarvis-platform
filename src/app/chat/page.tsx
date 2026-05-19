import { AppShell } from "@/components/app-shell";
import { ChatBox } from "@/components/chat-box";
import { PageHeader } from "@/components/page-header";

export default function ChatPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Dialogue // Assistant Core"
        title="Query saved intelligence."
        description="Ask across memory nodes, plans, saved claims, categories, products, roles, workouts, recipes, and research."
      />

      <section className="card">
        <ChatBox />
      </section>
    </AppShell>
  );
}
