import { getOpenAIClient } from "@/lib/openai";
import { env } from "@/lib/env";

export async function summarizeContent(input: { title?: string | null; text?: string | null; url?: string | null }) {
  const combined = [input.title, input.url, input.text].filter(Boolean).join("\n").slice(0, 8000);
  const client = getOpenAIClient();

  if (client && combined.length > 0) {
    const response = await client.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Summarize saved personal knowledge in 2 concise sentences. Emphasize why it may matter and possible action."
        },
        { role: "user", content: combined }
      ]
    });

    return response.choices[0]?.message.content?.trim() || "Saved for later review.";
  }

  if (input.text) return input.text.slice(0, 220);
  if (input.title) return input.title;
  if (input.url) return `Saved link: ${input.url}`;
  return "Saved for later review.";
}
