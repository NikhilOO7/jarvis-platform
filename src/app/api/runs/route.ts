import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { sweepStaleRuns } from "@/lib/agents/executor";

export async function GET() {
  if (!env.DATABASE_URL) {
    return NextResponse.json({
      runs: [],
      message: "DATABASE_URL is not configured. Runs monitor is in design mode."
    });
  }

  await sweepStaleRuns();

  const runs = await prisma.workflowRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      workflowTemplate: true,
      approvals: { orderBy: { createdAt: "asc" } }
    }
  });

  return NextResponse.json({ runs });
}
