import { NextRequest, NextResponse } from "next/server";
import { createSplunkClient } from "@/lib/splunk/splunkFactory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/inventory?risk=&version=&cipher=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      risk: searchParams.get("risk") || undefined,
      version: searchParams.get("version") || undefined,
      cipher: searchParams.get("cipher") || undefined,
    };
    const splunk = createSplunkClient();
    const live = await splunk.getInventory(filters);
    if (live && live.length > 0) {
      return NextResponse.json({ data: live, source: "splunk" });
    }
    return NextResponse.json({ data: null, source: null });
  } catch (e: any) {
    return NextResponse.json({ data: null, source: null, error: e?.message }, { status: 200 });
  }
}
