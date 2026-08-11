import { NextResponse } from "next/server";
import { requireOperator } from "@/lib/auth";
import { disconnectGoogle } from "@/lib/connectors/google";

export async function POST(request: Request) {
  if (!(await requireOperator(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  await disconnectGoogle();
  return NextResponse.json({ ok: true });
}
