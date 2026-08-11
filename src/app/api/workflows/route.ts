import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { requireOperator } from "@/lib/auth";
import { syncWorkflowTemplates } from "@/lib/workflow-store";
import { workflowTemplates } from "@/lib/workflow-templates";

export async function GET(request: Request) {
  if (!(await requireOperator(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (env.DATABASE_URL) {
    const workflows = await syncWorkflowTemplates();
    return NextResponse.json({ workflows, source: "database" });
  }

  return NextResponse.json({ workflows: workflowTemplates });
}
