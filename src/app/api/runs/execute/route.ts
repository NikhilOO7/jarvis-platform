import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { executeWorkflowRun } from "@/lib/agents/executor";
import { requireOperator } from "@/lib/auth";

const executeSchema = z.object({
  id: z.string().min(1)
});

export const maxDuration = 120;

export async function POST(request: Request) {
  if (!(await requireOperator(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

  try {
    const { id } = executeSchema.parse(await request.json());
    const run = await executeWorkflowRun(id);

    if (!run) {
      return NextResponse.json(
        { error: "Run is not executable. Only QUEUED runs can be executed." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      run: {
        id: run.id,
        status: run.status,
        output: run.output
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to execute run." },
      { status: 500 }
    );
  }
}
