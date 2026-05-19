"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";

export function ImportForm() {
  const [status, setStatus] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Importing...");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const response = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: payload.title,
        platform: payload.platform,
        text: payload.text
      })
    });
    const data = await response.json();
    setStatus(response.ok ? `Imported ${data.count} item${data.count === 1 ? "" : "s"}.` : data.error || "Import failed.");
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="import-title">Import label</label>
        <input className="input" id="import-title" name="title" placeholder="TikTok export, LinkedIn saved jobs, recipe dump..." />
      </div>
      <div className="field">
        <label htmlFor="import-platform">Source platform</label>
        <input className="input" id="import-platform" name="platform" placeholder="Meta, TikTok, Google, LinkedIn..." />
      </div>
      <div className="field">
        <label htmlFor="import-text">Export text</label>
        <textarea className="textarea" id="import-text" name="text" placeholder="Paste export text or newline-separated saved items." />
      </div>
      <div className="button-row">
        <button className="button" type="submit">
          <UploadCloud size={16} />
          Import
        </button>
        {status ? <span className="muted">{status}</span> : null}
      </div>
    </form>
  );
}
