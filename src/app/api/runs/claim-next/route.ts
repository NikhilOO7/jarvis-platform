import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { executeWorkflowRun, sweepStaleRuns, type RunOutput } from "@/lib/agents/executor";
import { requireOperator } from "@/lib/auth";

export const maxDuration = 300;

/**
 * Worker endpoint (scalability rung 1): claim and execute the oldest QUEUED
 * run. The executor's compare-and-swap makes concurrent callers safe — if two
 * workers race, exactly one claims; the other gets claimed:false and moves on.
 */
export async function POST(request: Request) {
  if (!(await requireOperator(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!env.DATABASE_URL) {
    return NextResponse.json({ claimed: false, message: "DATABASE_URL is not configured." });
  }

  try {
    await sweepStaleRuns();

    const next = await prisma.workflowRun.findFirst({
      where: { status: "QUEUED" },
      orderBy: { createdAt: "asc" },
      select: { id: true, command: true }
    });
    if (!next) {
      return NextResponse.json({ claimed: false });
    }

    const run = await executeWorkflowRun(next.id);
    if (!run) {
      // Another worker won the CAS between findFirst and the claim.
      return NextResponse.json({ claimed: false, contested: true });
    }

    const output = run.output as RunOutput | null;
    return NextResponse.json({
      claimed: true,
      run: {
        id: run.id,
        command: next.command,
        status: run.status,
        summary: output?.summary ?? null,
        engine: output?.engine ?? null
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Claim failed." },
      { status: 500 }
    );
  }
}
