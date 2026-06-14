import { NextResponse } from "next/server";
import { createSplunkClient } from "@/lib/splunk/splunkFactory";
import { splunkFetch } from "@/lib/splunk/fetchSplunk";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/health/splunk — real connectivity check against Splunk REST + HEC
export async function GET() {
  try {
    const client = createSplunkClient();
    console.log("[api/health/splunk] client.enabled:", client.enabled);
    if (!client.enabled) {
      console.log("[api/health/splunk] not configured");
      return NextResponse.json({ ok: false, connected: false, reason: "Splunk not configured" });
    }
    // Quick REST check: hit /services/server/info with basic auth
    const baseUrl = (config.splunk.baseUrl || "").replace(/\/$/, "");
    const auth = "Basic " + Buffer.from(`${config.splunk.username || ""}:${config.splunk.password || ""}`).toString("base64");
    const res = await splunkFetch(`${baseUrl}/services/server/info?output_mode=json`, {
      headers: { Authorization: auth },
    });
    const restOk = res.ok;
    console.log("[api/health/splunk] REST check:", restOk, res.status);
    return NextResponse.json({ ok: restOk, connected: restOk, reason: restOk ? "" : `Splunk REST ${res.status}` });
  } catch (e: any) {
    return NextResponse.json({ ok: false, connected: false, reason: e?.message || "Splunk health check failed" });
  }
}
