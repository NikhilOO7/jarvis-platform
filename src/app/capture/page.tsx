import { AppShell } from "@/components/app-shell";
import { ImportForm } from "@/components/import-form";
import { PageHeader } from "@/components/page-header";
import { SaveForm } from "@/components/save-form";
import { SocialImportForm } from "@/components/social-import-form";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";
import { env } from "@/lib/env";

export default function CapturePage() {
  const storageConfigured = Boolean(env.DATABASE_URL);

  return (
    <AppShell>
      <TopBar
        label="J.A.R.V.I.S · CAPTURE"
        uplink={storageConfigured ? "configured" : "offline"}
        center="MANUAL CAPTURE"
      />
      <SubRail
        extras={[
          { label: "STORAGE", value: storageConfigured ? "CONFIGURED" : "OFFLINE", variant: storageConfigured ? "ok" : "warn" },
          { label: "MODE", value: "DIRECT REQUEST" }
        ]}
      />
      <PageHeader
        eyebrow="Capture // Intake Array"
        title="Acquire [b]signal[/b]."
        description="Manual links, visible text, platform exports, extension capture, and share flows enter the same processing pipeline."
        meta={[
          { label: "CHANNEL", value: "WEB" },
          { label: "MODE", value: "MANUAL" },
          { label: "STORAGE", value: storageConfigured ? "CONFIGURED" : "OFFLINE", highlight: storageConfigured }
        ]}
      />

      <section className="grid content-grid">
        <div className="panel">
          <div className="panel-head"><h3>MANUAL CAPTURE</h3><span className="tag">LINK · TEXT · NOTE</span></div>
          <SaveForm />
        </div>
        <div className="panel">
          <div className="panel-head"><h3>EXPORT INTAKE</h3><span className="tag">BULK PASTE</span></div>
          <ImportForm />
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <h3>SOCIAL ARCHIVES</h3>
          <span className="tag">INSTAGRAM · FACEBOOK · LINKEDIN</span>
        </div>
        <SocialImportForm />
      </section>
    </AppShell>
  );
}
