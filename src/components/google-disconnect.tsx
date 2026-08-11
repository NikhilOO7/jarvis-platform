"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function GoogleDisconnect() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function disconnect() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/connectors/google/disconnect", { method: "POST" });
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="button danger" type="button" disabled={busy} onClick={disconnect}>
      {busy ? "REVOKING…" : "✕ DISCONNECT"}
    </button>
  );
}
