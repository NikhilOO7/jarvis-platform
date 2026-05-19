import { AppShell } from "@/components/app-shell";
import { ImportForm } from "@/components/import-form";
import { PageHeader } from "@/components/page-header";
import { SaveForm } from "@/components/save-form";

export default function CapturePage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Capture // Intake Array"
        title="Acquire signal."
        description="Manual links, visible text, platform exports, extension capture, and share flows enter the same processing pipeline."
      />

      <section className="grid content-grid">
        <div className="card">
          <h2>Manual Capture</h2>
          <SaveForm />
        </div>
        <div className="card">
          <h2>Export Intake</h2>
          <ImportForm />
        </div>
      </section>
    </AppShell>
  );
}
