import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { ingestItem } from "@/lib/ingestion";
import { parseSocialExport } from "@/lib/importers/social-exports";
import { requireOperator } from "@/lib/auth";

export const maxDuration = 300;

const MAX_FILES = 12;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_INGEST_PER_FILE = 150;
const INGEST_CONCURRENCY = 4;

type FileReport = {
  file: string;
  detected: string;
  platform: string;
  parsed: number;
  imported: number;
  duplicates: number;
  failed: number;
  capped: boolean;
  sample?: { title: string | null; excerpt: string } | null;
};

export async function POST(request: Request) {
  if (!(await requireOperator(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const platformHint = formData.get("platform")?.toString() || undefined;
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
    }

    const dryRun = !env.DATABASE_URL;
    const reports: FileReport[] = [];

    for (const file of files.slice(0, MAX_FILES)) {
      if (file.size > MAX_FILE_BYTES) {
        reports.push({
          file: file.name,
          detected: "File too large (25MB max) — unzip the export and upload individual files",
          platform: platformHint || "unknown",
          parsed: 0,
          imported: 0,
          duplicates: 0,
          failed: 0,
          capped: false
        });
        continue;
      }

      const text = await file.text();
      const parsed = parseSocialExport(file.name, text, platformHint);
      const toIngest = parsed.items.slice(0, MAX_INGEST_PER_FILE);
      let imported = 0;
      let duplicates = 0;
      let failed = 0;

      if (!dryRun) {
        for (let i = 0; i < toIngest.length; i += INGEST_CONCURRENCY) {
          const batch = toIngest.slice(i, i + INGEST_CONCURRENCY);
          const settled = await Promise.allSettled(
            batch.map((item) =>
              ingestItem({
                sourceType: "SOCIAL_EXPORT",
                title: item.title,
                url: item.url,
                text: item.text,
                platform: item.platform,
                author: item.author,
                metadata: { ...item.metadata, importFile: file.name }
              })
            )
          );
          for (const result of settled) {
            if (result.status === "rejected") failed += 1;
            else if (result.value.duplicateOf) duplicates += 1;
            else imported += 1;
          }
        }
      }

      const first = parsed.items[0];
      reports.push({
        file: file.name,
        detected: parsed.detected,
        platform: parsed.platform,
        parsed: parsed.items.length,
        imported,
        duplicates,
        failed,
        capped: parsed.items.length > MAX_INGEST_PER_FILE,
        sample: first ? { title: first.title, excerpt: (first.text || first.url || "").slice(0, 140) } : null
      });
    }

    return NextResponse.json({
      dryRun,
      reports,
      message: dryRun
        ? "Files were parsed but not persisted because DATABASE_URL is not configured."
        : undefined
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to import export files." },
      { status: 500 }
    );
  }
}
