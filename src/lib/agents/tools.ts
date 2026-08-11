import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { evaluateExpression } from "@/lib/agents/calculator";
import { ingestItem } from "@/lib/ingestion";
import { searchKnowledge } from "@/lib/ai/retrieval";

export type ToolArtifact = {
  type: "email_draft" | "calendar_event_proposal" | "expense_record" | "knowledge_note";
  title: string;
  payload: Record<string, unknown>;
};

export type ToolResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
  artifact?: ToolArtifact;
};

export type AgentTool = {
  name: string;
  description: string;
  risk: "low" | "medium" | "high";
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
};

const searchKnowledgeArgs = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(12).optional()
});

const saveNoteArgs = z.object({
  title: z.string().min(1),
  note: z.string().min(1)
});

const listRunsArgs = z.object({
  limit: z.number().int().min(1).max(20).optional()
});

const exploreEntityArgs = z.object({
  name: z.string().min(1)
});

const calculateArgs = z.object({
  expression: z.string().min(1)
});

const draftEmailArgs = z.object({
  to: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1)
});

const calendarEventArgs = z.object({
  title: z.string().min(1),
  startIso: z.string().min(1),
  endIso: z.string().min(1),
  attendees: z.array(z.string()).optional(),
  location: z.string().optional()
});

const expenseArgs = z.object({
  vendor: z.string().min(1),
  amount: z.number(),
  currency: z.string().default("USD"),
  category: z.string().default("uncategorized"),
  dateIso: z.string().optional(),
  notes: z.string().optional()
});

