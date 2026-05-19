"use client";

import { useState } from "react";
import { Save } from "lucide-react";

export function SaveForm() {
  const [status, setStatus] = useState<string>("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving...");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const response = await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType: payload.url ? "MANUAL_LINK" : "MANUAL_TEXT",
        title: payload.title,
        url: payload.url,
        text: payload.text,
        platform: payload.platform
      })
    });

    const data = await response.json();
    setStatus(response.ok ? `Saved as ${data.item.category}.` : data.error || "Save failed.");
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input className="input" id="title" name="title" placeholder="What did you save?" />
      </div>
      <div className="field">
        <label htmlFor="url">Link</label>
        <input className="input" id="url" name="url" type="url" placeholder="https://..." />
      </div>
      <div className="field">
        <label htmlFor="platform">Platform</label>
        <input className="input" id="platform" name="platform" placeholder="Instagram, YouTube, LinkedIn, web..." />
      </div>
      <div className="field">
        <label htmlFor="text">Notes or pasted content</label>
        <textarea className="textarea" id="text" name="text" placeholder="Paste the visible post text, transcript, recipe, role description, or your own note." />
      </div>
      <div className="button-row">
        <button className="button" type="submit">
          <Save size={16} />
          Save
        </button>
        {status ? <span className="muted">{status}</span> : null}
      </div>
    </form>
  );
}
