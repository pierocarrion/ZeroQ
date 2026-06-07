import { NextResponse } from "next/server";
import { createSplunkClient } from "@/lib/splunk/splunkFactory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/trends
export async function GET() {
  try {
    const splunk = createSplunkClient();
    const live = await splunk.getRiskTrend();
    if (live && live.length > 0) {
      return NextResponse.json({ data: { riskTrend: live, remediated: [] }, source: "splunk" });
    }
    return NextResponse.json({ data: { riskTrend: [], remediated: [] }, source: null });
  } catch (e: any) {
    return NextResponse.json({ data: { riskTrend: [], remediated: [] }, source: null, error: e?.message }, { status: 200 });
  }
}
