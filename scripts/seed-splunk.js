#!/usr/bin/env node
// ============================================================
// scripts/seed-splunk.js — loads illustrative demo data
// (network TLS, PKI certificates, HNDL anomalies, code findings,
//  repos, roadmap and org plans) into Splunk via HEC so
// dashboards show real indexed events.
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
const https = require("https");
const fetch = require("node-fetch");

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
const INDEX_SOURCE = env.SPLUNK_INDEX_SOURCE || "crypto_source";
const INDEX_PLAN = env.SPLUNK_INDEX_PLAN || "crypto_plan";

if (!HEC_URL || !HEC_TOKEN) {
  console.error("Set SPLUNK_HEC_URL and SPLUNK_HEC_TOKEN in .env.local");
  process.exit(1);
}

// ── Network TLS connections ─────────────────────────────────
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

// ── PKI Certificates ────────────────────────────────────────
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

// ── HNDL anomalies ──────────────────────────────────────────
const hndlAnomalies = [
  { dst: "185.220.101.44", asn: "AS-UNKNOWN", geo: "Frankfurt, DE", volume: "312 GB", baseline: "14 GB/day", deviation: 21.4, sessions: 1840, window: "34h–41h", status: "active", note: "Sustained bulk transfer to first-seen destination. No business owner mapped." },
  { dst: "91.219.237.18", asn: "AS-RIPE-204", geo: "Bucharest, RO", volume: "88 GB", baseline: "6 GB/day", deviation: 14.7, sessions: 640, window: "rolling 24h", status: "active", note: "Encrypted egress to bulletproof-hosting ASN, off-hours pattern." },
  { dst: "45.133.1.9", asn: "AS-UNKNOWN", geo: "Unknown", volume: "54 GB", baseline: "9 GB/day", deviation: 6.0, sessions: 410, window: "rolling 24h", status: "watch", note: "Long-lived TLS 1.2 sessions, large record sizes, low interactivity." },
  { dst: "103.224.182.7", asn: "AS-APNIC-92", geo: "Singapore, SG", volume: "31 GB", baseline: "11 GB/day", deviation: 2.8, sessions: 220, window: "rolling 24h", status: "watch", note: "Elevated but within seasonal partner-sync tolerance. Monitoring." },
];

// ── Code findings (crypto_source / zeroq:crypto_finding) ────
const codeFindings = [
  { sev: "critical", kind: "RSA key generation", file: "src/crypto/keys.js", line: 42, code: "RSA.generateKey(2048)", fix: "Bump to ML-DSA-65 + ML-KEM-768", repo: "payments-api", provider: "github", lang: "JavaScript", branch: "main", owner: "acme-corp" },
  { sev: "critical", kind: "RSA-OAEP encryption", file: "lib/vault.ts", line: 88, code: "crypto.publicEncrypt({key:rsa, padding:RSA_PKCS1_OAEP_PADDING}, data)", fix: "Upgrade to ML-KEM-768 encapsulation", repo: "payments-api", provider: "github", lang: "TypeScript", branch: "main", owner: "acme-corp" },
  { sev: "critical", kind: "Static cipher suite pin", file: "config/tls.yaml", line: 12, code: "cipher: TLS_RSA_WITH_AES_128_CBC_SHA", fix: "Remove static cipher pin", repo: "auth-gateway", provider: "github", lang: "YAML", branch: "main", owner: "acme-corp" },
  { sev: "high", kind: "ECDSA P-256 only", file: "pkg/sign/ecdsa.go", line: 55, code: "ecdsa.Sign(rand, privKey, hash)", fix: "Adopt ECDSA + ML-DSA hybrid", repo: "auth-gateway", provider: "github", lang: "Go", branch: "main", owner: "acme-corp" },
  { sev: "high", kind: "RS256 JWT signing", file: "internal/auth/jwt.go", line: 112, code: "jwt.Sign(token, jwt.SigningMethodRS256, rsaKey)", fix: "Switch to PS256 or EdDSA", repo: "auth-gateway", provider: "github", lang: "Go", branch: "main", owner: "acme-corp" },
  { sev: "high", kind: "Pre-PQC crypto dependency", file: "go.mod", line: 1, code: "golang.org/x/crypto v0.18.0", fix: "Upgrade to v0.24+ with ML-KEM", repo: "auth-gateway", provider: "github", lang: "Go", branch: "main", owner: "acme-corp" },
  { sev: "critical", kind: "RSA key generation", file: "src/rsa_util.py", line: 27, code: "rsa.newkeys(2048)", fix: "Bump to ML-DSA-65", repo: "legacy-vpn", provider: "github", lang: "Python", branch: "main", owner: "acme-corp" },
  { sev: "monitor", kind: "SHA-1 cert pin", file: "res/xml/security.xml", line: 8, code: "<pin sha1=\"a1b2c3...\"/>", fix: "Replace with SHA-256 pin", repo: "legacy-vpn", provider: "github", lang: "XML", branch: "main", owner: "acme-corp" },
  { sev: "high", kind: "Static cipher suite pin", file: "ssl.conf", line: 33, code: "SSLCipherSuite ECDHE-RSA-AES128-GCM-SHA256", fix: "Allow negotiation, add PQC suites", repo: "legacy-vpn", provider: "github", lang: "Conf", branch: "main", owner: "acme-corp" },
  { sev: "critical", kind: "RSA key generation", file: "Crypto/RSA.java", line: 64, code: "KeyPairGenerator.getInstance(\"RSA\")", fix: "Bump to ML-DSA-65", repo: "records-db", provider: "github", lang: "Java", branch: "main", owner: "acme-corp" },
  { sev: "high", kind: "Pre-PQC crypto dependency", file: "pom.xml", line: 45, code: "<bcprov-jdk18on>1.76</bcprov-jdk18on>", fix: "Upgrade to BC 1.78 with PQC", repo: "records-db", provider: "github", lang: "Java", branch: "main", owner: "acme-corp" },
  { sev: "monitor", kind: "Legacy TLS version", file: "nginx.conf", line: 22, code: "ssl_protocols TLSv1 TLSv1.1 TLSv1.2;", fix: "Bump minimum to TLS 1.2", repo: "partner-edi", provider: "github", lang: "Conf", branch: "main", owner: "acme-corp" },
  { sev: "high", kind: "ECDSA P-256 only", file: "signer.py", line: 19, code: "ecdsa.SigningKey.generate(curve=NIST256p)", fix: "Adopt ECDSA + ML-DSA hybrid", repo: "partner-edi", provider: "github", lang: "Python", branch: "main", owner: "acme-corp" },
];

