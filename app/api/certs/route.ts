import { NextResponse } from "next/server";
import { createSplunkClient } from "@/lib/splunk/splunkFactory";
import { DATA } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/certs
export async function GET() {
  try {
    const splunk = createSplunkClient();
    const live = await splunk.getCertificates();
    if (live && live.length > 0) {
      return NextResponse.json({ data: live, source: "splunk" });
    }
    return NextResponse.json({ data: DATA.certs, source: "seed" });
  } catch (e: any) {
    return NextResponse.json({ data: DATA.certs, source: "seed", error: e?.message }, { status: 200 });
  }
}
