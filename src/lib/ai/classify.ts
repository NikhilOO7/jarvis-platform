import { getOpenAIClient } from "@/lib/openai";
import { contentCategories, type ContentCategory } from "@/lib/categories";
import { env } from "@/lib/env";

const keywordMap: Array<[ContentCategory, string[]]> = [
  ["FOOD", ["recipe", "protein", "calorie", "macro", "meal", "diet", "ingredient", "creatine", "nutrition"]],
  ["WORKOUT", ["workout", "exercise", "lift", "muscle", "mobility", "sets", "reps", "training", "cardio"]],
  ["TECH", ["typescript", "react", "next.js", "ai", "database", "api", "coding", "software", "architecture"]],
  ["PRODUCTS", ["buy", "review", "price", "deal", "alternative", "product", "cart", "wishlist"]],
  ["JOBS", ["job", "role", "resume", "linkedin", "interview", "company", "recruiter", "application"]]
];

export async function classifyContent(input: { title?: string | null; text?: string | null; url?: string | null }) {
  const combined = [input.title, input.text, input.url].filter(Boolean).join("\n").slice(0, 6000);
  const client = getOpenAIClient();

  if (client) {
    const response = await client.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Classify saved personal content into exactly one category: FOOD, WORKOUT, TECH, PRODUCTS, JOBS, or MISC. Return only the category."
        },
        { role: "user", content: combined }
      ]
    });

    const category = response.choices[0]?.message.content?.trim().toUpperCase();
    if (contentCategories.includes(category as ContentCategory)) {
      return category as ContentCategory;
    }
  }

  const lower = combined.toLowerCase();
  const match = keywordMap.find(([, keywords]) => keywords.some((keyword) => lower.includes(keyword)));
  return match?.[0] ?? "MISC";
}
