import { NextResponse, after } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth";
import { executeWorkflowRun, type RunLogEntry } from "@/lib/agents/executor";

const approvalUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"])
});

class ApprovalConflictError extends Error {}

export async function GET(request: Request) {
  if (!(await authorizeRequest(request, "approvals:read"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!env.DATABASE_URL) {
    return NextResponse.json({
      approvals: [],
      message: "DATABASE_URL is not configured. Approval queue is offline."
    });
  }

  const approvals = await prisma.approvalRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 30
  });

  return NextResponse.json({ approvals });
}

export async function PATCH(request: Request) {
  if (!(await authorizeRequest(request, "approvals:write"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

  try {
    const body = approvalUpdateSchema.parse(await request.json());
    const result = await prisma.$transaction(async (tx) => {
      const currentApproval = await tx.approvalRequest.findUnique({ where: { id: body.id } });
      if (!currentApproval) throw new ApprovalConflictError("Approval request was not found.");
      if (currentApproval.status !== "PENDING") {
        throw new ApprovalConflictError(`Approval has already been ${currentApproval.status.toLowerCase()}.`);
      }

      const currentRun = currentApproval.workflowRunId
        ? await tx.workflowRun.findUnique({
            where: { id: currentApproval.workflowRunId },
            select: { id: true, status: true, logs: true }
          })
        : null;
      if (currentApproval.workflowRunId && currentRun?.status !== "WAITING_FOR_APPROVAL") {
        throw new ApprovalConflictError(
          `Run is ${currentRun?.status.toLowerCase() ?? "missing"}; only waiting runs can be decided.`
        );
      }

      const decided = await tx.approvalRequest.updateMany({
        where: { id: body.id, status: "PENDING" },
        data: {
          status: body.status,
          decidedAt: new Date()
        }
      });
      if (decided.count !== 1) throw new ApprovalConflictError("Approval was decided by another request.");

      const approval = await tx.approvalRequest.findUniqueOrThrow({ where: { id: body.id } });

      if (!approval.workflowRunId) {
        return { approval, workflowRun: null };
      }

      const siblingApprovals = await tx.approvalRequest.findMany({
        where: { workflowRunId: approval.workflowRunId },
        select: { status: true }
      });

      const workflowRunStatus =
        body.status === "REJECTED"
          ? "CANCELLED"
          : siblingApprovals.every((item) => item.status === "APPROVED")
            ? "QUEUED"
            : "WAITING_FOR_APPROVAL";

      const logs: RunLogEntry[] = Array.isArray(currentRun?.logs)
        ? (currentRun.logs as RunLogEntry[])
        : [];
      logs.push({
        at: new Date().toISOString(),
        event: `APPROVAL_${body.status}`,
        message:
          body.status === "APPROVED"
            ? `Approval gate cleared: ${approval.title}.`
            : `Workflow cancelled by rejected approval: ${approval.title}.`
      });

      const transitioned = await tx.workflowRun.updateMany({
        where: { id: approval.workflowRunId, status: "WAITING_FOR_APPROVAL" },
        data: {
          status: workflowRunStatus,
          logs: logs as unknown as Prisma.InputJsonValue
        }
      });
      if (transitioned.count !== 1) {
        throw new ApprovalConflictError("Run state changed while the approval was being recorded.");
      }

      const workflowRun = await tx.workflowRun.findUniqueOrThrow({ where: { id: approval.workflowRunId } });

      return { approval, workflowRun };
    });

    // Last gate cleared → fire the executor once the response is sent.
    // In worker mode the run stays QUEUED for the worker loop instead.
    if (result.workflowRun?.status === "QUEUED" && env.JARVIS_EXECUTION_MODE === "inline") {
      const runId = result.workflowRun.id;
      after(async () => {
        try {
          await executeWorkflowRun(runId);
        } catch (error) {
          console.error(`Post-approval execution failed for run ${runId}:`, error);
        }
      });
    }

    return NextResponse.json({
      approval: result.approval,
      workflowRun: result.workflowRun
        ? {
            id: result.workflowRun.id,
            status: result.workflowRun.status,
            executionTriggered:
              result.workflowRun.status === "QUEUED" && env.JARVIS_EXECUTION_MODE === "inline"
          }
        : null
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update approval." },
      { status: error instanceof ApprovalConflictError ? 409 : 400 }
    );
  }
}
