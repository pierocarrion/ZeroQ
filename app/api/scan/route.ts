import { NextRequest, NextResponse } from "next/server";
import { makeScanService } from "@/lib/services/composition";
import { ProviderError } from "@/lib/providers/SourceProvider";
import { TargetParseError } from "@/lib/scanning/target";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/scan { target: "owner/repo" | url }
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
  console.log("[scan] target:", target);
  try {
    const data = await makeScanService().scan(target);
    console.log("[scan] success:", data.result.repo, "findings:", data.result.findings);
    return NextResponse.json(data);
  } catch (e) {
    const userFacing = e instanceof ProviderError || e instanceof TargetParseError || (e instanceof Error && e.message.startsWith("Invalid target"));
    const message = e instanceof Error ? e.message : "Scan failed";
    console.error("[scan] error:", message);
    return NextResponse.json({ error: message }, { status: userFacing ? 400 : 500 });
  }
}
