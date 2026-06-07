import { NextResponse } from "next/server";
import { createSplunkClient } from "@/lib/splunk/splunkFactory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/hndl/timeline
export async function GET() {
  try {
    const splunk = createSplunkClient();
    const live = await splunk.getHndlTimeline();
    if (live && live.length > 0) {
      return NextResponse.json({ data: live, source: "splunk" });
    }
    return NextResponse.json({ data: null, source: null });
  } catch (e: any) {
    return NextResponse.json({ data: null, source: null, error: e?.message }, { status: 200 });
  }
}