// ── Repo metadata (crypto_source / zeroq:repo_meta) ─────────
const repoMeta = [
  { name: "acme-corp", provider: "github", repo: "payments-api", stars: 120, members: 45, scanned_epoch: Math.floor(Date.now() / 1000) - 1800, org: "acme-corp" },
  { name: "acme-corp", provider: "github", repo: "auth-gateway", stars: 89, members: 45, scanned_epoch: Math.floor(Date.now() / 1000) - 3600, org: "acme-corp" },
  { name: "acme-corp", provider: "github", repo: "legacy-vpn", stars: 12, members: 45, scanned_epoch: Math.floor(Date.now() / 1000) - 7200, org: "acme-corp" },
  { name: "acme-corp", provider: "github", repo: "records-db", stars: 34, members: 45, scanned_epoch: Math.floor(Date.now() / 1000) - 5400, org: "acme-corp" },
  { name: "acme-corp", provider: "github", repo: "partner-edi", stars: 7, members: 45, scanned_epoch: Math.floor(Date.now() / 1000) - 9000, org: "acme-corp" },
];

// ── Roadmap (crypto_plan / zeroq:roadmap) ───────────────────
const roadmap = [
  { phase: "Phase 1 — Quick Wins", window: "Weeks 1-4", tone: "safe", item_order: 1, asset: "legacy-vpn.dmz.company.com", action: "Disable TLS 1.0/1.1, enable TLS 1.2+", effort: "Low", impact: "High", why: "Removes 3 vulnerable protocols from edge." },
  { phase: "Phase 1 — Quick Wins", window: "Weeks 1-4", tone: "safe", item_order: 2, asset: "iot-hub.ot.company.com", action: "Replace RSA-1024 cert with ECC P-256", effort: "Low", impact: "High", why: "Stops weak-key exposure on OT segment." },
  { phase: "Phase 2 — Certificate Modernisation", window: "Weeks 5-10", tone: "warn", item_order: 1, asset: "payments-api.prod.company.com", action: "Rotate to ML-DSA-65 + ML-KEM-768 cert", effort: "Medium", impact: "High", why: "Achieves CNSA 2.0 compliance for payment data." },
  { phase: "Phase 2 — Certificate Modernisation", window: "Weeks 5-10", tone: "warn", item_order: 2, asset: "auth-gateway.prod.company.com", action: "Rotate to hybrid ECDSA+ML-DSA cert", effort: "Medium", impact: "High", why: "Dual-algorithm for backward compat during transition." },
  { phase: "Phase 3 — Crypto Agility", window: "Weeks 11-18", tone: "safe", item_order: 1, asset: "All production services", action: "Enable automated cipher-suite negotiation", effort: "High", impact: "Medium", why: "Future-proofs against new algorithm deprecations." },
  { phase: "Phase 3 — Crypto Agility", window: "Weeks 11-18", tone: "safe", item_order: 2, asset: "All CI/CD pipelines", action: "Integrate SAST scanner for crypto smells", effort: "Medium", impact: "High", why: "Shifts security left; prevents regressions." },
];

