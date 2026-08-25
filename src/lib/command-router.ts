import type { AgentKind } from "@prisma/client";
import { z } from "zod";
import { env } from "@/lib/env";
import { getOpenAIClient } from "@/lib/openai";
import { workflowTemplates, type WorkflowTemplateDefinition } from "@/lib/workflow-templates";

export type CommandRoute = {
  agentKind: AgentKind;
  workflow: WorkflowTemplateDefinition;
  confidence: number;
  approvalRequired: boolean;
  risk: WorkflowTemplateDefinition["risk"];
  rationale: string;
  suggestedResponse: string;
  routedBy: "llm" | "keywords";
};

const routes: Array<{
  agentKind: AgentKind;
  workflowKey: string;
  keywords: string[];
  rationale: string;
}> = [
  {
    agentKind: "EMAIL",
    workflowKey: "email_draft_and_reply",
    keywords: ["email", "reply", "inbox", "send", "draft", "message"],
    rationale: "The command appears to involve email drafting, replies, inbox processing, or outbound communication."
  },
  {
    agentKind: "CALENDAR",
    workflowKey: "calendar_scheduling_assistant",
    keywords: ["calendar", "meeting", "schedule", "reschedule", "appointment", "availability"],
    rationale: "The command appears to involve scheduling or calendar availability."
  },
  {
    agentKind: "RESEARCH",
    workflowKey: "competitor_research_brief",
    keywords: ["research", "competitor", "market", "summarize", "sources", "internet", "find"],
    rationale: "The command appears to require research or source comparison; Phase 0 limits this route to saved knowledge."
  },
  {
    agentKind: "EXPENSES",
    workflowKey: "expense_receipt_logger",
    keywords: ["expense", "receipt", "spend", "subscription", "cost", "reimbursement", "invoice"],
    rationale: "The command appears to involve financial record keeping."
  },
  {
    agentKind: "CALCULATOR",
    workflowKey: "telegram_voice_command_router",
    keywords: ["calculate", "convert", "margin", "profit", "math", "pricing"],
    rationale: "The command appears to require deterministic calculation or business math."
  },
  {
    agentKind: "ORCHESTRATOR",
    workflowKey: "daily_executive_briefing",
    keywords: ["briefing", "today", "daily", "summary", "focus", "priorities"],
    rationale: "The command appears to request a multi-source briefing."
  }
];

export function routeCommand(command: string): CommandRoute {
  const lower = command.toLowerCase();
  const scored: Array<(typeof routes)[number] & { score: number }> = routes
    .map((route) => ({
      ...route,
      score: route.keywords.reduce((total, keyword) => total + (lower.includes(keyword) ? 1 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score);

  const fallback = {
    agentKind: "ORCHESTRATOR" as const,
    workflowKey: "telegram_voice_command_router",
    keywords: [],
    rationale: "No specialized workflow matched, so the command stays within the safe local utility router.",
    score: 0
  };
  const best = scored[0]?.score ? scored[0] : fallback;
  const workflow = workflowTemplates.find((template) => template.key === best.workflowKey) ?? workflowTemplates[0];
  const approvalRequired = workflow.steps.some((step) => step.approvalRequired);

  return {
    agentKind: best.agentKind,
    workflow,
    confidence: best.score ? Math.min(0.95, 0.55 + best.score * 0.12) : 0.42,
    approvalRequired,
    risk: workflow.risk,
    rationale: best.rationale,
    suggestedResponse: approvalRequired
      ? "I can prepare this, but I will require approval before making external changes."
      : "I can route this workflow and report its observed runtime status.",
    routedBy: "keywords"
  };
}

const llmRouteSchema = z.object({
  workflowKey: z.string(),
  agentKind: z.string(),
  confidence: z.number().min(0).max(1),
  rationale: z.string()
});

const knownAgentKinds: AgentKind[] = [
  "EMAIL",
  "CALENDAR",
  "CONTACTS",
  "RESEARCH",
  "EXPENSES",
  "CALCULATOR",
  "KNOWLEDGE",
  "VOICE",
  "ORCHESTRATOR",
  "CUSTOM"
];

/**
 * LLM intent routing with the keyword router as the offline/error fallback.
 */
export async function routeCommandSmart(command: string): Promise<CommandRoute> {
  const client = getOpenAIClient();
  if (!client) return routeCommand(command);

  try {
    const catalog = workflowTemplates
      .map(
        (workflow) =>
          `- key: ${workflow.key} | agents: ${workflow.agentKinds.join("/")} | risk: ${workflow.risk} | ${workflow.description}`
      )
      .join("\n");

    const response = await client.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are the intent router of a personal AI assistant. Pick the single best workflow for the operator's command.",
            "Available workflows:",
            catalog,
            'Reply with JSON only: {"workflowKey": string, "agentKind": string, "confidence": number 0-1, "rationale": string (one sentence)}.'
          ].join("\n")
        },
        { role: "user", content: command }
      ]
    });

    const parsed = llmRouteSchema.parse(JSON.parse(response.choices[0]?.message.content ?? "{}"));
    const workflow = workflowTemplates.find((template) => template.key === parsed.workflowKey);
    if (!workflow) return routeCommand(command);

    const agentKind = knownAgentKinds.includes(parsed.agentKind as AgentKind)
      ? (parsed.agentKind as AgentKind)
      : workflow.agentKinds[0];
    const approvalRequired = workflow.steps.some((step) => step.approvalRequired);

    return {
      agentKind,
      workflow,
      confidence: Math.min(0.99, Math.max(0.05, parsed.confidence)),
      approvalRequired,
      risk: workflow.risk,
      rationale: parsed.rationale,
      suggestedResponse: approvalRequired
        ? "I can prepare this, but I will require approval before making external changes."
        : "I can route this workflow and report its observed runtime status.",
      routedBy: "llm"
    };
  } catch {
    return routeCommand(command);
  }
}
