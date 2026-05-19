import { NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAIClient } from "@/lib/openai";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const chatSchema = z.object({
  question: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const { question } = chatSchema.parse(await request.json());
    if (!env.DATABASE_URL) {
      return NextResponse.json({
        answer:
          "The knowledge database is not connected yet. Set DATABASE_URL, run the Prisma migration, then I can answer from saved knowledge."
      });
    }

    const context = await prisma.knowledgeItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { title: true, summary: true, category: true, actions: true }
    });

    if (context.length === 0) {
      return NextResponse.json({
        answer:
          "I do not have saved knowledge to reason over yet. Save a few links or paste an export, and I can start turning the pile into decisions."
      });
    }

    const client = getOpenAIClient();
    const contextText = context
      .map((item) => `Category: ${item.category}\nTitle: ${item.title}\nSummary: ${item.summary}\nActions: ${item.actions.join("; ")}`)
      .join("\n\n");

    if (!client) {
      return NextResponse.json({
        answer: `I found ${context.length} recent knowledge records. Add OPENAI_API_KEY to generate a grounded answer. Most recent: ${context[0].title} — ${context[0].summary}`
      });
    }

    const response = await client.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a calm, sharp personal AI assistant. Answer using only the saved knowledge context. Be concise, practical, and clear when the context is insufficient."
        },
        { role: "user", content: `Saved knowledge:\n${contextText}\n\nQuestion: ${question}` }
      ]
    });

    return NextResponse.json({ answer: response.choices[0]?.message.content ?? "I could not form an answer." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to answer." },
      { status: 500 }
    );
  }
}
