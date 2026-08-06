"use client";

import { useState } from "react";
import { FileArchive } from "lucide-react";

type FileReport = {
  file: string;
  detected: string;
  platform: string;
  parsed: number;
  imported: number;
  duplicates: number;
  failed: number;
  capped: boolean;
  sample?: { title: string | null; excerpt: string } | null;
};

export function SocialImportForm() {
  const [reports, setReports] = useState<FileReport[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formData = new FormData(event.currentTarget);
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    if (files.length === 0) {
      setStatus("Choose at least one JSON/CSV file from your export.");
      return;
    }

    setBusy(true);
    setReports([]);
    setStatus(`Processing ${files.length} file${files.length === 1 ? "" : "s"}…`);

    try {
      const response = await fetch("/api/import/social", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error || "Import failed.");
        return;
      }
      setReports(data.reports ?? []);
      const totals = (data.reports ?? []).reduce(
        (acc: { imported: number; duplicates: number }, report: FileReport) => ({
          imported: acc.imported + report.imported,
          duplicates: acc.duplicates + report.duplicates
        }),
        { imported: 0, duplicates: 0 }
      );
      setStatus(
        data.dryRun
          ? data.message
          : `Imported ${totals.imported} item${totals.imported === 1 ? "" : "s"} (${totals.duplicates} duplicate${totals.duplicates === 1 ? "" : "s"} skipped).`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="social-files">Export files (JSON / CSV)</label>
        <input className="input" id="social-files" name="files" type="file" multiple accept=".json,.csv,application/json,text/csv" />
      </div>
      <div className="field">
        <label htmlFor="social-platform">Platform hint (optional)</label>
        <select className="input" id="social-platform" name="platform" defaultValue="">
          <option value="">Auto-detect</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="linkedin">LinkedIn</option>
        </select>
      </div>
      <div className="button-row">
        <button className="button" type="submit" disabled={busy}>
          <FileArchive size={16} />
          {busy ? "Processing…" : "Import export"}
        </button>
        {status ? <span className="muted">{status}</span> : null}
      </div>

      {reports.length > 0 ? (
        <div className="timeline-list" style={{ marginTop: 10 }}>
          {reports.map((report) => (
            <div className="timeline-item" key={report.file}>
              <div className="module-icon compact">
                <span style={{ fontSize: 11 }}>›</span>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 3 }}>
                  {report.file} · {report.detected}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {report.parsed} parsed · {report.imported} imported · {report.duplicates} duplicates
                  {report.failed ? ` · ${report.failed} failed` : ""}
                  {report.capped ? " · capped at 150/file per run" : ""}
                </div>
                {report.sample ? (
                  <div className="muted" style={{ fontSize: 11, marginTop: 3, opacity: 0.75 }}>
                    e.g. {report.sample.title}{report.sample.excerpt ? ` — ${report.sample.excerpt}` : ""}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <p className="muted" style={{ fontSize: 11, lineHeight: 1.6, marginTop: 10 }}>
        Instagram/Facebook: Accounts Center → Your information → Download your information (choose JSON). LinkedIn:
        Settings → Data privacy → Get a copy of your data. Unzip the archive and upload files like
        saved_posts.json, your chat folders&apos; message_1.json, or LinkedIn CSVs. Data lands in your local database;
        AI classification/summarization sends text to your configured model provider.
      </p>
    </form>
  );
}
