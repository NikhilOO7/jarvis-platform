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
    const approval = await prisma.approvalRequest.update({
      where: { id: body.id },
      data: {
        status: body.status,
        decidedAt: new Date()
      }
    });

    return NextResponse.json({ approval });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update approval." },
      { status: 400 }
    );
  }
}
