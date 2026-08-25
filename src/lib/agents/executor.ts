import type OpenAI from "openai";
import type { Prisma, WorkflowRun } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/openai";
import { env } from "@/lib/env";
import { executeTool, getAgentTool, toOpenAITools, type ToolArtifact } from "@/lib/agents/tools";

export type RunLogEntry = { at: string; event: string; message: string };

type StepDefinition = {
  title: string;
  description: string;
  approvalRequired?: boolean;
  tools: string[];
  toolRequired: boolean;
};

type StepResult = { title: string; result: string; toolCalls: number };

export type RunOutput = {
  summary: string;
  steps: StepResult[];
  artifacts: ToolArtifact[];
  engine: "openai" | "none";
};

const MAX_TOOL_ROUNDS_PER_STEP = 6;

const PERSONA = [
  "You are Jarvis, a calm, sharp, quietly witty personal AI assistant executing one step of a workflow for your operator.",
  "Ground yourself in saved knowledge via tools before asserting facts about the operator's life.",
  "Use the calculate tool for any arithmetic. Never fabricate tool results.",
  "External actions (email, calendar, finance) only produce draft artifacts for operator review — state this plainly when relevant.",
  "Be concise and concrete: your final message for each step is its official result and will be logged."
].join(" ");

function logEntry(event: string, message: string): RunLogEntry {
  return { at: new Date().toISOString(), event, message };
}

function normalizeLogs(logs: Prisma.JsonValue | null): RunLogEntry[] {
  return Array.isArray(logs) ? (logs as RunLogEntry[]) : [];
}

function normalizeSteps(steps: Prisma.JsonValue | null | undefined): StepDefinition[] {
  if (!Array.isArray(steps)) return [];
  return (steps as Array<Record<string, unknown>>)
    .filter((step) => typeof step.title === "string")
    .map((step) => ({
      title: String(step.title),
      description: typeof step.description === "string" ? step.description : "",
      approvalRequired: Boolean(step.approvalRequired),
      tools: Array.isArray(step.tools) ? step.tools.filter((tool): tool is string => typeof tool === "string") : [],
      toolRequired: Boolean(step.toolRequired)
    }));
}

async function persistLogs(runId: string, logs: RunLogEntry[]) {
  await prisma.workflowRun.update({
    where: { id: runId },
    data: { logs: logs as unknown as Prisma.InputJsonValue }
  });
}

async function runStepWithModel(input: {
  client: OpenAI;
  command: string;
  workflowName: string;
  step: StepDefinition;
  stepIndex: number;
  totalSteps: number;
  priorResults: StepResult[];
  logs: RunLogEntry[];
  artifacts: ToolArtifact[];
}): Promise<StepResult> {
  const { client, step, priorResults } = input;
  const priorContext =
    priorResults.length > 0
      ? `Results of prior steps:\n${priorResults.map((prior) => `- ${prior.title}: ${prior.result}`).join("\n")}`
      : "This is the first step.";

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: PERSONA },
    {
      role: "user",
      content: [
        `Operator command: "${input.command}"`,
        `Workflow: ${input.workflowName} — step ${input.stepIndex + 1} of ${input.totalSteps}.`,
        `Current step: ${step.title} — ${step.description}`,
        priorContext,
        step.toolRequired
          ? "This step is not complete until at least one allowed tool call succeeds."
          : null,
        "Execute this step now using tools as needed, then reply with the step result."
      ].filter(Boolean).join("\n\n")
    }
  ];

  let toolCallCount = 0;
  let successfulToolCallCount = 0;
  const allowedTools = toOpenAITools(step.tools);

  for (let round = 0; round < MAX_TOOL_ROUNDS_PER_STEP; round++) {
    const response = await client.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      temperature: 0.3,
      messages,
      ...(allowedTools.length > 0 ? { tools: allowedTools } : {})
    });

    const message = response.choices[0]?.message;
    if (!message) break;

    const toolCalls = message.tool_calls ?? [];
    if (toolCalls.length === 0) {
      if (step.toolRequired && successfulToolCallCount === 0) {
        throw new Error(`Step "${step.title}" ended without a required successful tool call.`);
      }
      return { title: step.title, result: message.content?.trim() || "Step completed.", toolCalls: toolCallCount };
    }

    messages.push(message);

    for (const toolCall of toolCalls) {
      if (toolCall.type !== "function") continue;
      toolCallCount += 1;
      const result = await executeTool(toolCall.function.name, toolCall.function.arguments, step.tools);
      if (result.ok) successfulToolCallCount += 1;
      if (result.artifact) input.artifacts.push(result.artifact);
      input.logs.push(
        logEntry(
          "TOOL_CALL",
          `${toolCall.function.name} → ${result.ok ? "ok" : `error: ${result.error ?? "unknown"}`}`
        )
      );
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result).slice(0, 12000)
      });
    }
  }

  throw new Error(`Step "${step.title}" did not finish within the ${MAX_TOOL_ROUNDS_PER_STEP}-round tool limit.`);
}

async function failClaimedRun(runId: string, logs: RunLogEntry[], message: string) {
  logs.push(logEntry("EXECUTION_BLOCKED", message));
  return prisma.workflowRun.update({
    where: { id: runId },
    data: {
      status: "FAILED",
      output: { summary: message, steps: [], artifacts: [], engine: "none" } as unknown as Prisma.InputJsonValue,
      logs: logs as unknown as Prisma.InputJsonValue
    },
    include: { workflowTemplate: true, approvals: true }
  });
}

