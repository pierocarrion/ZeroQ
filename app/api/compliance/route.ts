import { NextResponse } from "next/server";
import { getComplianceStats } from "@/lib/services/dataSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/compliance
export async function GET() {
  try {
    const result = await getComplianceStats();
    if (!result.data) {
      return NextResponse.json({ data: null, source: null, summary: null });
    }

    const frameworks = result.data;
    const allControls = frameworks.flatMap((f) => f.controls);
    const overallProgress = frameworks.length
      ? Math.round(frameworks.reduce((s, f) => s + f.progress, 0) / frameworks.length)
      : 0;

    const summary = {
      overallProgress,
      totalControls: allControls.length,
      passedControls: allControls.filter((c) => c.state === "passed").length,
      atRiskAssets: frameworks.reduce((s, f) => s + f.atRisk, 0),
      totalAssets: frameworks.reduce((s, f) => s + f.mapped, 0),
    };

    return NextResponse.json({ data: frameworks, source: result.source, summary });
  } catch (e: any) {
    return NextResponse.json({ data: null, source: null, summary: null, error: e?.message }, { status: 200 });
  }
}
