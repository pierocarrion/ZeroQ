import { NextResponse } from "next/server";
import { getRiskTrend } from "@/lib/services/dataSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/trends
export async function GET() {
  try {
    const { data, source } = await getRiskTrend();
    return NextResponse.json({ data: { riskTrend: data ?? [], remediated: [] }, source });
  } catch (e: any) {
    return NextResponse.json({ data: { riskTrend: [], remediated: [] }, source: null, error: e?.message }, { status: 200 });
  }
}
