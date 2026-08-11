import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOperator } from "@/lib/auth";
import { routeCommandSmart } from "@/lib/command-router";
import { env } from "@/lib/env";
import { executeWorkflowRun } from "@/lib/agents/executor";
import { createWorkflowRunFromRoute } from "@/lib/workflow-store";

const commandSchema = z.object({
  command: z.string().min(1)
});

export const maxDuration = 120;

export async function POST(request: Request) {
  if (!(await requireOperator(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const { command } = commandSchema.parse(await request.json());
    const route = await routeCommandSmart(command);
    const createdRun = env.DATABASE_URL
      ? await createWorkflowRunFromRoute({
          command,
          workflow: route.workflow,
          route: {
            agentKind: route.agentKind,
            confidence: route.confidence,
            risk: route.risk,
            rationale: route.rationale
          }
        })
      : null;

    // No approval gates → the run is QUEUED; execute it right now and return the result.
    const executedRun =
      createdRun && createdRun.status === "QUEUED" ? await executeWorkflowRun(createdRun.id) : null;
    const workflowRun = executedRun ?? createdRun;

    return NextResponse.json({
      command,
      route,
      workflowRun,
      executed: Boolean(executedRun),
      dryRun: !createdRun,
      message: !createdRun
        ? "Command routed. Connect DATABASE_URL to create and execute real workflow runs."
        : executedRun
          ? `Run ${executedRun.status === "COMPLETED" ? "completed" : executedRun.status.toLowerCase()}.`
          : "Workflow run created and armed. Clear the approval gate to execute."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to route command." },
      { status: 400 }
    );
  }
}
