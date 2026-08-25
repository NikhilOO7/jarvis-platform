import {
  Bot,
  Brain,
  Calculator,
  CalendarDays,
  Contact,
  DollarSign,
  Mail,
  MessageCircle,
  Mic,
  Network,
  Search,
  Send,
  Volume2,
  Workflow
} from "lucide-react";

export const agentModules = [
  {
    title: "Email Automation Agent",
    description: "Reads recent Gmail context and creates local draft artifacts. Gmail writes and sends are disabled in Phase 0.",
    capabilities: ["Read recent email", "Summarize context", "Extract action items", "Create local drafts", "No Gmail writes"],
    icon: Mail
  },
  {
    title: "Calendar Management",
    description: "Reads upcoming Google Calendar events and creates local meeting proposals. Calendar writes are disabled in Phase 0.",
    capabilities: ["Read upcoming events", "Inspect availability", "Detect visible conflicts", "Create local proposals", "No calendar writes"],
    icon: CalendarDays
  },
  {
    title: "Contact Management",
    description: "A planned capability. Contact schemas exist, but contact search, editing, and enrichment tools are not implemented.",
    capabilities: ["Schema only", "No contact connector", "No contact edits", "No enrichment", "No external effects"],
    icon: Contact
  },
  {
    title: "AI Research Agent",
    description: "Searches and synthesizes saved knowledge. Citation-backed external web research is not implemented.",
    capabilities: ["Search saved knowledge", "Compare saved sources", "Summarize topics", "Save local briefs", "No web retrieval"],
    icon: Search
  },
  {
    title: "Expense Tracking Agent",
    description: "Parses expense details and stores a local knowledge record. No bank, accounting, or payment system is connected.",
    capabilities: ["Parse expense text", "Categorize expenses", "Create local records", "Link saved context", "No financial connector"],
    icon: DollarSign
  },
  {
    title: "Calculator And Logic Agent",
    description: "Handle pricing, unit conversions, profit estimates, business math, logic checks, and utility calculations.",
    capabilities: ["Pricing calculations", "Unit conversions", "Profit estimates", "Business math", "Logic checks"],
    icon: Calculator
  }
] as const;

export const automationStack = [
  {
    title: "Telegram Control Center",
    description: "Text commands can enter through the Telegram bridge when its bot and scoped service token are configured.",
    icon: Send
  },
  {
    title: "Voice Input",
    description: "Planned. Telegram voice-note transcription and web speech input are not implemented.",
    icon: Mic
  },
  {
    title: "Memory Buffer",
    description: "Chat turns and saved knowledge persist when Postgres is connected; command history is page-local.",
    icon: Brain
  },
  {
    title: "Agent Router",
    description: "Intent analysis selects the correct internal agent, tool, workflow, or approval path.",
    icon: Network
  },
  {
    title: "Workflow Orchestrator",
    description: "Runs defined multi-step workflows, records step state, and exposes only each step's allowlisted tools.",
    icon: Workflow
  },
  {
    title: "Voice Output",
    description: "Planned. Text-to-speech output is not implemented even when a provider key is present.",
    icon: Volume2
  },
  {
    title: "Personality Engine",
    description: "Tone adapts by intent: sharp, concise, lightly witty, formal, or careful.",
    icon: Bot
  },
  {
    title: "Multi-Agent Delegation",
    description: "Planned. Current workflows route to agent kinds but do not delegate concurrently between autonomous agents.",
    icon: MessageCircle
  }
] as const;

export const executionSteps = [
  "The operator sends a text command through the web UI or configured Telegram bridge.",
  "The request is authenticated as an operator session or a service credential with the required scope.",
  "The router selects a workflow using the configured model or keyword fallback.",
  "A database-backed run is created; without Postgres the response is explicitly a dry run.",
  "Each step receives only its declared tool allowlist and records its observed state.",
  "Authenticated browser commands may read connected Google data and create local artifacts, but cannot write to Gmail or Calendar.",
  "The caller receives text plus the observed queued, running, completed, failed, or dry-run state."
] as const;

export const targetUsers = [
  "Agency owners",
  "Startup founders",
  "Entrepreneurs",
  "Content creators",
  "Remote teams",
  "Business operators",
  "Productivity-focused personal power users"
] as const;

export const technologyStack = [
  "Implemented: Jarvis workflow orchestration with per-step tool allowlists",
  "Implemented when configured: OpenAI chat reasoning and embeddings",
  "Planned: speech-to-text input",
  "Planned: optional additional reasoning providers",
  "Planned: text-to-speech output",
  "Implemented when configured: Telegram text-command bridge",
  "Implemented: local tools plus read-only Google tools",
  "Implemented when configured: Postgres, pgvector, and Prisma memory layer"
] as const;
