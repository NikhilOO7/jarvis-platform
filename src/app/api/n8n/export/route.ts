import { NextResponse } from "next/server";
import { createN8nExportBundle } from "@/lib/n8n-export";

export async function GET() {
  return NextResponse.json(createN8nExportBundle());
}
