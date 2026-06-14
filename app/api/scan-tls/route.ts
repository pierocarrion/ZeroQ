import { NextRequest, NextResponse } from "next/server";
import { scanHost, saveTlsScan, listDomains } from "@/lib/services/TlsScanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/scan-tls
// Body: { host?, port? } — if omitted, scans all saved domains.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { host?: string; port?: number };
    const targets = body.host
      ? [{ host: body.host, port: body.port || 443 }]
      : listDomains().map((d) => ({ host: d.host, port: d.port || 443 }));

    if (targets.length === 0) {
      return NextResponse.json({ ok: false, error: "No domains to scan. Add one first." }, { status: 400 });
    }

    console.log("[api/scan-tls] targets:", targets.length);
    const results = [];
    for (const t of targets) {
      const result = await scanHost(t.host, t.port);
      console.log("[api/scan-tls] scanned:", t.host, "version:", result.version, "error:", result.error);
      if (!result.error) saveTlsScan(result);
      results.push(result);
    }

    const ok = results.filter((r) => !r.error).length;
    console.log("[api/scan-tls] done:", results.length, "successful:", ok);
    return NextResponse.json({ ok: true, scanned: results.length, successful: ok, results });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
