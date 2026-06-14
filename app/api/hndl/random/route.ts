import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { config } from "@/lib/config";
import { splunkFetch } from "@/lib/splunk/fetchSplunk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GEO_POOL = ["US", "NL", "DE", "SG", "BR", "JP", "GB", "CA", "IN", "AU"];
const HOST_POOL = [
  "bulk-storage",
  "mirror-pq",
  "drop-zone",
  "unknown-cdn",
  "exfil-node",
  "encrypted-upload",
  "quantum-drop",
  "shadow-relay",
];
const TLD_POOL = ["cc", "io", "xyz", "co", "net", "tk", "ml", "pw"];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hashSeed(seed: string, mult: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * mult + seed.charCodeAt(i)) >>> 0;
  return h;
}

function randomHost(): string {
  const prefix = pick(HOST_POOL);
  const suffix = Math.floor(rand(1000, 9999)).toString(16);
  return `${prefix}-${suffix}.${pick(TLD_POOL)}`;
}

function randomAnomaly(): Record<string, any> {
  const dst = randomHost();
  const risk = pick(["critical", "high", "monitor"]);
  const base = 5 + Math.random() * 10;
  const riskMult = risk === "critical" ? 3.5 : risk === "high" ? 2.5 : 1.5;
  const deviation = Math.round((1.3 + Math.random() * 2.2) * riskMult * 10) / 10;
  const volume = Math.round(base * deviation * 10) / 10;
  const baseline = Math.round((volume / deviation) * 10) / 10;
  const sessions = Math.floor(30 + deviation * (30 + Math.random() * 100));
  const status = deviation > 3.5 ? "active" : "watch";
  const geo = GEO_POOL[hashSeed(dst, 31) % GEO_POOL.length];
  const asn = `AS${10000 + (hashSeed(dst, 17) % 50000)}`;

  return {
    dst,
    asn,
    geo,
    volume: `${volume} GB`,
    baseline: `${baseline} GB`,
    deviation,
    sessions,
    window: "last 1h",
    status,
    note: `(Random) Encrypted egress to ${dst} is ${deviation}× the established baseline — a pattern consistent with bulk exfiltration for later decryption.`,
    _time: new Date().toISOString(),
  };
}

function persist(anomalies: Record<string, any>[]) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO hndl_events (dst, asn, geo, volume, baseline, deviation, sessions, window, status, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of anomalies) {
    insert.run(a.dst, a.asn, a.geo, a.volume, a.baseline, a.deviation, a.sessions, a.window, a.status, a.note);
  }
}

async function pushToSplunk(anomalies: Record<string, any>[]) {
  if (!config.splunk.hecEnabled || anomalies.length === 0) return;
  const now = Date.now() / 1000;
  const events = anomalies.map((a) => ({
    time: now,
    host: "zeroq-hndl-random",
    source: "zeroq:hndl-random",
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
  } catch (e: any) {
    console.error("[api/hndl/random] HEC push failed:", e?.message);
  }
}

// GET /api/hndl/random?count=5  -> devuelve N anomalías aleatorias
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let count = Number(searchParams.get("count")) || 1;
    if (count < 1) count = 1;
    if (count > 100) count = 100;

    const anomalies = Array.from({ length: count }, randomAnomaly);
    return NextResponse.json({ ok: true, count: anomalies.length, data: anomalies });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

// POST /api/hndl/random?count=5  -> genera, persiste y opcionalmente empuja a Splunk
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let count = Number(searchParams.get("count")) || 1;
    if (count < 1) count = 1;
    if (count > 100) count = 100;

    const anomalies = Array.from({ length: count }, randomAnomaly);
    persist(anomalies);
    await pushToSplunk(anomalies);

    return NextResponse.json({ ok: true, count: anomalies.length, data: anomalies });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
