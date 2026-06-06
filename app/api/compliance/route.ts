import { NextResponse } from "next/server";
import { createSplunkClient } from "@/lib/splunk/splunkFactory";
import { DATA } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/compliance
export async function GET() {
  try {
    const splunk = createSplunkClient();
    const live = await splunk.getComplianceStats();
    if (live && live.length > 0) {
      return NextResponse.json({ data: live, source: "splunk" });
    }
    return NextResponse.json({ data: DATA.compliance, source: "seed" });
  } catch (e: any) {
    return NextResponse.json({ data: DATA.compliance, source: "seed", error: e?.message }, { status: 200 });
  }
}
