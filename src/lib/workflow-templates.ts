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
    tools?: string[];
    toolRequired?: boolean;
  }>;
};

export const workflowTemplates: WorkflowTemplateDefinition[] = [
  {
    key: "telegram_voice_command_router",
    name: "Utility Command Router",
    description: "Handles web or Telegram text commands with safe local tools. Voice-note transcription is not implemented.",
    trigger: "Web or Telegram text command",
    agentKinds: ["ORCHESTRATOR", "CALCULATOR"],
    requiredScopes: ["command:write", "memory:read"],
    risk: "medium",
    steps: [
      { title: "Receive command", description: "Capture the text command." },
      { title: "Normalize command", description: "Validate and normalize the text payload." },
      { title: "Classify intent", description: "Detect target agent, urgency, risk, and required context." },
      {
        title: "Route task",
        description: "Use only safe local utilities needed to answer the command.",
        tools: ["calculate", "get_current_time", "search_knowledge", "get_briefing_snapshot", "list_recent_runs", "explore_entity"]
      }
    ]
  },
  {
    key: "email_draft_and_reply",
    name: "Email Draft And Reply",
    description: "Reads email context and creates a local reply draft artifact. It cannot write to Gmail or send mail in Phase 0.",
    trigger: "Email command or selected thread",
    agentKinds: ["EMAIL"],
    requiredScopes: ["email:read", "memory:read"],
    risk: "medium",
    steps: [
      { title: "Load email context", description: "Retrieve selected thread and sender context.", tools: ["list_recent_emails", "search_knowledge"], toolRequired: true },
      { title: "Summarize thread", description: "Extract decision, tone, action items, and deadlines.", tools: ["list_recent_emails", "search_knowledge"] },
      { title: "Draft reply", description: "Generate a local draft artifact in the user's preferred voice.", tools: ["draft_email"], toolRequired: true }
    ]
  },
  {
    key: "calendar_scheduling_assistant",
    name: "Calendar Scheduling Assistant",
    description: "Reads availability and creates a local meeting proposal. It cannot create or update calendar events in Phase 0.",
    trigger: "Scheduling command",
    agentKinds: ["CALENDAR", "CONTACTS"],
    requiredScopes: ["calendar:read", "memory:read"],
    risk: "medium",
    steps: [
      { title: "Parse request", description: "Identify attendees, time window, duration, topic, and location.", tools: ["search_knowledge"] },
      { title: "Check availability", description: "Find open slots and conflicts.", tools: ["list_calendar_events"], toolRequired: true },
      { title: "Prepare event", description: "Create a local event proposal; do not modify a calendar.", tools: ["propose_calendar_event"], toolRequired: true }
    ]
  },
  {
    key: "competitor_research_brief",
    name: "Saved-Knowledge Research Brief",
    description: "Searches and synthesizes saved knowledge only. Citation-backed internet research is not implemented.",
    trigger: "Research command",
    agentKinds: ["RESEARCH", "KNOWLEDGE"],
    requiredScopes: ["memory:read", "memory:write"],
    risk: "medium",
    steps: [
      { title: "Define research question", description: "Clarify topic, market, competitors, and desired output." },
      { title: "Search sources", description: "Search saved sources only; external web research is not armed yet.", tools: ["search_knowledge", "explore_entity"], toolRequired: true },
      { title: "Synthesize brief", description: "Compare saved findings, note uncertainty, and produce a concise report.", tools: ["search_knowledge"] },
      { title: "Attach to memory", description: "Create a knowledge note from the resulting brief.", tools: ["save_knowledge_note"], toolRequired: true }
    ]
  },
  {
    key: "expense_receipt_logger",
    name: "Expense Receipt Logger",
    description: "Parses receipt text and creates a local expense knowledge record; no financial system is connected.",
    trigger: "Receipt upload, email receipt, or expense command",
    agentKinds: ["EXPENSES"],
    requiredScopes: ["memory:write"],
    risk: "medium",
    steps: [
      { title: "Parse receipt", description: "Extract vendor, date, total, currency, category, and notes." },
      { title: "Classify expense", description: "Map to personal or business category." },
      { title: "Log expense", description: "Store expense details locally and link related product/vendor memory.", tools: ["record_expense"], toolRequired: true }
    ]
  },
  {
    key: "daily_executive_briefing",
    name: "Daily Executive Briefing",
    description: "Combines saved knowledge and recent workflow state into a local briefing. External-account reads are excluded in Phase 0.",
    trigger: "Scheduled daily run",
    agentKinds: ["ORCHESTRATOR", "KNOWLEDGE"],
    requiredScopes: ["memory:read", "runs:read"],
    risk: "medium",
    steps: [
      { title: "Gather signals", description: "Read recent saved knowledge and workflow state.", tools: ["get_briefing_snapshot", "list_recent_runs", "search_knowledge"], toolRequired: true },
      { title: "Rank importance", description: "Identify saved decisions, actions, and recurring topics.", tools: ["get_briefing_snapshot", "search_knowledge"] },
      { title: "Generate briefing", description: "Create a concise action-oriented daily readout.", tools: ["get_briefing_snapshot"] },
      { title: "Deliver", description: "Return the briefing to the requesting web or Telegram channel." }
    ]
  }
];

export function getWorkflowTemplate(key: string) {
  return workflowTemplates.find((workflow) => workflow.key === key);
}
