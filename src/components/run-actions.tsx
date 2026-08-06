"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";

type RunActionsProps = {
  id: string;
  status: string;
  disabled?: boolean;
};

export function RunActions({ id, status, disabled = false }: RunActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);
  const [, startTransition] = useTransition();

  if (status !== "QUEUED") return null;

  async function execute() {
    if (running || disabled) return;
    setRunning(true);
    setMessage("Executor engaged…");

    try {
      const response = await fetch("/api/runs/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Unable to execute run.");
        return;
      }
      setMessage(`Run ${data.run.status}.`);
      startTransition(() => router.refresh());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Execution request failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="approval-actions" style={{ marginTop: 10 }}>
      <div className="button-row">
        <button className="button" type="button" disabled={running || disabled} onClick={execute}>
          <Play size={15} />
          {running ? "EXECUTING…" : "EXECUTE"}
        </button>
      </div>
      {message ? <p className="muted approval-message">{message}</p> : null}
    </div>
  );
}
