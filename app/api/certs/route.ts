import { NextResponse } from "next/server";
import { getCertificates } from "@/lib/services/dataSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/certs
export async function GET() {
  try {
    const { data, source } = await getCertificates();
    console.log("[api/certs] source:", source, "rows:", data?.length ?? 0);
    return NextResponse.json({ data, source });
  } catch (e: any) {
    return NextResponse.json({ data: null, source: null, error: e?.message }, { status: 200 });
  }
}
