#!/usr/bin/env node
/**
 * HNDL random anomaly emitter.
 *
 * Levanta un pequeño servidor HTTP en localhost (puerto 3006 por defecto)
 * que expone anomalías HNDL sintéticas. Útil para demos sin Splunk.
 *
 * Endpoints:
 *   GET  /                      -> info
 *   GET  /api/hndl/random?count=N -> JSON con N anomalías aleatorias
 *   GET  /stream                -> Server-Sent Events, una anomalía cada 2s
 *
 * Uso:
 *   node scripts/hndl-emitter.js
 *   PORT=3007 node scripts/hndl-emitter.js
 */
const http = require("http");

const PORT = process.env.PORT || 3006;

const GEO_POOL = ["US", "NL", "DE", "SG", "BR", "JP", "GB", "CA", "IN", "AU"];
const HOST_POOL = [
  "bulk-storage", "mirror-pq", "drop-zone", "unknown-cdn",
  "exfil-node", "encrypted-upload", "quantum-drop", "shadow-relay",
];
const TLD_POOL = ["cc", "io", "xyz", "co", "net", "tk", "ml", "pw"];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hashSeed(seed, mult) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * mult + seed.charCodeAt(i)) >>> 0;
  return h;
}

function randomHost() {
  const prefix = pick(HOST_POOL);
  const suffix = Math.floor(rand(1000, 9999)).toString(16);
  return `${prefix}-${suffix}.${pick(TLD_POOL)}`;
}

function randomAnomaly() {
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

function anomalies(count) {
  return Array.from({ length: count }, randomAnomaly);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end(`HNDL random emitter\nEndpoints:\n  GET /api/hndl/random?count=N\n  GET /stream (SSE)\n`);
    return;
  }

  if (url.pathname === "/api/hndl/random") {
    let count = Number(url.searchParams.get("count")) || 1;
    if (count < 1) count = 1;
    if (count > 1000) count = 1000;
    res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
    res.end(JSON.stringify({ ok: true, count, data: anomalies(count) }, null, 2));
    return;
  }

  if (url.pathname === "/stream") {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "connection": "keep-alive",
      "access-control-allow-origin": "*",
    });
    const send = () => {
      const payload = JSON.stringify(randomAnomaly());
      res.write(`data: ${payload}\n\n`);
    };
    send();
    const interval = setInterval(send, 2000);
    req.on("close", () => clearInterval(interval));
    return;
  }

  res.writeHead(404, { "content-type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`HNDL emitter listening on http://localhost:${PORT}`);
  console.log(`  Random JSON: http://localhost:${PORT}/api/hndl/random?count=5`);
  console.log(`  SSE stream:  http://localhost:${PORT}/stream`);
});
