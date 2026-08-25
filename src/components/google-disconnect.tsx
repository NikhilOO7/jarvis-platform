"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function GoogleDisconnect() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function disconnect() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/connectors/google/disconnect", { method: "POST" });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Google access could not be revoked; the stored credential was retained.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Disconnect request failed; the stored credential was retained.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="button danger" type="button" disabled={busy} onClick={disconnect}>
        {busy ? "REVOKING…" : "✕ DISCONNECT"}
      </button>
      {error ? (
        <div className="warn" role="alert" style={{ fontSize: 11, marginTop: 8, maxWidth: 420 }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
