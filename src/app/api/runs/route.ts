import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { sweepStaleRuns } from "@/lib/agents/executor";
import { requireOperator } from "@/lib/auth";
import { getServiceIdentity } from "@/lib/service-auth";

export async function GET(request: Request) {
  const operatorAuthorized = await requireOperator(request);
  const serviceIdentity = operatorAuthorized ? null : await getServiceIdentity(request);
  if (!operatorAuthorized && !serviceIdentity?.scopes.includes("runs:read")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const requestedId = new URL(request.url).searchParams.get("id");
  if (serviceIdentity && !requestedId) {
    return NextResponse.json(
      { error: "Service credentials must request a specific run id." },
      { status: 400 }
    );
  }
  if (!env.DATABASE_URL) {
    return NextResponse.json({
      runs: [],
      message: "DATABASE_URL is not configured. Runs monitor is offline."
    });
  }

  await sweepStaleRuns();

  const runs = await prisma.workflowRun.findMany({
    where: requestedId ? { id: requestedId } : undefined,
    orderBy: { createdAt: "desc" },
    take: requestedId ? 1 : 30,
    include: {
      workflowTemplate: true,
      approvals: { orderBy: { createdAt: "asc" } }
    }
  });

  return NextResponse.json({ runs });
}
