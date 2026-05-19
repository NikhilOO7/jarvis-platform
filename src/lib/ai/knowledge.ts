import type { ContentCategory } from "@/lib/categories";

export function deriveKnowledgeRecord(input: {
  title?: string | null;
  summary: string;
  category: ContentCategory;
  url?: string | null;
}) {
  return {
    title: input.title || input.url || "Untitled save",
    summary: input.summary,
    category: input.category,
    insights: [input.summary],
    actions: ["Review and decide whether this should become a plan, reminder, purchase, project, or reference."]
  };
}
