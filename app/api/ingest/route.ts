import { NextRequest, NextResponse } from "next/server";
import { createSplunkClient } from "@/lib/splunk/splunkFactory";
import type { ScanResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/ingest { result: ScanResult } — push a scan's findings to Splunk HEC
export async function POST(req: NextRequest) {
  try {
    const { result } = (await req.json()) as { result?: ScanResult };
    if (!result?.detail) {
      return NextResponse.json({ ok: false, reason: "No scan result provided." }, { status: 400 });
    }
    const out = await createSplunkClient().sendFindings(result);
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ ok: false, reason: e?.message || "Ingest failed" }, { status: 500 });
  }
}
