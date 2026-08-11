import { NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, createSessionToken, isAuthEnabled, verifyPassword } from "@/lib/session";

const loginSchema = z.object({ password: z.string().min(1) });

export async function POST(request: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json(
      { error: "Auth is not enabled. Set JARVIS_OPERATOR_PASSWORD in .env to secure this JARVIS." },
      { status: 400 }
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
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
