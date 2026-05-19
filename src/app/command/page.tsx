import { AppShell } from "@/components/app-shell";
import { CommandConsole } from "@/components/command-console";
import { PageHeader } from "@/components/page-header";

export default function CommandPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Command // Intent Router"
        title="Route natural language into agents."
        description="Prototype the Jarvis command brain: classify intent, select an agent, choose a workflow, and identify approval gates before execution."
      />

      <CommandConsole />
    </AppShell>
  );
}
