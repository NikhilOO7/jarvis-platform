import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { ingestItem } from "@/lib/ingestion";

const importSchema = z.object({
  title: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  text: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    if (!env.DATABASE_URL) {
      return NextResponse.json({ error: "DATABASE_URL is not configured yet." }, { status: 503 });
    }

    const body = importSchema.parse(await request.json());
    const chunks = body.text
      .split(/\n{2,}|\r?\n(?=https?:\/\/)/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .slice(0, 50);

    const results = await Promise.all(
      chunks.map((chunk, index) =>
        ingestItem({
          sourceType: "FILE_IMPORT",
          title: chunks.length === 1 ? body.title : `${body.title || "Import"} #${index + 1}`,
          text: chunk,
          platform: body.platform,
          metadata: { importTitle: body.title }
        })
      )
    );

    return NextResponse.json({ count: results.length, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to import content." },
      { status: 500 }
    );
  }
}
