import type { AgentKind } from "@prisma/client";
import { workflowTemplates, type WorkflowTemplateDefinition } from "@/lib/workflow-templates";

export type CommandRoute = {
  agentKind: AgentKind;
  workflow: WorkflowTemplateDefinition;
  confidence: number;
  approvalRequired: boolean;
  risk: WorkflowTemplateDefinition["risk"];
  rationale: string;
  suggestedResponse: string;
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
    rationale: "The command appears to require internet research or source comparison."
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

  const fallback = { ...routes[routes.length - 1], score: 0 };
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
      : "I can route this into the workflow and report back with results."
  };
}
