import { NextResponse } from "next/server";
import { getHndlTimeline } from "@/lib/services/dataSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/hndl/timeline
export async function GET() {
  try {
    const { data, source } = await getHndlTimeline();
    return NextResponse.json({ data, source });
  } catch (e: any) {
    return NextResponse.json({ data: null, source: null, error: e?.message }, { status: 200 });
  }
}
