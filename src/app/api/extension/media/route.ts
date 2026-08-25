import { NextResponse } from "next/server";
import { toFile } from "openai";
import { env } from "@/lib/env";
import { getOpenAIClient } from "@/lib/openai";
import { ingestItem } from "@/lib/ingestion";
import { requireServiceScope } from "@/lib/service-auth";

export const maxDuration = 300;

const MAX_AUDIO_BYTES = 24 * 1024 * 1024; // Whisper's limit is 25MB
const MAX_FRAMES = 20;
const TRANSCRIBE_MODEL = "whisper-1";

type MediaMetadata = {
  url?: string;
  title?: string;
  platform?: string;
  author?: string;
  durationSec?: number;
};

export async function POST(request: Request) {
  try {
    if (!(await requireServiceScope(request, "media:write"))) {
      return NextResponse.json(
        { error: "Unauthorized. Pair the extension with the token shown on /settings." },
        { status: 401 }
      );
    }

    const client = getOpenAIClient();
    if (!client) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is required for transcription. Add it to .env and restart the app." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const audio = formData.get("audio");
    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json({ error: "No audio uploaded." }, { status: 400 });
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio exceeds the 24MB limit — record a shorter clip." }, { status: 413 });
    }

    let metadata: MediaMetadata = {};
    try {
      metadata = JSON.parse(formData.get("metadata")?.toString() || "{}") as MediaMetadata;
    } catch {
      metadata = {};
    }

    const frameFiles = formData
      .getAll("frames")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)
      .slice(0, MAX_FRAMES);
    const frameDataUrls = await Promise.all(
      frameFiles.map(async (frame) => {
        const buffer = Buffer.from(await frame.arrayBuffer());
        return `data:${frame.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
      })
    );

    const transcription = await client.audio.transcriptions.create({
      model: TRANSCRIBE_MODEL,
      file: await toFile(Buffer.from(await audio.arrayBuffer()), "capture.webm", {
        type: audio.type || "audio/webm"
      })
    });
    const transcript = transcription.text?.trim() ?? "";

    if (!transcript) {
      return NextResponse.json({ error: "Transcription returned no speech." }, { status: 422 });
    }

    const hasFrames = frameDataUrls.length > 0;
    const contextText = [
      metadata.title ? `Video: ${metadata.title}` : null,
      metadata.author ? `Author: ${metadata.author}` : null,
      metadata.platform ? `Platform: ${metadata.platform}` : null,
      `Transcript:\n${transcript.slice(0, 12000)}`,
      hasFrames ? `Attached: ${frameDataUrls.length} still frames sampled in order while the video played.` : null
    ]
      .filter(Boolean)
      .join("\n");

    const briefResponse = await client.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: hasFrames
            ? "You are Jarvis, a calm, sharp personal AI assistant. From a video's audio transcript AND sampled frames, produce a compact brief: one-line gist; key claims or points; what the creator wants the viewer to do or believe; and VISUALS — what is actually shown (people, products, exercises and form, charts, on-screen text, demos) including anything the visuals convey that the audio doesn't. Note if frames look black/blank (DRM) or if the transcript is music/no meaningful speech."
            : "You are Jarvis, a calm, sharp personal AI assistant. From a video's audio transcript, produce a compact brief: one-line gist, the key claims or points, and what the creator wants the viewer to do or believe. Note if the transcript looks like music/no meaningful speech."
        },
        hasFrames
          ? {
              role: "user",
              content: [
                { type: "text" as const, text: contextText },
                ...frameDataUrls.map((url) => ({
                  type: "image_url" as const,
                  image_url: { url, detail: "low" as const }
                }))
              ]
            }
          : { role: "user", content: contextText }
      ]
    });
    const summary = briefResponse.choices[0]?.message.content?.trim() || "No brief generated.";

    let savedItemId: string | null = null;
    let duplicate = false;
    if (env.DATABASE_URL) {
      try {
        const result = await ingestItem({
          sourceType: "BROWSER_EXTENSION",
          title: metadata.title
            ? `${hasFrames ? "Video brief" : "Video transcript"}: ${metadata.title}`.slice(0, 140)
            : hasFrames
              ? "Video brief"
              : "Video transcript",
          url: metadata.url,
          text: `${summary}\n\nTranscript:\n${transcript}`.slice(0, 20000),
          platform: metadata.platform,
          author: metadata.author,
          metadata: {
            captureKind: hasFrames ? "video_watch" : "video_transcript",
            framesAnalyzed: frameDataUrls.length,
            durationSec: metadata.durationSec,
            transcribedAt: new Date().toISOString()
          }
        });
        savedItemId = result.item.id;
        duplicate = Boolean(result.duplicateOf);
      } catch {
        savedItemId = null;
      }
    }

    return NextResponse.json({
      summary,
      transcript: transcript.slice(0, 2000),
      transcriptChars: transcript.length,
      framesAnalyzed: frameDataUrls.length,
      saved: Boolean(savedItemId),
      duplicate,
      itemId: savedItemId
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process media." },
      { status: 500 }
    );
  }
}
