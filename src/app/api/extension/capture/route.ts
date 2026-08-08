import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { ingestItem } from "@/lib/ingestion";
import { verifyExtensionAuth } from "@/lib/extension-auth";

const extensionCaptureSchema = z.object({
  url: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  visibleText: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  kind: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export async function POST(request: Request) {
  try {
    if (!(await verifyExtensionAuth(request))) {
      return NextResponse.json(
        { error: "Unauthorized. Pair the extension with the token shown on /settings." },
        { status: 401 }
      );
    }

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
      author: body.author,
      metadata: { ...body.metadata, captureKind: body.kind ?? "page", capturedAt: new Date().toISOString() }
    });

    return NextResponse.json({
      item: { id: result.item.id, status: result.item.status, category: result.item.category },
      duplicate: Boolean(result.duplicateOf)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to capture extension payload." },
      { status: 500 }
    );
  }
}
