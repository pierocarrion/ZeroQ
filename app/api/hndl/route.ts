import { NextResponse } from "next/server";
import { createSplunkClient } from "@/lib/splunk/splunkFactory";
import { DATA } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/hndl
export async function GET() {
  try {
    const splunk = createSplunkClient();
    const live = await splunk.getHndlAnomalies();
    if (live && live.length > 0) {
      return NextResponse.json({ data: live, source: "splunk" });
    }
    return NextResponse.json({ data: DATA.hndlAnomalies, source: "seed" });
  } catch (e: any) {
    return NextResponse.json({ data: DATA.hndlAnomalies, source: "seed", error: e?.message }, { status: 200 });
  }
}
