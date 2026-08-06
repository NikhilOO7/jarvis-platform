import type OpenAI from "openai";
import type { Prisma, WorkflowRun } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/openai";
import { env } from "@/lib/env";
import { executeTool, toOpenAITools, type ToolArtifact } from "@/lib/agents/tools";

export type RunLogEntry = { at: string; event: string; message: string };

type StepDefinition = { title: string; description: string; approvalRequired?: boolean };

type StepResult = { title: string; result: string; toolCalls: number };

export type RunOutput = {
  summary: string;
  steps: StepResult[];
  artifacts: ToolArtifact[];
  engine: "openai" | "offline_simulation";
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
      approvalRequired: Boolean(step.approvalRequired)
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
        "Execute this step now using tools as needed, then reply with the step result."
      ].join("\n\n")
    }
  ];

  let toolCallCount = 0;

  for (let round = 0; round < MAX_TOOL_ROUNDS_PER_STEP; round++) {
    const response = await client.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      temperature: 0.3,
      messages,
      tools: toOpenAITools()
    });

    const message = response.choices[0]?.message;
    if (!message) break;

    const toolCalls = message.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return { title: step.title, result: message.content?.trim() || "Step completed.", toolCalls: toolCallCount };
    }

    messages.push(message);

    for (const toolCall of toolCalls) {
      if (toolCall.type !== "function") continue;
      toolCallCount += 1;
      const result = await executeTool(toolCall.function.name, toolCall.function.arguments);
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

  return {
    title: step.title,
    result: "Step ended after reaching the tool-call limit; partial results are in the log.",
    toolCalls: toolCallCount
  };
}

function simulateStep(step: StepDefinition, command: string): StepResult {
  return {
    title: step.title,
    result: `Simulated (no OPENAI_API_KEY): ${step.description || step.title} for command "${command}".`,
    toolCalls: 0
  };
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
    include: { workflowTemplate: true }
  });
  if (!run) return null;

  const logs = normalizeLogs(run.logs);
  const steps = normalizeSteps(run.workflowTemplate?.steps ?? null);
  const workflowName = run.workflowTemplate?.name ?? "Ad hoc workflow";
  const client = getOpenAIClient();
  const engine: RunOutput["engine"] = client ? "openai" : "offline_simulation";

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

      const result = client
        ? await runStepWithModel({
            client,
            command: run.command,
            workflowName,
            step,
            stepIndex: index,
            totalSteps: steps.length,
            priorResults: stepResults,
            logs,
            artifacts
          })
        : simulateStep(step, run.command);

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
