import { NextResponse } from "next/server";
import { getTopAssets } from "@/lib/services/dataSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/top-assets
export async function GET() {
  try {
    const { data, source } = await getTopAssets();
    return NextResponse.json({ data, source });
  } catch (e: any) {
    return NextResponse.json({ data: null, source: null, error: e?.message }, { status: 200 });
  }
}
