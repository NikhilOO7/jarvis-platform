import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { getOpenAIClient } from "@/lib/openai";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getGroundingContext } from "@/lib/ai/retrieval";
import { requireOperator } from "@/lib/auth";

const chatSchema = z.object({
  question: z.string().min(1),
  sessionId: z.string().optional()
});

async function persistTurn(input: {
  sessionId?: string;
  question: string;
  answer: string;
  sourceIds: string[];
}): Promise<string | null> {
  try {
    const session = input.sessionId
      ? await prisma.chatSession.findUnique({ where: { id: input.sessionId } })
      : null;
    const activeSession =
      session ??
      (await prisma.chatSession.create({
        data: { title: input.question.slice(0, 80) }
      }));

    await prisma.chatMessage.createMany({
      data: [
        { sessionId: activeSession.id, role: "user", content: input.question },
        {
          sessionId: activeSession.id,
          role: "assistant",
          content: input.answer,
          metadata: { sourceIds: input.sourceIds } as Prisma.InputJsonValue
        }
      ]
    });

    return activeSession.id;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!(await requireOperator(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const { question, sessionId } = chatSchema.parse(await request.json());
    if (!env.DATABASE_URL) {
      return NextResponse.json({
        answer:
          "The knowledge database is not connected yet. Set DATABASE_URL, run the Prisma migration, then I can answer from saved knowledge.",
        retrieval: "unavailable"
      });
    }

    const { matches, mode } = await getGroundingContext(question);

    if (mode === "unavailable") {
      return NextResponse.json(
        { error: "Saved knowledge could not be queried. Check the database connection and application logs.", retrieval: mode },
        { status: 503 }
      );
    }

    if (matches.length === 0) {
      return NextResponse.json({
        answer:
          "I do not have saved knowledge to reason over yet. Save a few links or paste an export, and I can start turning the pile into decisions.",
        retrieval: mode
      });
    }

    const client = getOpenAIClient();
    const contextText = matches
      .map(
        (item) =>
          `Category: ${item.category}\nTitle: ${item.title}\nSummary: ${item.summary}\nActions: ${item.actions.join("; ")}`
      )
      .join("\n\n");

    if (!client) {
      return NextResponse.json({
        answer: `I found ${matches.length} matching knowledge records. Add OPENAI_API_KEY to generate a grounded answer. Best match: ${matches[0].title} — ${matches[0].summary}`,
        retrieval: mode,
        sources: matches.map((item) => ({ id: item.id, title: item.title, score: item.score }))
      });
    }

    const response = await client.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are Jarvis, a calm, sharp, quietly witty personal AI assistant. Answer using only the saved knowledge context. Be concise, practical, and clear when the context is insufficient."
        },
        { role: "user", content: `Saved knowledge (retrieved by ${mode} search):\n${contextText}\n\nQuestion: ${question}` }
      ]
    });

    const answer = response.choices[0]?.message.content ?? "I could not form an answer.";
    const persistedSessionId = await persistTurn({
      sessionId,
      question,
      answer,
      sourceIds: matches.map((item) => item.id)
    });

    return NextResponse.json({
      answer,
      sessionId: persistedSessionId,
      retrieval: mode,
      sources: matches.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        score: item.score
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to answer." },
      { status: 500 }
    );
  }
}
