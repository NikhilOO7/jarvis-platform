import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { ingestItem } from "@/lib/ingestion";

const ingestSchema = z.object({
  sourceType: z
    .enum(["MANUAL_LINK", "MANUAL_TEXT", "FILE_IMPORT", "SOCIAL_EXPORT", "BROWSER_EXTENSION", "SHARE_SHEET", "API_CONNECTOR"])
    .default("MANUAL_TEXT"),
  title: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  text: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional()
});

export async function POST(request: Request) {
  try {
    if (!env.DATABASE_URL) {
      return NextResponse.json({ error: "DATABASE_URL is not configured yet." }, { status: 503 });
    }

    const body = ingestSchema.parse(await request.json());
    if (!body.url && !body.text && !body.title) {
      return NextResponse.json({ error: "Provide a link, title, or text to save." }, { status: 400 });
    }

    const result = await ingestItem(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to ingest item." },
      { status: 500 }
    );
  }
}
