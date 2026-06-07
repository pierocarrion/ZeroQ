import { NextResponse } from "next/server";
import { createSplunkClient } from "@/lib/splunk/splunkFactory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/code-rollup
export async function GET() {
  try {
    const splunk = createSplunkClient();
    const live = await splunk.getCodeRollup();
    if (live) {
      return NextResponse.json({ data: live, source: "splunk" });
    }
    return NextResponse.json({ data: null, source: null });
  } catch (e: any) {
    return NextResponse.json({ data: null, source: null, error: e?.message }, { status: 200 });
  }
}
