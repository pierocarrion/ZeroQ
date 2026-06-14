import { NextRequest, NextResponse } from "next/server";
import { getOrgPlan } from "@/lib/services/dataSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/org-plan?org=acme-corp
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const org = searchParams.get("org") || "acme-corp";
    const { data, source } = await getOrgPlan(org);
    return NextResponse.json({ data, source });
  } catch (e: any) {
    return NextResponse.json({ data: null, source: null, error: e?.message }, { status: 200 });
  }
}
