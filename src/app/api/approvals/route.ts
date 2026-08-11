import { NextResponse, after } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireOperator } from "@/lib/auth";
import { executeWorkflowRun, type RunLogEntry } from "@/lib/agents/executor";

const approvalUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"])
});

export async function GET(request: Request) {
  if (!(await requireOperator(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!env.DATABASE_URL) {
    return NextResponse.json({
      approvals: [],
      message: "DATABASE_URL is not configured. Approval queue is running in design mode."
    });
  }

  const approvals = await prisma.approvalRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 30
  });

  return NextResponse.json({ approvals });
}

export async function PATCH(request: Request) {
  if (!(await requireOperator(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

  try {
    const body = approvalUpdateSchema.parse(await request.json());
    const result = await prisma.$transaction(async (tx) => {
      const approval = await tx.approvalRequest.update({
        where: { id: body.id },
        data: {
          status: body.status,
          decidedAt: new Date()
        }
      });

      if (!approval.workflowRunId) {
        return { approval, workflowRun: null };
      }

      const [siblingApprovals, currentRun] = await Promise.all([
        tx.approvalRequest.findMany({
          where: { workflowRunId: approval.workflowRunId },
          select: { status: true }
        }),
        tx.workflowRun.findUnique({
          where: { id: approval.workflowRunId },
          select: { logs: true }
        })
      ]);

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

      const workflowRun = await tx.workflowRun.update({
        where: { id: approval.workflowRunId },
        data: {
          status: workflowRunStatus,
          logs: logs as unknown as Prisma.InputJsonValue
        }
      });

      return { approval, workflowRun };
    });

    // Last gate cleared → fire the executor once the response is sent.
    if (result.workflowRun?.status === "QUEUED") {
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
            executionTriggered: result.workflowRun.status === "QUEUED"
          }
        : null
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update approval." },
      { status: 400 }
    );
  }
}
