import { NextRequest, NextResponse } from "next/server";
import { getInventory } from "@/lib/services/dataSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/inventory?risk=&version=&cipher=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      risk: searchParams.get("risk") || undefined,
      version: searchParams.get("version") || undefined,
      cipher: searchParams.get("cipher") || undefined,
    };
    const { data, source } = await getInventory(filters);
    console.log("[api/inventory] source:", source, "rows:", data?.length ?? 0);
    return NextResponse.json({ data, source });
  } catch (e: any) {
    return NextResponse.json({ data: null, source: null, error: e?.message }, { status: 200 });
  }
}
