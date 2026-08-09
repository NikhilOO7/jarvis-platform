import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { executeWorkflowRun, type RunOutput } from "@/lib/agents/executor";
import { getWorkflowTemplate } from "@/lib/workflow-templates";
import { createWorkflowRunFromRoute } from "@/lib/workflow-store";
import { verifyExtensionAuth } from "@/lib/extension-auth";

export const maxDuration = 120;

/**
 * Proactivity entry point: creates and executes a Daily Executive Briefing run.
 * Called by the Telegram bridge's scheduler or any external cron (launchd,
 * crontab, hosted cron) with the pairing token.
 */
export async function POST(request: Request) {
  if (!(await verifyExtensionAuth(request))) {
    return NextResponse.json(
      { error: "Unauthorized. Use the pairing token from /settings." },
      { status: 401 }
    );
  }
  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

  try {
    const workflow = getWorkflowTemplate("daily_executive_briefing");
    if (!workflow) {
      return NextResponse.json({ error: "Briefing workflow template missing." }, { status: 500 });
    }

    const run = await createWorkflowRunFromRoute({
      command: "Scheduled daily executive briefing",
      workflow,
      route: {
        agentKind: "ORCHESTRATOR",
        confidence: 1,
        risk: workflow.risk,
        rationale: "Scheduled proactive run — no operator command."
      }
    });

    const executed = run.status === "QUEUED" ? await executeWorkflowRun(run.id) : null;
    const output = (executed?.output ?? null) as RunOutput | null;

    return NextResponse.json({
      runId: run.id,
      status: executed?.status ?? run.status,
      summary: output?.summary ?? null,
      engine: output?.engine ?? null
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Briefing run failed." },
      { status: 500 }
    );
  }
}
