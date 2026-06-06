#!/usr/bin/env node
// ============================================================
// scripts/seed-splunk.js — loads illustrative demo data
// (network TLS, PKI certificates, HNDL anomalies) into Splunk
// via HEC so dashboards show real indexed events.
//
// Usage:
//   npm run seed:splunk
//   # or
//   node scripts/seed-splunk.js
//
// Requires SPLUNK_HEC_URL and SPLUNK_HEC_TOKEN in .env.local
// ============================================================

const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return process.env;
  const text = fs.readFileSync(envPath, "utf8");
  const env = { ...process.env };
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!m) continue;
    const [, key, raw] = m;
    env[key] = raw.replace(/^["']|["']$/g, "").trim();
  }
  return env;
}

const env = loadEnv();

const HEC_URL = (env.SPLUNK_HEC_URL || "").replace(/\/$/, "");
const HEC_TOKEN = env.SPLUNK_HEC_TOKEN;
const INDEX_NET = env.SPLUNK_INDEX_NET || "crypto_net";
const INDEX_PKI = env.SPLUNK_INDEX_PKI || "crypto_pki";
const INDEX_HNDL = env.SPLUNK_INDEX_HNDL || "crypto_hndl";

if (!HEC_URL || !HEC_TOKEN) {
  console.error("Set SPLUNK_HEC_URL and SPLUNK_HEC_TOKEN in .env.local");
  process.exit(1);
}

