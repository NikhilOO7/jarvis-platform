import { AppShell } from "@/components/app-shell";
import { ImportForm } from "@/components/import-form";
import { PageHeader } from "@/components/page-header";
import { SaveForm } from "@/components/save-form";
import { SocialImportForm } from "@/components/social-import-form";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";

export default function CapturePage() {
  return (
    <AppShell>
      <TopBar label="J.A.R.V.I.S · CAPTURE" uplink="ready" center="INTAKE ARRAY ARMED" />
      <SubRail
        extras={[
          { label: "INTAKE PATHS", value: "5 / 5" },
          { label: "QUEUE", value: 0 }
        ]}
      />
      <PageHeader
        eyebrow="Capture // Intake Array"
        title="Acquire [b]signal[/b]."
        description="Manual links, visible text, platform exports, extension capture, and share flows enter the same processing pipeline."
        meta={[
          { label: "CHANNEL", value: "WEB" },
          { label: "MODE", value: "MANUAL" },
          { label: "STATUS", value: "READY", highlight: true }
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
