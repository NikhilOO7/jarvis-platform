import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    if (!env.DATABASE_URL) {
      return NextResponse.json({
        generatedAt: new Date().toISOString(),
        items: [],
        nextActions: ["Set DATABASE_URL and run the Prisma migration to enable database-backed briefings."]
      });
    }

    const items = await prisma.knowledgeItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { title: true, summary: true, category: true, actions: true, createdAt: true }
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      items,
      nextActions: items.flatMap((item) => item.actions).slice(0, 5)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate briefing." },
      { status: 500 }
    );
  }
}
