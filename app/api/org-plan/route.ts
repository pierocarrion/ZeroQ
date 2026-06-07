import { NextRequest, NextResponse } from "next/server";
import { createSplunkClient } from "@/lib/splunk/splunkFactory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/org-plan?org=acme-corp
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const org = searchParams.get("org") || "acme-corp";
    const splunk = createSplunkClient();
    const live = await splunk.getOrgPlan(org);
    if (live) {
      return NextResponse.json({ data: live, source: "splunk" });
    }
    return NextResponse.json({ data: null, source: null });
  } catch (e: any) {
    return NextResponse.json({ data: null, source: null, error: e?.message }, { status: 200 });
  }
}
