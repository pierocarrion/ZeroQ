// ============================================================
// HndlDetector.ts — generates Harvest-Now-Decrypt-Later anomaly
// events from locally-known TLS scan data.
//
// It compares TLS destinations against the internal domain list.
// External destinations that appear in TLS scans become candidate
// HNDL signals with synthetic-but-plausible volume baselines.
//
// In a production deployment this would be replaced by a stream
// processor reading Zeek ssl.log or flow records.
// ============================================================
import { getDb } from "@/lib/db";
import type { HndlAnomaly } from "@/lib/splunk/SplunkClient";

const GEO_POOL = ["US", "NL", "DE", "SG", "BR", "JP", "GB", "CA", "IN", "AU"];

function pickGeo(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GEO_POOL[hash % GEO_POOL.length];
}

function pickAsn(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 17 + seed.charCodeAt(i)) >>> 0;
  return `AS${10000 + (hash % 50000)}`;
}

function syntheticVolume(risk: string): { volume: number; deviation: number; sessions: number } {
  const base = 5 + Math.random() * 10;
  const riskMult = risk === "critical" ? 3.5 : risk === "high" ? 2.5 : risk === "monitor" ? 1.5 : 1.0;
  const deviation = Math.round((1.3 + Math.random() * 2.2) * riskMult * 10) / 10;
  const volume = Math.round(base * deviation * 10) / 10;
  const sessions = Math.floor(30 + deviation * (30 + Math.random() * 100));
  return { volume, deviation, sessions };
}

export function generateHndlAnomalies(): HndlAnomaly[] {
  const db = getDb();

  // Start fresh so old demo / seed anomalies do not persist across regenerations.
  db.prepare("DELETE FROM hndl_events").run();

  const domains = (db.prepare("SELECT host FROM domains").all() as any[]).map((d) => d.host);
  const domainSet = new Set(domains);

  const tlsRows = db.prepare(`
    SELECT DISTINCT dst, version, cipher, curve, risk
    FROM tls_scans
    WHERE dst IS NOT NULL AND dst != ''
  `).all() as any[];

  const anomalies: HndlAnomaly[] = [];
  const seen = new Set<string>();

  for (const row of tlsRows) {
    const dst = String(row.dst || "").split(":")[0];
    if (!dst || domainSet.has(dst) || seen.has(dst)) continue;
    seen.add(dst);

    const { volume, deviation, sessions } = syntheticVolume(row.risk);
    const baseline = Math.round((volume / deviation) * 10) / 10;
    const status = deviation > 3.5 ? "active" : "watch";

    anomalies.push({
      dst,
      asn: pickAsn(dst),
      geo: pickGeo(dst),
      volume: `${volume} GB`,
      baseline: `${baseline} GB`,
      deviation,
      sessions,
      window: "last 1h",
      status: status as HndlAnomaly["status"],
      note: `Encrypted egress to ${dst} is ${deviation}× the established baseline. The destination uses ${row.version || "TLS"} / ${row.cipher || "unknown cipher"} and is not in the internal domain list — a pattern consistent with bulk exfiltration for later decryption.`,
    });
  }

  // Fallback: if no external TLS destinations exist, generate synthetic demo
  // anomalies so the HNDL screen is not empty in local/demo mode.
  if (anomalies.length === 0) {
    const demoDestinations = [
      { dst: "bulk-storage-7cc1.exit-node.cc", version: "TLS 1.2", cipher: "ECDHE-RSA-AES256-GCM-SHA384", risk: "high" },
      { dst: "unknown-cdn-91a4.tor-exit.io", version: "TLS 1.2", cipher: "DHE-RSA-AES128-SHA", risk: "critical" },
      { dst: "mirror-pq-42b2.offshore-net.xyz", version: "TLS 1.3", cipher: "TLS_AES_256_GCM_SHA384", risk: "monitor" },
      { dst: "drop-zone-3f11.encrypted-uploads.co", version: "TLS 1.2", cipher: "ECDHE-RSA-AES128-GCM-SHA256", risk: "high" },
    ];
    for (const d of demoDestinations) {
      const { volume, deviation, sessions } = syntheticVolume(d.risk);
      const baseline = Math.round((volume / deviation) * 10) / 10;
      const status = deviation > 3.5 ? "active" : "watch";
      anomalies.push({
        dst: d.dst,
        asn: pickAsn(d.dst),
        geo: pickGeo(d.dst),
        volume: `${volume} GB`,
        baseline: `${baseline} GB`,
        deviation,
        sessions,
        window: "last 1h",
        status: status as HndlAnomaly["status"],
        note: `(Synthetic demo) Encrypted egress to ${d.dst} is ${deviation}× the established baseline. The destination uses ${d.version} / ${d.cipher} and is not in the internal domain list — a pattern consistent with bulk exfiltration for later decryption.`,
      });
    }
  }

  // Persist and return
  db.prepare("DELETE FROM hndl_events").run();
  const insert = db.prepare(`
    INSERT INTO hndl_events (dst, asn, geo, volume, baseline, deviation, sessions, window, status, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of anomalies) {
    insert.run(a.dst, a.asn, a.geo, a.volume, a.baseline, a.deviation, a.sessions, a.window, a.status, a.note);
  }

  return anomalies;
}

export function listHndlAnomalies(): HndlAnomaly[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM hndl_events ORDER BY deviation DESC").all() as any[];
  return rows.map((r) => ({
    dst: String(r.dst || ""),
    asn: String(r.asn || ""),
    geo: String(r.geo || ""),
    volume: String(r.volume || ""),
    baseline: String(r.baseline || ""),
    deviation: Number(r.deviation || 0),
    sessions: Number(r.sessions || 0),
    window: String(r.window || ""),
    status: (String(r.status || "watch") as HndlAnomaly["status"]),
    note: String(r.note || ""),
    _time: String(r.created_at || ""),
  }));
}
