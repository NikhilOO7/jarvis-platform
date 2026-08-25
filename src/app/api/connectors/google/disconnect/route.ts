import { NextResponse } from "next/server";
import { requireOperator } from "@/lib/auth";
import { disconnectGoogle } from "@/lib/connectors/google";
import { isAuthEnabled } from "@/lib/session";

export async function POST(request: Request) {
  if (!(await requireOperator(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isAuthEnabled()) {
    return NextResponse.json(
      { error: "Set JARVIS_OPERATOR_PASSWORD before managing an external account." },
      { status: 409 }
    );
  }
  const result = await disconnectGoogle();
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