/**
 * Janitor: a crash mid-run leaves a row stuck in RUNNING. Anything RUNNING
 * longer than maxAgeMinutes is dead — mark it FAILED so the queue stays honest.
 * Cheap enough to call from read paths; returns the number of runs swept.
 */
export async function sweepStaleRuns(maxAgeMinutes = 15): Promise<number> {
  if (!env.DATABASE_URL) return 0;
  try {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    const stale = await prisma.workflowRun.findMany({
      where: { status: "RUNNING", updatedAt: { lt: cutoff } },
      select: { id: true, logs: true }
    });
    for (const run of stale) {
      const logs = normalizeLogs(run.logs);
      logs.push(
        logEntry("EXECUTION_ABANDONED", `Run was stuck in RUNNING for over ${maxAgeMinutes} minutes; marked FAILED by the janitor.`)
      );
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          output: {
            summary: "Execution was interrupted (process crashed or timed out) and the run was reclaimed by the janitor.",
            steps: [],
            artifacts: [],
            engine: "none"
          } as unknown as Prisma.InputJsonValue,
          logs: logs as unknown as Prisma.InputJsonValue
        }
      });
    }
    return stale.length;
  } catch {
    return 0;
  }
}

/**
 * Executes a QUEUED workflow run to completion. Claims the run atomically, so
 * concurrent triggers (approval hook, manual execute, command route) are safe.
 * Returns the final run record, or null if the run was not claimable.
 */
export async function executeWorkflowRun(runId: string): Promise<WorkflowRun | null> {
  if (!env.DATABASE_URL) return null;

  const claimed = await prisma.workflowRun.updateMany({
    where: { id: runId, status: "QUEUED" },
    data: { status: "RUNNING" }
  });
  if (claimed.count === 0) return null;

  const run = await prisma.workflowRun.findUnique({
    where: { id: runId },
    include: { workflowTemplate: true, approvals: true }
  });
  if (!run) return null;

  const logs = normalizeLogs(run.logs);
  const steps = normalizeSteps(run.workflowTemplate?.steps ?? null);
  const workflowName = run.workflowTemplate?.name ?? "Ad hoc workflow";
  if (steps.length === 0) {
    return failClaimedRun(run.id, logs, "Execution cannot start because the workflow has no valid steps.");
  }

  const approvalStepCount = steps.filter((step) => step.approvalRequired).length;
  if (
    approvalStepCount > 0 &&
    (run.approvals.length !== approvalStepCount || run.approvals.some((approval) => approval.status !== "APPROVED"))
  ) {
    return failClaimedRun(
      run.id,
      logs,
      "Execution cannot start because the workflow's approval gates are incomplete or inconsistent."
    );
  }

  const invalidToolContracts = steps.filter((step) => step.toolRequired && step.tools.length === 0);
  if (invalidToolContracts.length > 0) {
    return failClaimedRun(
      run.id,
      logs,
      `Execution cannot start because required-tool steps declare no tools: ${invalidToolContracts
        .map((step) => step.title)
        .join(", ")}.`
    );
  }

  const unknownTools = steps.flatMap((step) => step.tools).filter((name) => !getAgentTool(name));
  if (unknownTools.length > 0) {
    return failClaimedRun(
      run.id,
      logs,
      `Execution cannot start because the workflow declares unknown tools: ${[...new Set(unknownTools)].join(", ")}.`
    );
  }

  const client = getOpenAIClient();
  if (!client) {
    return failClaimedRun(run.id, logs, "Execution cannot start because OPENAI_API_KEY is not configured.");
  }
  const engine: RunOutput["engine"] = "openai";

  logs.push(logEntry("EXECUTION_STARTED", `Executing ${workflowName} (${steps.length} steps, engine: ${engine}).`));
  await persistLogs(run.id, logs);

  const stepResults: StepResult[] = [];
  const artifacts: ToolArtifact[] = [];

  try {
    for (const [index, step] of steps.entries()) {
      if (step.approvalRequired) {
        logs.push(logEntry("APPROVAL_GATE", `Gate "${step.title}" cleared by operator before execution.`));
        stepResults.push({ title: step.title, result: "Approval gate cleared by operator.", toolCalls: 0 });
        await persistLogs(run.id, logs);
        continue;
      }

      const result = await runStepWithModel({
        client,
        command: run.command,
        workflowName,
        step,
        stepIndex: index,
        totalSteps: steps.length,
        priorResults: stepResults,
        logs,
        artifacts
      });

      stepResults.push(result);
      logs.push(logEntry("STEP_COMPLETED", `${step.title}: ${result.result.slice(0, 220)}`));
      await persistLogs(run.id, logs);
    }

    const lastResult = stepResults.at(-1);
    const summary = lastResult
      ? lastResult.result
      : "Workflow completed with no executable steps.";
    const output: RunOutput = { summary, steps: stepResults, artifacts, engine };

    logs.push(
      logEntry(
        "EXECUTION_COMPLETED",
        `Completed ${stepResults.length} steps with ${artifacts.length} artifact(s).`
      )
    );

    return await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        output: output as unknown as Prisma.InputJsonValue,
        logs: logs as unknown as Prisma.InputJsonValue
      },
      include: { workflowTemplate: true, approvals: true }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown execution failure.";
    logs.push(logEntry("EXECUTION_FAILED", message));
    return await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        output: { summary: `Execution failed: ${message}`, steps: stepResults, artifacts, engine } as unknown as Prisma.InputJsonValue,
        logs: logs as unknown as Prisma.InputJsonValue
      },
      include: { workflowTemplate: true, approvals: true }
    });
  }
}