// ── Org plan (crypto_plan / zeroq:org_plan) ─────────────────
const orgPlan = [
  { org: "acme-corp", title: "Network Hardening", tone: "warn", window: "Weeks 1-4", stream_order: 1, action_order: 1, repo: "legacy-vpn", task: "Disable TLS 1.0/1.1", pr: "#42", effort: "Low", summary: "Post-quantum readiness roadmap for acme-corp", posture: "D+", targetPosture: "A-", weeks: 12 },
  { org: "acme-corp", title: "Network Hardening", tone: "warn", window: "Weeks 1-4", stream_order: 1, action_order: 2, repo: "iot-hub", task: "Replace RSA-1024 cert", pr: "#43", effort: "Low", summary: "Post-quantum readiness roadmap for acme-corp", posture: "D+", targetPosture: "A-", weeks: 12 },
  { org: "acme-corp", title: "Certificate Modernisation", tone: "safe", window: "Weeks 5-10", stream_order: 2, action_order: 1, repo: "payments-api", task: "Rotate to ML-DSA-65 cert", pr: "#88", effort: "Medium", summary: "Post-quantum readiness roadmap for acme-corp", posture: "D+", targetPosture: "A-", weeks: 12 },
  { org: "acme-corp", title: "Certificate Modernisation", tone: "safe", window: "Weeks 5-10", stream_order: 2, action_order: 2, repo: "auth-gateway", task: "Hybrid ECDSA+ML-DSA cert", pr: "#89", effort: "Medium", summary: "Post-quantum readiness roadmap for acme-corp", posture: "D+", targetPosture: "A-", weeks: 12 },
  { org: "acme-corp", title: "Crypto Agility", tone: "safe", window: "Weeks 11-18", stream_order: 3, action_order: 1, repo: "all-services", task: "Automated cipher negotiation", pr: "#120", effort: "High", summary: "Post-quantum readiness roadmap for acme-corp", posture: "D+", targetPosture: "A-", weeks: 12 },
  { org: "acme-corp", title: "Crypto Agility", tone: "safe", window: "Weeks 11-18", stream_order: 3, action_order: 2, repo: "ci-cd", task: "SAST crypto scanner", pr: "#121", effort: "Medium", summary: "Post-quantum readiness roadmap for acme-corp", posture: "D+", targetPosture: "A-", weeks: 12 },
];

const nowSec = Date.now() / 1000;

function makeEvents(items, index, sourcetype, host) {
  return items.map((it, i) => ({
    time: nowSec - i * 60,
    host,
    source: "zeroq:seed",
    sourcetype,
    index,
    event: it,
  }));
}

const SKIP_TLS = (env.SPLUNK_SKIP_TLS_VERIFY || "").toLowerCase() === "true";
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

async function sendBatch(events) {
  if (events.length === 0) return { ok: true, sent: 0 };
  const body = events.map((e) => JSON.stringify(e)).join("\n");
  const res = await fetch(`${HEC_URL}/services/collector/event`, {
    method: "POST",
    headers: { Authorization: `Splunk ${HEC_TOKEN}`, "Content-Type": "text/plain" },
    body,
    agent: SKIP_TLS ? insecureAgent : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HEC ${res.status}: ${text}`);
  }
  return { ok: true, sent: events.length };
}

(async () => {
  try {
    const netEvents = makeEvents(inventory, INDEX_NET, "zeroq:tls_connection", "zeek-01");
    const pkiEvents = makeEvents(certs, INDEX_PKI, "zeroq:cert", "pki-collector");
    const hndlEvents = makeEvents(hndlAnomalies, INDEX_HNDL, "zeroq:hndl_event", "hndl-detector");
    const findingEvents = makeEvents(codeFindings, INDEX_SOURCE, "zeroq:crypto_finding", "zeroq-scanner");
    const repoMetaEvents = makeEvents(repoMeta, INDEX_SOURCE, "zeroq:repo_meta", "zeroq-scanner");
    const roadmapEvents = makeEvents(roadmap, INDEX_PLAN, "zeroq:roadmap", "zeroq-planner");
    const orgPlanEvents = makeEvents(orgPlan, INDEX_PLAN, "zeroq:org_plan", "zeroq-planner");

    const netRes = await sendBatch(netEvents);
    const pkiRes = await sendBatch(pkiEvents);
    const hndlRes = await sendBatch(hndlEvents);
    const findingRes = await sendBatch(findingEvents);
    const repoMetaRes = await sendBatch(repoMetaEvents);
    const roadmapRes = await sendBatch(roadmapEvents);
    const orgPlanRes = await sendBatch(orgPlanEvents);

    console.log("Seeded Splunk successfully:");
    console.log(`  index=${INDEX_NET}  sourcetype=zeroq:tls_connection  sent=${netRes.sent}`);
    console.log(`  index=${INDEX_PKI}  sourcetype=zeroq:cert            sent=${pkiRes.sent}`);
    console.log(`  index=${INDEX_HNDL}  sourcetype=zeroq:hndl_event      sent=${hndlRes.sent}`);
    console.log(`  index=${INDEX_SOURCE}  sourcetype=zeroq:crypto_finding  sent=${findingRes.sent}`);
    console.log(`  index=${INDEX_SOURCE}  sourcetype=zeroq:repo_meta       sent=${repoMetaRes.sent}`);
    console.log(`  index=${INDEX_PLAN}  sourcetype=zeroq:roadmap         sent=${roadmapRes.sent}`);
    console.log(`  index=${INDEX_PLAN}  sourcetype=zeroq:org_plan        sent=${orgPlanRes.sent}`);
  } catch (e) {
    console.error("Seed failed:", e.message);
    process.exit(1);
  }
})();
