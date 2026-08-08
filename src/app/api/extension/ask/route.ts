import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { getOpenAIClient } from "@/lib/openai";
import { getGroundingContext } from "@/lib/ai/retrieval";
import { verifyExtensionAuth } from "@/lib/extension-auth";

export const maxDuration = 60;

const askSchema = z.object({
  question: z.string().min(1),
  page: z
    .object({
      url: z.string().optional(),
      title: z.string().optional(),
      selection: z.string().optional()
    })
    .optional()
});

export async function POST(request: Request) {
  try {
    if (!(await verifyExtensionAuth(request))) {
      return NextResponse.json(
        { error: "Unauthorized. Pair the extension with the token shown on /settings." },
        { status: 401 }
      );
    }

    const { question, page } = askSchema.parse(await request.json());

    if (!env.DATABASE_URL) {
      return NextResponse.json({
        answer:
          "My knowledge base is not connected yet (DATABASE_URL is unset). I can answer once the database is online.",
        sources: []
      });
    }

    const { matches, mode } = await getGroundingContext(
      [question, page?.title].filter(Boolean).join(" ")
    );

    const client = getOpenAIClient();
    if (!client) {
      return NextResponse.json({
        answer: matches.length
          ? `I found ${matches.length} related knowledge records but need OPENAI_API_KEY to reason over them. Best match: ${matches[0].title}.`
          : "I have no saved knowledge yet and no model configured. Capture a few things first.",
        sources: matches.slice(0, 3).map((item) => ({ id: item.id, title: item.title }))
      });
    }

    const contextText = matches
      .map((item) => `Category: ${item.category}\nTitle: ${item.title}\nSummary: ${item.summary}`)
      .join("\n\n");

    const response = await client.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are Jarvis, a calm, sharp, quietly witty personal AI assistant answering inside a small browser panel. Ground answers in the user's saved knowledge; relate them to the page they are viewing when relevant. Be concise — a few sentences. Say plainly when saved knowledge has nothing relevant."
        },
        {
          role: "user",
          content: [
            page?.title ? `Current page: ${page.title}` : null,
            page?.url ? `URL: ${page.url}` : null,
            page?.selection ? `Selected text on the page:\n${page.selection.slice(0, 1500)}` : null,
            matches.length ? `Saved knowledge (${mode} retrieval):\n${contextText}` : "Saved knowledge: (none found)",
            `Question: ${question}`
          ]
            .filter(Boolean)
            .join("\n\n")
        }
      ]
    });

    return NextResponse.json({
      answer: response.choices[0]?.message.content ?? "I could not form an answer.",
      retrieval: mode,
      sources: matches.slice(0, 4).map((item) => ({ id: item.id, title: item.title, category: item.category }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to answer." },
      { status: 500 }
    );
  }
}
