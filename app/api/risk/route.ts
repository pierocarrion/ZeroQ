import { NextResponse } from "next/server";
import { getRiskSummary } from "@/lib/services/dataSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/risk — top-line posture from Splunk (if it has data) or local SQLite.
export async function GET() {
  try {
    const { data, source } = await getRiskSummary();
    console.log("[api/risk] source:", source, "riskScore:", data?.riskScore);
    if (data) {
      return NextResponse.json({
        data: {
          riskScore: data.riskScore,
          band: data.riskBand,
          lastMonth: data.lastMonthScore ?? 0,
          breakdown: data.breakdown,
          endpointsScanned: data.endpointsScanned ?? 0,
          connectionsObserved: data.connectionsObserved ?? 0,
          certsTracked: data.certsTracked ?? 0,
          coverage: data.coverage ?? 0,
        },
        source,
      });
    }
    return NextResponse.json({
      data: {
        riskScore: 0,
        band: "—",
        lastMonth: 0,
        breakdown: [],
        endpointsScanned: 0,
        connectionsObserved: 0,
        certsTracked: 0,
        coverage: 0,
      },
      source: null,
    });
  } catch (e: any) {
    return NextResponse.json({
      data: {
        riskScore: 0,
        band: "—",
        lastMonth: 0,
        breakdown: [],
        endpointsScanned: 0,
        connectionsObserved: 0,
        certsTracked: 0,
        coverage: 0,
      },
      source: null,
      error: e?.message,
    });
  }
}
