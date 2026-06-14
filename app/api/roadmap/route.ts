import { NextResponse } from "next/server";
import { getRoadmap } from "@/lib/services/dataSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/roadmap
export async function GET() {
  try {
    const { data, source } = await getRoadmap();
    return NextResponse.json({ data, source });
  } catch (e: any) {
    return NextResponse.json({ data: null, source: null, error: e?.message }, { status: 200 });
  }
}
