import type { AgentKind } from "@prisma/client";

export type WorkflowTemplateDefinition = {
  key: string;
  name: string;
  description: string;
  trigger: string;
  agentKinds: AgentKind[];
  requiredScopes: string[];
  risk: "low" | "medium" | "high";
  steps: Array<{
    title: string;
    description: string;
    approvalRequired?: boolean;
  }>;
};

export const workflowTemplates: WorkflowTemplateDefinition[] = [
  {
    key: "telegram_voice_command_router",
    name: "Telegram Voice Command Router",
    description: "Accepts voice or text commands, transcribes speech, classifies intent, and routes to the correct agent.",
    trigger: "Telegram message or voice note",
    agentKinds: ["VOICE", "ORCHESTRATOR"],
    requiredScopes: ["telegram:read", "speech:transcribe", "memory:read"],
    risk: "medium",
    steps: [
      { title: "Receive command", description: "Capture Telegram text or voice payload." },
      { title: "Transcribe voice", description: "Convert voice note into text when needed." },
      { title: "Classify intent", description: "Detect target agent, urgency, risk, and required context." },
      { title: "Route task", description: "Create a workflow run for the selected agent." }
    ]
  },
  {
    key: "email_draft_and_reply",
    name: "Email Draft And Reply",
    description: "Summarizes a thread, extracts intent, drafts a professional reply, and waits for approval before sending.",
    trigger: "Email command or selected thread",
    agentKinds: ["EMAIL"],
    requiredScopes: ["email:read", "email:draft", "approval:send"],
    risk: "high",
    steps: [
      { title: "Load email context", description: "Retrieve selected thread and sender context." },
      { title: "Summarize thread", description: "Extract decision, tone, action items, and deadlines." },
      { title: "Draft reply", description: "Generate a professional response in the user's preferred voice." },
      { title: "Approval gate", description: "Show recipient, subject, and body before sending.", approvalRequired: true }
    ]
  },
  {
    key: "calendar_scheduling_assistant",
    name: "Calendar Scheduling Assistant",
    description: "Checks availability, proposes meeting times, and creates or updates events after explicit approval.",
    trigger: "Scheduling command",
    agentKinds: ["CALENDAR", "CONTACTS"],
    requiredScopes: ["calendar:read", "calendar:write", "contacts:read"],
    risk: "high",
    steps: [
      { title: "Parse request", description: "Identify attendees, time window, duration, topic, and location." },
      { title: "Check availability", description: "Find open slots and conflicts." },
      { title: "Prepare event", description: "Draft event title, description, attendees, and reminders." },
      { title: "Approval gate", description: "Confirm calendar mutation before writing.", approvalRequired: true }
    ]
  },
  {
    key: "competitor_research_brief",
    name: "Competitor Research Brief",
    description: "Runs internet research, compares sources, summarizes findings, and stores the brief in knowledge memory.",
    trigger: "Research command",
    agentKinds: ["RESEARCH", "KNOWLEDGE"],
    requiredScopes: ["web:search", "memory:write"],
    risk: "medium",
    steps: [
      { title: "Define research question", description: "Clarify topic, market, competitors, and desired output." },
      { title: "Search sources", description: "Collect current sources and evidence." },
      { title: "Synthesize brief", description: "Compare findings, note uncertainty, and produce a concise report." },
      { title: "Attach to memory", description: "Create knowledge records and entity relationships." }
    ]
  },
  {
    key: "expense_receipt_logger",
    name: "Expense Receipt Logger",
    description: "Parses receipt text, extracts vendor and amount, categorizes spending, and creates an expense record.",
    trigger: "Receipt upload, email receipt, or expense command",
    agentKinds: ["EXPENSES"],
    requiredScopes: ["expenses:write", "files:read"],
    risk: "high",
    steps: [
      { title: "Parse receipt", description: "Extract vendor, date, total, currency, category, and notes." },
      { title: "Classify expense", description: "Map to personal or business category." },
      { title: "Approval gate", description: "Confirm financial record before saving.", approvalRequired: true },
      { title: "Log expense", description: "Store expense details and link related product/vendor memory." }
    ]
  },
  {
    key: "daily_executive_briefing",
    name: "Daily Executive Briefing",
    description: "Combines calendar, saved knowledge, email signals, reminders, workouts, meals, and job actions into one briefing.",
    trigger: "Scheduled daily run",
    agentKinds: ["ORCHESTRATOR", "EMAIL", "CALENDAR", "KNOWLEDGE"],
    requiredScopes: ["calendar:read", "email:read", "memory:read"],
    risk: "medium",
    steps: [
      { title: "Gather signals", description: "Read recent knowledge, calendar events, reminders, and priority items." },
      { title: "Rank importance", description: "Identify decisions, deadlines, and opportunities." },
      { title: "Generate briefing", description: "Create a concise action-oriented daily readout." },
      { title: "Deliver", description: "Send to web dashboard and optional Telegram/voice output." }
    ]
  }
];

export function getWorkflowTemplate(key: string) {
  return workflowTemplates.find((workflow) => workflow.key === key);
}
