import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyExtensionAuth } from "@/lib/extension-auth";

export async function GET(request: Request) {
  const paired = await verifyExtensionAuth(request);
  return NextResponse.json({
    app: env.NEXT_PUBLIC_APP_NAME,
    ok: true,
    database: Boolean(env.DATABASE_URL),
    ai: Boolean(env.OPENAI_API_KEY),
    paired
  });
}
