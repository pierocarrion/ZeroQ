import { NextResponse } from "next/server";
import { DATA } from "@/lib/data";
import { capabilities } from "@/lib/config";
import { createSplunkClient } from "@/lib/splunk/splunkFactory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/risk — top-line posture + capability status (health check)
export async function GET() {
  try {
    const caps = capabilities();
    let source = "seed";
    const summary: {
      riskScore: number;
      band: string;
      lastMonth: number;
      breakdown: { key: string; value: number }[];
    } = {
      riskScore: DATA.summary.riskScore,
      band: DATA.summary.riskBand,
      lastMonth: DATA.summary.lastMonthScore,
      breakdown: DATA.riskBreakdown.map((b) => ({ key: b.key, value: b.value })),
    };

    if (caps.splunk) {
      const live = await createSplunkClient().getRiskSummary();
      if (live) {
        summary.riskScore = live.riskScore;
        summary.band = live.riskBand;
        summary.lastMonth = live.lastMonthScore ?? DATA.summary.lastMonthScore;
        summary.breakdown = live.breakdown;
        source = "splunk";
      }
    }

    return NextResponse.json({ ...summary, capabilities: caps, source });
  } catch (e: any) {
    return NextResponse.json({
      riskScore: DATA.summary.riskScore,
      band: DATA.summary.riskBand,
      lastMonth: DATA.summary.lastMonthScore,
      breakdown: DATA.riskBreakdown.map((b) => ({ key: b.key, value: b.value })),
      capabilities: capabilities(),
      source: "seed",
      error: e?.message,
    });
  }
}
