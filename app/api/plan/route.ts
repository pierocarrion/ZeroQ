import { NextRequest, NextResponse } from "next/server";
import { makePlanService } from "@/lib/services/composition";
import type { ScanResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/plan { scanned?: ScanResult[], org?: string }
export async function POST(req: NextRequest) {
  try {
    const { scanned, org } = (await req.json()) as { scanned?: ScanResult[]; org?: string };
    const result = await makePlanService().generate(Array.isArray(scanned) ? scanned : [], org || "acme-corp");
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Plan generation failed" }, { status: 500 });
  }
}