// Demo data mirrors lib/data.ts inventory, certs and hndlAnomalies.
const inventory = [
  { server: "payments-api.prod.company.com", src: "10.1.5.22", dst: "52.84.12.101", version: "TLS 1.2", cipher: "TLS_RSA_WITH_AES_128_CBC_SHA", curve: "—", risk: "critical", hosts: 38 },
  { server: "auth-gateway.prod.company.com", src: "10.1.5.41", dst: "10.2.0.18", version: "TLS 1.2", cipher: "TLS_RSA_WITH_AES_256_GCM_SHA384", curve: "—", risk: "critical", hosts: 22 },
  { server: "legacy-vpn.dmz.company.com", src: "10.4.9.2", dst: "198.51.100.7", version: "TLS 1.0", cipher: "TLS_RSA_WITH_3DES_EDE_CBC_SHA", curve: "—", risk: "critical", hosts: 4 },
  { server: "records-db.internal.company.com", src: "10.2.7.11", dst: "10.2.7.40", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", curve: "secp256r1", risk: "high", hosts: 14 },
  { server: "partner-edi.dmz.company.com", src: "10.4.1.8", dst: "203.0.113.55", version: "TLS 1.1", cipher: "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA", curve: "secp256r1", risk: "high", hosts: 7 },
  { server: "mail-relay.prod.company.com", src: "10.1.8.30", dst: "142.250.1.26", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", curve: "secp384r1", risk: "high", hosts: 9 },
  { server: "crm.internal.company.com", src: "10.3.2.5", dst: "10.3.2.9", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", curve: "secp256r1", risk: "high", hosts: 31 },
  { server: "analytics-bus.internal.company.com", src: "10.5.0.2", dst: "10.5.0.88", version: "TLS 1.2", cipher: "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256", curve: "secp256r1", risk: "monitor", hosts: 61 },
  { server: "cdn-edge.prod.company.com", src: "10.1.2.7", dst: "151.101.1.5", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256", curve: "secp256r1", risk: "monitor", hosts: 44 },
  { server: "wiki.internal.company.com", src: "10.3.9.14", dst: "10.3.9.2", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", curve: "secp384r1", risk: "monitor", hosts: 18 },
  { server: "api-gw.prod.company.com", src: "10.1.5.60", dst: "10.1.5.61", version: "TLS 1.3", cipher: "TLS_AES_256_GCM_SHA384", curve: "X25519MLKEM768", risk: "safe", hosts: 27 },
  { server: "identity-v2.prod.company.com", src: "10.2.1.3", dst: "10.2.1.9", version: "TLS 1.3", cipher: "TLS_AES_128_GCM_SHA256", curve: "X25519MLKEM768", risk: "safe", hosts: 16 },
  { server: "metrics.internal.company.com", src: "10.5.4.2", dst: "10.5.4.10", version: "TLS 1.3", cipher: "TLS_CHACHA20_POLY1305_SHA256", curve: "X25519MLKEM768", risk: "safe", hosts: 52 },
  { server: "backup-svc.internal.company.com", src: "10.6.0.4", dst: "10.6.0.20", version: "TLS 1.2", cipher: "TLS_RSA_WITH_AES_256_CBC_SHA256", curve: "—", risk: "critical", hosts: 6 },
  { server: "iot-hub.ot.company.com", src: "10.9.1.2", dst: "10.9.1.50", version: "TLS 1.0", cipher: "TLS_RSA_WITH_AES_128_CBC_SHA", curve: "—", risk: "critical", hosts: 12 },
  { server: "support-portal.dmz.company.com", src: "10.4.3.6", dst: "104.18.2.9", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", curve: "secp256r1", risk: "high", hosts: 8 },
  { server: "datalake.internal.company.com", src: "10.5.7.1", dst: "10.5.7.30", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", curve: "secp384r1", risk: "monitor", hosts: 29 },
  { server: "billing.prod.company.com", src: "10.1.6.12", dst: "10.1.6.40", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", curve: "secp256r1", risk: "high", hosts: 19 },
  { server: "dns-doh.prod.company.com", src: "10.1.0.5", dst: "10.1.0.6", version: "TLS 1.3", cipher: "TLS_AES_256_GCM_SHA384", curve: "X25519MLKEM768", risk: "safe", hosts: 40 },
  { server: "hr-portal.internal.company.com", src: "10.3.5.8", dst: "10.3.5.2", version: "TLS 1.2", cipher: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", curve: "secp256r1", risk: "high", hosts: 11 },
];

const certs = [
  { subject: "CN=payments-api.prod.company.com", alg: "rsaEncryption", bits: 2048, expiry: 47, issuer: "DigiCert TLS RSA", urgency: "renew" },
  { subject: "CN=auth-gateway.prod.company.com", alg: "rsaEncryption", bits: 2048, expiry: 73, issuer: "DigiCert TLS RSA", urgency: "renew" },
  { subject: "CN=*.dmz.company.com", alg: "rsaEncryption", bits: 2048, expiry: 12, issuer: "Internal PKI Root", urgency: "renew" },
  { subject: "CN=records-db.internal.company.com", alg: "id-ecPublicKey", bits: 256, expiry: 188, issuer: "Internal PKI Root", urgency: "plan" },
  { subject: "CN=billing.prod.company.com", alg: "rsaEncryption", bits: 4096, expiry: 240, issuer: "DigiCert TLS RSA", urgency: "plan" },
  { subject: "CN=crm.internal.company.com", alg: "id-ecPublicKey", bits: 256, expiry: 301, issuer: "Internal PKI Root", urgency: "plan" },
  { subject: "CN=partner-edi.dmz.company.com", alg: "rsaEncryption", bits: 2048, expiry: 58, issuer: "Sectigo RSA DV", urgency: "renew" },
  { subject: "CN=mail-relay.prod.company.com", alg: "id-ecPublicKey", bits: 384, expiry: 412, issuer: "Internal PKI Root", urgency: "monitor" },
  { subject: "CN=datalake.internal.company.com", alg: "id-ecPublicKey", bits: 384, expiry: 520, issuer: "Internal PKI Root", urgency: "monitor" },
  { subject: "CN=hr-portal.internal.company.com", alg: "rsaEncryption", bits: 2048, expiry: 96, issuer: "Internal PKI Root", urgency: "plan" },
  { subject: "CN=api-gw.prod.company.com", alg: "ML-DSA-65", bits: null, expiry: 360, issuer: "PQC Internal CA", urgency: "done" },
  { subject: "CN=identity-v2.prod.company.com", alg: "ML-DSA-65", bits: null, expiry: 358, issuer: "PQC Internal CA", urgency: "done" },
  { subject: "CN=iot-hub.ot.company.com", alg: "rsaEncryption", bits: 1024, expiry: 5, issuer: "Legacy OT CA", urgency: "renew" },
  { subject: "CN=backup-svc.internal.company.com", alg: "rsaEncryption", bits: 2048, expiry: 150, issuer: "Internal PKI Root", urgency: "plan" },
];

const hndlAnomalies = [
  { dst: "185.220.101.44", asn: "AS-UNKNOWN", geo: "Frankfurt, DE", volume: "312 GB", baseline: "14 GB/day", deviation: 21.4, sessions: 1840, window: "34h–41h", status: "active", note: "Sustained bulk transfer to first-seen destination. No business owner mapped." },
  { dst: "91.219.237.18", asn: "AS-RIPE-204", geo: "Bucharest, RO", volume: "88 GB", baseline: "6 GB/day", deviation: 14.7, sessions: 640, window: "rolling 24h", status: "active", note: "Encrypted egress to bulletproof-hosting ASN, off-hours pattern." },
  { dst: "45.133.1.9", asn: "AS-UNKNOWN", geo: "Unknown", volume: "54 GB", baseline: "9 GB/day", deviation: 6.0, sessions: 410, window: "rolling 24h", status: "watch", note: "Long-lived TLS 1.2 sessions, large record sizes, low interactivity." },
  { dst: "103.224.182.7", asn: "AS-APNIC-92", geo: "Singapore, SG", volume: "31 GB", baseline: "11 GB/day", deviation: 2.8, sessions: 220, window: "rolling 24h", status: "watch", note: "Elevated but within seasonal partner-sync tolerance. Monitoring." },
];

const nowSec = Date.now() / 1000;

function makeEvents(items, index, sourcetype, host) {
  return items.map((it, i) => ({
    time: nowSec - i * 60,
    host,
    source: "cam:seed",
    sourcetype,
    index,
    event: it,
  }));
}

async function sendBatch(events) {
  if (events.length === 0) return { ok: true, sent: 0 };
  const body = events.map((e) => JSON.stringify(e)).join("\n");
  const res = await fetch(`${HEC_URL}/services/collector/event`, {
    method: "POST",
    headers: { Authorization: `Splunk ${HEC_TOKEN}`, "Content-Type": "text/plain" },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HEC ${res.status}: ${text}`);
  }
  return { ok: true, sent: events.length };
}

(async () => {
  try {
    const netEvents = makeEvents(inventory, INDEX_NET, "cam:tls_connection", "zeek-01");
    const pkiEvents = makeEvents(certs, INDEX_PKI, "cam:cert", "pki-collector");
    const hndlEvents = makeEvents(hndlAnomalies, INDEX_HNDL, "cam:hndl_event", "hndl-detector");

    const netRes = await sendBatch(netEvents);
    const pkiRes = await sendBatch(pkiEvents);
    const hndlRes = await sendBatch(hndlEvents);

    console.log("Seeded Splunk successfully:");
    console.log(`  index=${INDEX_NET} sent=${netRes.sent}`);
    console.log(`  index=${INDEX_PKI} sent=${pkiRes.sent}`);
    console.log(`  index=${INDEX_HNDL} sent=${hndlRes.sent}`);
  } catch (e) {
    console.error("Seed failed:", e.message);
    process.exit(1);
  }
})();
