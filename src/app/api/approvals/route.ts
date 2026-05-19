import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const approvalUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"])
});

export async function GET() {
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

      const workflowRun = await tx.workflowRun.update({
        where: { id: approval.workflowRunId },
        data: {
          status: workflowRunStatus,
          logs: {
            push: {
              at: new Date().toISOString(),
              event: `APPROVAL_${body.status}`,
              message:
                body.status === "APPROVED"
                  ? `Approval gate cleared: ${approval.title}.`
                  : `Workflow cancelled by rejected approval: ${approval.title}.`
            }
          }
        }
      });

      return { approval, workflowRun };
    });

    return NextResponse.json({
      approval: result.approval,
      workflowRun: {
        id: result.workflowRun.id,
        status: result.workflowRun.status
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update approval." },
      { status: 400 }
    );
  }
}
