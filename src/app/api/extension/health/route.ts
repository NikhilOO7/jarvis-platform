import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getServiceIdentity } from "@/lib/service-auth";

export async function GET(request: Request) {
  const identity = await getServiceIdentity(request);
  if (!identity || !identity.scopes.includes("health:read")) {
    return NextResponse.json({ error: "Unauthorized.", paired: false }, { status: 401 });
  }
  return NextResponse.json({
    app: env.NEXT_PUBLIC_APP_NAME,
    ok: true,
    database: Boolean(env.DATABASE_URL),
    ai: Boolean(env.OPENAI_API_KEY),
    paired: true,
    service: identity.name,
    scopes: identity.scopes
  });
}
