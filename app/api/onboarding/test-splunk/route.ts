import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/onboarding/test-splunk { hecUrl, hecToken, baseUrl, username, password }
export async function POST(req: NextRequest) {
  let body: { hecUrl?: string; hecToken?: string; baseUrl?: string; username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const checks: Record<string, any> = {};

  // Test HEC
  if (body.hecUrl && body.hecToken) {
    try {
      const hecUrl = body.hecUrl.replace(/\/$/, "");
      const res = await fetch(`${hecUrl}/services/collector/event`, {
        method: "POST",
        headers: { Authorization: `Splunk ${body.hecToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ event: { test: true } }),
      });
      if (res.status === 400) {
        // Splunk returns 400 for bad event JSON, which means auth passed
        checks.hec = { ok: true };
      } else if (res.ok) {
        checks.hec = { ok: true };
      } else {
        const text = await res.text().catch(() => "");
        checks.hec = { ok: false, error: `HEC ${res.status}: ${text}` };
      }
    } catch (e: any) {
      checks.hec = { ok: false, error: e?.message || "Network error" };
    }
  }

  // Test REST Search
  if (body.baseUrl && body.username && body.password) {
    try {
      const baseUrl = body.baseUrl.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/services/server/info`, {
        headers: {
          Authorization: "Basic " + Buffer.from(`${body.username}:${body.password}`).toString("base64"),
        },
        cache: "no-store",
      });
      if (res.ok) {
        checks.rest = { ok: true };
      } else {
        const text = await res.text().catch(() => "");
        checks.rest = { ok: false, error: `REST ${res.status}: ${text}` };
      }
    } catch (e: any) {
      checks.rest = { ok: false, error: e?.message || "Network error" };
    }
  }

  const allOk = Object.values(checks).every((c: any) => c.ok);
  return NextResponse.json({ ok: allOk, checks });
}
