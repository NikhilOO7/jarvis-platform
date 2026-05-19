"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

type ApprovalDecision = "APPROVED" | "REJECTED";

type ApprovalActionsProps = {
  id?: string;
  initialStatus: string;
  disabled?: boolean;
};

export function ApprovalActions({ id, initialStatus, disabled = false }: ApprovalActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const canDecide = Boolean(id) && status === "PENDING" && !disabled && !isPending;

  async function decide(nextStatus: ApprovalDecision) {
    if (!canDecide) return;

    setMessage("Updating safety gate...");

    const response = await fetch("/api/approvals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus })
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Unable to update approval.");
      return;
    }

    setStatus(data.approval.status);
    setMessage(data.workflowRun?.status ? `Run status: ${data.workflowRun.status}` : "Decision recorded.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="approval-actions">
      <div className="button-row">
        <button className="button" type="button" disabled={!canDecide} onClick={() => decide("APPROVED")}>
          <Check size={15} />
          Approve
        </button>
        <button className="button danger" type="button" disabled={!canDecide} onClick={() => decide("REJECTED")}>
          <X size={15} />
          Reject
        </button>
      </div>
      <p className="muted approval-message">{message || `Current state: ${status}`}</p>
    </div>
  );
}
