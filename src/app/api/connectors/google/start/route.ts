import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { env } from "@/lib/env";
import { requireOperator } from "@/lib/auth";
import { isAuthEnabled } from "@/lib/session";
import { buildGoogleAuthUrl, isGoogleConfigured } from "@/lib/connectors/google";

export async function GET(request: Request) {
  if (!(await requireOperator(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isAuthEnabled()) {
    return NextResponse.json(
      { error: "Set JARVIS_OPERATOR_PASSWORD before connecting an external account." },
      { status: 409 }
    );
  }
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env first (see /settings for the redirect URI)." },
      { status: 400 }
    );
  }
  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is required to store connector tokens." }, { status: 503 });
  }

  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(buildGoogleAuthUrl(state));
  response.cookies.set("jarvis_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600
  });
  return response;
}
