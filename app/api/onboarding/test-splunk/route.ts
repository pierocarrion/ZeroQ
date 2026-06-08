import { NextRequest, NextResponse } from "next/server";
import { splunkFetch } from "@/lib/splunk/fetchSplunk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(url?: string) {
  return (url || "").replace(/\/$/, "");
}

function networkError(e: any): string {
  const msg = e?.message || String(e);
  if (msg.includes("ECONNREFUSED")) return "Connection refused — check the URL/port";
  if (msg.includes("ENOTFOUND")) return "Host not found — check the URL";
  if (msg.includes("ETIMEDOUT") || msg.includes("timeout")) return "Connection timed out";
  if (msg.includes("CERT") || msg.includes("certificate") || msg.includes("TLS"))
    return "SSL/TLS error — enable 'Skip TLS certificate verification' and try again";
  if (msg.includes("fetch failed")) return "Network error — verify URL, port, and firewall rules";
  return msg;
}

// POST /api/onboarding/test-splunk { hecUrl, hecToken, baseUrl, username, password, skipTlsVerify }
export async function POST(req: NextRequest) {
  let body: {
    hecUrl?: string;
    hecToken?: string;
    baseUrl?: string;
    username?: string;
    password?: string;
    skipTlsVerify?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const checks: Record<string, any> = {};

  // Test HEC
  if (body.hecUrl && body.hecToken) {
    const hecUrl = normalize(body.hecUrl);
    let hecOk = false;
    let hecErr = "";

    for (const path of ["/services/collector/event/1.0", "/services/collector/event"]) {
      if (hecOk) break;
      try {
        const res = await splunkFetch(`${hecUrl}${path}`, {
          method: "POST",
          headers: {
            Authorization: `Splunk ${body.hecToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event: { test: true, source: "zeroq-healthcheck" } }),
        }, body.skipTlsVerify);
        if (res.ok || res.status === 400) {
          const text = await res.text().catch(() => "");
          if (text.includes("Success") || res.ok || res.status === 400) {
            hecOk = true;
          } else {
            hecErr = `HEC ${res.status}: ${text.slice(0, 120)}`;
          }
        } else {
          hecErr = `HEC ${res.status}: ${(await res.text().catch(() => "")).slice(0, 120)}`;
        }
      } catch (e: any) {
        hecErr = networkError(e);
      }
    }

    checks.hec = hecOk ? { ok: true } : { ok: false, error: hecErr || "HEC test failed" };
  }

  // Test REST Search
  if (body.baseUrl && body.username && body.password) {
    const baseUrl = normalize(body.baseUrl);
    let restOk = false;
    let restErr = "";

    // 1) Try POST /services/auth/login (always present in Splunk)
    try {
      const loginBody = new URLSearchParams({ username: body.username, password: body.password });
      const res = await splunkFetch(`${baseUrl}/services/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: loginBody.toString(),
      }, body.skipTlsVerify);
      if (res.ok) {
        restOk = true;
      } else {
        const text = await res.text().catch(() => "");
        restErr = `REST ${res.status}: ${text.slice(0, 120)}`;
      }
    } catch (e: any) {
      restErr = networkError(e);
    }

    // 2) Fallback to GET /services/server/info if login wasn't tried or gave 404
    if (!restOk && restErr.includes("404")) {
      try {
        const res = await splunkFetch(`${baseUrl}/services/server/info`, {
          headers: {
            Authorization: "Basic " + Buffer.from(`${body.username}:${body.password}`).toString("base64"),
          },
        }, body.skipTlsVerify);
        if (res.ok) {
          restOk = true;
          restErr = "";
        } else {
          const text = await res.text().catch(() => "");
          restErr = `REST ${res.status}: ${text.slice(0, 120)}`;
        }
      } catch (e: any) {
        restErr = networkError(e);
      }
    }

    checks.rest = restOk ? { ok: true } : { ok: false, error: restErr || "REST test failed" };
  }

  const allOk = Object.values(checks).every((c: any) => c.ok);
  return NextResponse.json({ ok: allOk, checks });
}
