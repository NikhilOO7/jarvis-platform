import { NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, createSessionToken, isAuthEnabled, verifyPassword } from "@/lib/session";
import { consumeRateLimit } from "@/lib/rate-limit";
import { hasValidBrowserOrigin } from "@/lib/auth";

const loginSchema = z.object({ password: z.string().min(1) });

export async function POST(request: Request) {
  if (!hasValidBrowserOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!isAuthEnabled()) {
    return NextResponse.json(
      { error: "Auth is not enabled. Set JARVIS_OPERATOR_PASSWORD in .env to secure this JARVIS." },
      { status: 400 }
    );
  }

  // This alpha is single-operator. A process-wide bucket cannot be bypassed by
  // spoofing proxy headers; move it to shared storage before horizontal scale.
  const rate = consumeRateLimit("login", { limit: 8, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many authentication attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  try {
    const { password } = loginSchema.parse(await request.json());
    if (!verifyPassword(password)) {
      return NextResponse.json({ error: "Access denied. That is not the operator passphrase." }, { status: 401 });
    }

    const token = await createSessionToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token ?? "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed." },
      { status: 400 }
    );
  }
}

/** Logout: clear the session cookie. */
export async function DELETE(request: Request) {
  if (!hasValidBrowserOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
