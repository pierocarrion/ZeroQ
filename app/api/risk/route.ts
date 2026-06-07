import { NextResponse } from "next/server";
import { capabilities } from "@/lib/config";
import { createSplunkClient } from "@/lib/splunk/splunkFactory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/risk — top-line posture + capability status (health check)
export async function GET() {
  try {
    const caps = capabilities();
    let source: string | null = null;
    const summary: {
      riskScore: number;
      band: string;
      lastMonth: number;
      breakdown: { key: string; value: number }[];
    } = {
      riskScore: 0,
      band: "—",
      lastMonth: 0,
      breakdown: [],
    };

    if (caps.splunk) {
      const live = await createSplunkClient().getRiskSummary();
      if (live) {
        summary.riskScore = live.riskScore;
        summary.band = live.riskBand;
        summary.lastMonth = live.lastMonthScore ?? 0;
        summary.breakdown = live.breakdown;
        source = "splunk";
      }
    }

    return NextResponse.json({ ...summary, capabilities: caps, source });
  } catch (e: any) {
    return NextResponse.json({
      riskScore: 0,
      band: "—",
      lastMonth: 0,
      breakdown: [],
      capabilities: capabilities(),
      source: null,
      error: e?.message,
    });
  }
}
