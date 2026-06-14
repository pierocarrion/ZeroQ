import { NextRequest, NextResponse } from "next/server";
import { listDomains, addDomain, removeDomain } from "@/lib/services/TlsScanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/domains
export async function GET() {
  try {
    const domains = listDomains();
    console.log("[api/domains] GET count:", domains.length);
    return NextResponse.json({ data: domains });
  } catch (e: any) {
    return NextResponse.json({ data: [], error: e?.message }, { status: 200 });
  }
}

// POST /api/domains { host, port?, sensitivity?, txnsDay? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const host = String(body.host || "").trim();
    const port = Number(body.port) || 443;
    if (!host) return NextResponse.json({ ok: false, error: "host required" }, { status: 400 });
    console.log("[api/domains] POST add:", host, port);
    addDomain(host, port, body.sensitivity, body.txnsDay);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

// DELETE /api/domains?id=X
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    console.log("[api/domains] DELETE id:", id);
    removeDomain(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
