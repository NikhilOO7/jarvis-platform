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
    description: "Draft, send after approval, reply, categorize, summarize, route, and process inbox workflows.",
    capabilities: ["Draft professional emails", "Categorize incoming mail", "Extract action items", "Prepare replies", "Route inbox tasks"],
    icon: Mail
  },
  {
    title: "Calendar Management",
    description: "Check availability, schedule meetings, update events, handle requests, and prepare agendas.",
    capabilities: ["Check availability", "Schedule with approval", "Update events", "Detect conflicts", "Prepare meeting briefs"],
    icon: CalendarDays
  },
  {
    title: "Contact Management",
    description: "Search, add, edit, enrich, and recall contacts, relationships, reminders, and communication context.",
    capabilities: ["Search contacts", "Add contact notes", "Recall relationship context", "Track follow-ups", "Prepare outreach context"],
    icon: Contact
  },
  {
    title: "AI Research Agent",
    description: "Run competitor research, market insights, topic summaries, data gathering, and deep internet research.",
    capabilities: ["Competitor research", "Market insights", "Source comparison", "Topic summaries", "Deep research briefs"],
    icon: Search
  },
  {
    title: "Expense Tracking Agent",
    description: "Track expenses, log spending, organize records, monitor subscriptions, and connect purchases to products.",
    capabilities: ["Log spending", "Categorize expenses", "Track subscriptions", "Parse receipts", "Summarize monthly costs"],
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
    description: "Text or voice commands enter Jarvis from a Telegram-style command surface.",
    icon: Send
  },
  {
    title: "Voice Input",
    description: "Voice notes become structured commands through speech-to-text.",
    icon: Mic
  },
  {
    title: "Memory Buffer",
    description: "Jarvis keeps working conversation context so commands build on prior intent.",
    icon: Brain
  },
  {
    title: "Agent Router",
    description: "Intent analysis selects the correct internal agent, tool, workflow, or approval path.",
    icon: Network
  },
  {
    title: "Workflow Orchestrator",
    description: "Native Jarvis workflows execute multi-step tasks, log progress, and coordinate tools.",
    icon: Workflow
  },
  {
    title: "Voice Output",
    description: "Optional text-to-speech lets Jarvis respond with spoken status updates.",
    icon: Volume2
  },
  {
    title: "Personality Engine",
    description: "Tone adapts by intent: sharp, concise, lightly witty, formal, or careful.",
    icon: Bot
  },
  {
    title: "Multi-Agent Delegation",
    description: "Specialized agents cooperate across email, calendar, contacts, research, expenses, and tools.",
    icon: MessageCircle
  }
] as const;

export const executionSteps = [
  "User sends a text or voice command through Telegram, web chat, browser, desktop, or mobile.",
  "Voice is transcribed into text when needed.",
  "Jarvis analyzes intent, urgency, required memory, target tool, and risk level.",
  "The memory buffer and knowledge graph provide context.",
  "The agent router selects the correct internal agent or native workflow.",
  "The workflow executes, with approval gates before emails, calendar edits, contact changes, purchases, or sensitive data transfer.",
  "Jarvis responds with text, optional voice, execution status, and memory updates."
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
  "Jarvis native workflow orchestration",
  "OpenAI GPT reasoning",
  "OpenAI Whisper or speech-to-text",
  "Optional Anthropic personality/reasoning model",
  "ElevenLabs or text-to-speech provider",
  "Telegram API",
  "Internal tool agents",
  "Postgres, pgvector, and Prisma memory layer"
] as const;
