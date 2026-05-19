import { AppShell } from "@/components/app-shell";
import { CommandConsole } from "@/components/command-console";
import { PageHeader } from "@/components/page-header";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";

export default function CommandPage() {
  return (
    <AppShell>
      <TopBar label="J.A.R.V.I.S · COMMAND" uplink="ready" center="LISTENING · TYPE OR SPEAK" />
      <SubRail
        extras={[
          { label: "TURN", value: "03" },
          { label: "TOKENS", value: "1,284" },
          { label: "CACHE", value: "HIT" }
        ]}
      />
      <PageHeader
        eyebrow="Command Channel // Operator Input"
        title="Tell me what you need, [b]operator[/b]."
        description="Natural-language commands route into agents, workflows, or research. Risky actions wait at the approval gate."
        meta={[
          { label: "CHANNEL", value: "WEB" },
          { label: "BUFFER", value: "14 TURNS" },
          { label: "VOICE", value: "OPTIONAL" }
        ]}
      />

      <CommandConsole />
    </AppShell>
  );
}
