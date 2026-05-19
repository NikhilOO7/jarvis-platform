import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { ingestItem } from "@/lib/ingestion";

const extensionCaptureSchema = z.object({
  url: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  visibleText: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional()
});

export async function POST(request: Request) {
  try {
    if (!env.DATABASE_URL) {
      return NextResponse.json({ error: "DATABASE_URL is not configured yet." }, { status: 503 });
    }

    const body = extensionCaptureSchema.parse(await request.json());
    const result = await ingestItem({
      sourceType: "BROWSER_EXTENSION",
      title: body.title,
      url: body.url,
      text: body.visibleText,
      platform: body.platform,
      metadata: body.metadata
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to capture extension payload." },
      { status: 500 }
    );
  }
}
