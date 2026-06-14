import { NextResponse } from "next/server";
import { getOrgs } from "@/lib/services/dataSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/orgs
export async function GET() {
  try {
    const { data, source } = await getOrgs();
    return NextResponse.json({ data, source });
  } catch (e: any) {
    return NextResponse.json({ data: null, source: null, error: e?.message }, { status: 200 });
  }
}
