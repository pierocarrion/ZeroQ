import { NextRequest, NextResponse } from "next/server";
import { makeScanService } from "@/lib/services/composition";
import { ProviderError } from "@/lib/providers/SourceProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/scan { target: "owner/repo" | "group/project" | url }
export async function POST(req: NextRequest) {
  let target: unknown;
  try {
    ({ target } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof target !== "string" || target.trim() === "") {
    return NextResponse.json({ error: "Provide a repository target." }, { status: 400 });
  }
  try {
    const data = await makeScanService().scan(target);
    return NextResponse.json(data);
  } catch (e) {
    const userFacing = e instanceof ProviderError || (e instanceof Error && e.message.startsWith("Enter "));
    const message = e instanceof Error ? e.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: userFacing ? 400 : 500 });
  }
}