export const agentTools: AgentTool[] = [
  {
    name: "search_knowledge",
    description:
      "Search the operator's saved knowledge base semantically. Use this whenever the task references saved content, memory, prior research, preferences, or anything the operator may have captured.",
    risk: "low",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language search query." },
        limit: { type: "number", description: "Max results (1-12), default 6." }
      },
      required: ["query"]
    },
    execute: async (args) => {
      const { query, limit } = searchKnowledgeArgs.parse(args);
      const matches = await searchKnowledge(query, limit ?? 6);
      return { ok: true, data: matches };
    }
  },
  {
    name: "save_knowledge_note",
    description:
      "Persist a new note, finding, or research brief into the operator's knowledge base so it is remembered permanently.",
    risk: "low",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        note: { type: "string", description: "The full note body to remember." }
      },
      required: ["title", "note"]
    },
    execute: async (args) => {
      const { title, note } = saveNoteArgs.parse(args);
      const { item } = await ingestItem({ sourceType: "API_CONNECTOR", title, text: note, platform: "jarvis-agent" });
      return {
        ok: true,
        data: { savedItemId: item.id, status: item.status },
        artifact: { type: "knowledge_note", title, payload: { itemId: item.id } }
      };
    }
  },
  {
    name: "get_briefing_snapshot",
    description:
      "Get a live snapshot of the operator's system: knowledge counts by category, latest saves, pending approvals, and recent workflow runs. Use for briefings and status questions.",
    risk: "low",
    parameters: { type: "object", properties: {} },
    execute: async () => {
      const [byCategory, latest, pendingApprovals, recentRuns] = await Promise.all([
        prisma.knowledgeItem.groupBy({ by: ["category"], _count: { _all: true } }),
        prisma.knowledgeItem.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { title: true, category: true, summary: true }
        }),
        prisma.approvalRequest.count({ where: { status: "PENDING" } }),
        prisma.workflowRun.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { command: true, status: true }
        })
      ]);
      return {
        ok: true,
        data: {
          knowledgeByCategory: byCategory.map((row) => ({ category: row.category, count: row._count._all })),
          latestSaves: latest,
          pendingApprovals,
          recentRuns
        }
      };
    }
  },
  {
    name: "list_recent_runs",
    description: "List recent workflow runs with their status, useful for reporting on what Jarvis has been doing.",
    risk: "low",
    parameters: {
      type: "object",
      properties: { limit: { type: "number", description: "Max runs (1-20), default 8." } }
    },
    execute: async (args) => {
      const { limit } = listRunsArgs.parse(args);
      const runs = await prisma.workflowRun.findMany({
        orderBy: { createdAt: "desc" },
        take: limit ?? 8,
        select: { id: true, command: true, status: true, createdAt: true }
      });
      return { ok: true, data: runs };
    }
  },
  {
    name: "explore_entity",
    description:
      "Look up a person, product, food, exercise, company, or concept in the operator's knowledge graph: where it was mentioned and what it co-occurs with. Use when a question centers on a specific thing or person.",
    risk: "low",
    parameters: {
      type: "object",
      properties: { name: { type: "string", description: "Entity name, e.g. 'creatine', 'Alex', 'Mark VII'" } },
      required: ["name"]
    },
    execute: async (args) => {
      const { name } = exploreEntityArgs.parse(args);
      const entity = await prisma.entity.findFirst({
        where: { name: { contains: name, mode: "insensitive" } },
        include: {
          mentions: {
            take: 8,
            orderBy: { createdAt: "desc" },
            include: { knowledgeItem: { select: { id: true, title: true, category: true, summary: true } } }
          },
          outgoing: { take: 10, orderBy: { weight: "desc" }, include: { toEntity: { select: { name: true, type: true } } } },
          incoming: { take: 10, orderBy: { weight: "desc" }, include: { fromEntity: { select: { name: true, type: true } } } }
        }
      });
      if (!entity) return { ok: true, data: { found: false, message: `No entity matching "${name}" in the graph yet.` } };
      return {
        ok: true,
        data: {
          found: true,
          entity: { type: entity.type, name: entity.name, description: entity.description },
          mentionedIn: entity.mentions.map((mention) => mention.knowledgeItem),
          relatedTo: [
            ...entity.outgoing.map((relation) => ({ ...relation.toEntity, weight: relation.weight })),
            ...entity.incoming.map((relation) => ({ ...relation.fromEntity, weight: relation.weight }))
          ].sort((a, b) => b.weight - a.weight)
        }
      };
    }
  },
  {
    name: "calculate",
    description:
      "Deterministically evaluate a math expression (+ - * / % ^ and parentheses). Always use this for arithmetic instead of computing in your head.",
    risk: "low",
    parameters: {
      type: "object",
      properties: { expression: { type: "string", description: "e.g. (49 - 18) / 49 * 100" } },
      required: ["expression"]
    },
    execute: async (args) => {
      const { expression } = calculateArgs.parse(args);
      return { ok: true, data: { expression, result: evaluateExpression(expression) } };
    }
  },
  {
    name: "get_current_time",
    description: "Get the current date and time.",
    risk: "low",
    parameters: { type: "object", properties: {} },
    execute: async () => {
      const now = new Date();
      return { ok: true, data: { iso: now.toISOString(), readable: now.toString() } };
    }
  },
  {
    name: "draft_email",
    description:
      "Create an email DRAFT artifact for operator review. This never sends anything — sending requires a connected email connector plus explicit operator approval.",
    risk: "high",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" }
      },
      required: ["to", "subject", "body"]
    },
    execute: async (args) => {
      const draft = draftEmailArgs.parse(args);
      return {
        ok: true,
        data: { status: "DRAFT_CREATED", note: "No email was sent. Draft awaits operator review." },
        artifact: { type: "email_draft", title: draft.subject, payload: draft }
      };
    }
  },
  {
    name: "propose_calendar_event",
    description:
      "Create a calendar event PROPOSAL artifact for operator review. This never writes to a real calendar — that requires a connected calendar connector plus explicit operator approval.",
    risk: "high",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        startIso: { type: "string", description: "Proposed start time, ISO 8601." },
        endIso: { type: "string", description: "Proposed end time, ISO 8601." },
        attendees: { type: "array", items: { type: "string" } },
        location: { type: "string" }
      },
      required: ["title", "startIso", "endIso"]
    },
    execute: async (args) => {
      const proposal = calendarEventArgs.parse(args);
      return {
        ok: true,
        data: { status: "PROPOSAL_CREATED", note: "No calendar was modified. Proposal awaits operator review." },
        artifact: { type: "calendar_event_proposal", title: proposal.title, payload: proposal }
      };
    }
  },
  {
    name: "record_expense",
    description:
      "Record an expense as a structured artifact and remember it in the knowledge base. Purely local record keeping — no financial system is touched.",
    risk: "medium",
    parameters: {
      type: "object",
      properties: {
        vendor: { type: "string" },
        amount: { type: "number" },
        currency: { type: "string" },
        category: { type: "string" },
        dateIso: { type: "string" },
        notes: { type: "string" }
      },
      required: ["vendor", "amount"]
    },
    execute: async (args) => {
      const expense = expenseArgs.parse(args);
      const title = `Expense: ${expense.vendor} — ${expense.amount} ${expense.currency}`;
      const note = [
        `Vendor: ${expense.vendor}`,
        `Amount: ${expense.amount} ${expense.currency}`,
        `Category: ${expense.category}`,
        expense.dateIso ? `Date: ${expense.dateIso}` : null,
        expense.notes ? `Notes: ${expense.notes}` : null
      ]
        .filter(Boolean)
        .join("\n");
      const { item } = await ingestItem({ sourceType: "API_CONNECTOR", title, text: note, platform: "jarvis-agent" });
      return {
        ok: true,
        data: { status: "EXPENSE_RECORDED", savedItemId: item.id },
        artifact: { type: "expense_record", title, payload: { ...expense, itemId: item.id } }
      };
    }
  }
];

export function getAgentTool(name: string) {
  return agentTools.find((tool) => tool.name === name);
}

export function toOpenAITools() {
  return agentTools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}

export async function executeTool(name: string, rawArgs: string): Promise<ToolResult> {
  const tool = getAgentTool(name);
  if (!tool) return { ok: false, error: `Unknown tool: ${name}` };

  try {
    const args = rawArgs.trim() ? (JSON.parse(rawArgs) as Record<string, unknown>) : {};
    return await tool.execute(args);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Tool execution failed." };
  }
}
