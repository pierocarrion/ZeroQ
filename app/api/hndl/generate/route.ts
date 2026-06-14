import { NextResponse } from "next/server";
import { generateHndlAnomalies } from "@/lib/services/HndlDetector";
import { config } from "@/lib/config";
import { splunkFetch } from "@/lib/splunk/fetchSplunk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/hndl/generate
// Rebuilds the local HNDL anomaly table from TLS scan data. If Splunk HEC is
// configured, the generated anomalies are also pushed to crypto_hndl so the
// native Splunk dashboards show the same signals.
export async function POST() {
  try {
    const anomalies = generateHndlAnomalies();

    if (config.splunk.hecEnabled && anomalies.length > 0) {
      const now = Date.now() / 1000;
      const events = anomalies.map((a) => ({
        time: now,
        host: "zeroq-hndl-detector",
        source: "zeroq:hndl-detector",
        sourcetype: "zeroq:hndl_event",
        index: config.splunk.indexes.hndl,
        event: a,
      }));
      const body = events.map((e) => JSON.stringify(e)).join("\n");
      try {
        await splunkFetch(`${config.splunk.hecUrl}/services/collector/event`, {
          method: "POST",
          headers: { Authorization: `Splunk ${config.splunk.hecToken}` },
          body,
        });
      } catch (heErr: any) {
        console.error("[api/hndl/generate] HEC push failed:", heErr?.message);
      }
    }

    return NextResponse.json({ ok: true, count: anomalies.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to generate HNDL anomalies" }, { status: 500 });
  }
}
