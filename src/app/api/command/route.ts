import { NextResponse } from "next/server";
import { z } from "zod";
import { routeCommand } from "@/lib/command-router";
import { env } from "@/lib/env";
import { createWorkflowRunFromRoute } from "@/lib/workflow-store";

const commandSchema = z.object({
  command: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const { command } = commandSchema.parse(await request.json());
    const route = routeCommand(command);
    const workflowRun = env.DATABASE_URL
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

    return NextResponse.json({
      command,
      route,
      workflowRun,
      dryRun: !workflowRun,
      message: workflowRun
        ? "Command routed and workflow run created. External execution remains gated by connector setup and approvals."
        : "Command routed. Execution is disabled until connectors and approval gates are configured."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to route command." },
      { status: 400 }
    );
  }
}
