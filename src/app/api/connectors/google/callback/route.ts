import { NextResponse } from "next/server";
import { requireOperator } from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/connectors/google";

export async function GET(request: Request) {
  if (!(await requireOperator(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.headers.get("cookie")?.match(/(?:^|;\s*)jarvis_oauth_state=([^;]+)/)?.[1];
  const settings = new URL("/settings", url.origin);

  if (url.searchParams.get("error")) {
    settings.searchParams.set("google", `denied:${url.searchParams.get("error")}`);
    return NextResponse.redirect(settings);
  }
  if (!code || !state || !cookieState || state !== cookieState) {
    settings.searchParams.set("google", "state-mismatch");
    return NextResponse.redirect(settings);
  }

  const result = await exchangeCodeForTokens(code);
  settings.searchParams.set("google", result.ok ? "connected" : `error:${result.error ?? "unknown"}`);
  const response = NextResponse.redirect(settings);
  response.cookies.set("jarvis_oauth_state", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
