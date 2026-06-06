// ============================================================
// services/PostureContext.ts — builds the grounded context the
// assistant reasons over. Single responsibility, reusable.
// ============================================================
import { DATA } from "../data";
import type { ScanResult } from "../types";

export function buildPostureContext(scanned: ScanResult[]): string {
  const s = DATA.summary;
  const tally: Record<string, number> = {};
  DATA.inventory.forEach((r) => { tally[r.risk] = (tally[r.risk] ?? 0) + 1; });

  const criticalEndpoints = DATA.inventory
    .filter((r) => r.risk === "critical")
    .map((r) => `${r.server} [${r.version} ${r.cipher}]`)
    .slice(0, 8);

  const expiringCerts = DATA.certs
    .filter((c) => c.expiry < 90)
    .map((c) => `${c.subject} (${c.alg === "rsaEncryption" ? "RSA-" + c.bits : c.alg}, ${c.expiry}d)`);

  const scannedSummary = scanned.length
    ? scanned.map((x) => `${x.repo} — grade ${x.grade}, ${x.findings} findings (${x.critical} critical), risk ${x.risk}/100; top: ${x.detail.slice(0, 4).map((f) => `${f.kind} @ ${f.file}:${f.line}`).join("; ")}`).join("\n")
    : "none yet (user can live-scan a public repo in Repository Scanner)";

  return [
    `QUANTUM RISK SCORE: ${s.riskScore}/100 (${s.riskBand}), was ${s.lastMonthScore} last month.`,
    `NETWORK: ${s.endpointsScanned} endpoints, ${s.coverage}% coverage, 1.31M TLS connections/24h.`,
    `CONNECTION PROFILES BY TIER: critical ${tally.critical ?? 0}, high ${tally.high ?? 0}, monitor ${tally.monitor ?? 0}, safe ${tally.safe ?? 0}.`,
    `CRITICAL TLS ENDPOINTS (RSA / legacy): ${criticalEndpoints.join("; ")}.`,
    `CERTS EXPIRING <90d: ${expiringCerts.join("; ")}.`,
    `ALGO MIX: ${DATA.algoMix.map((a) => a.algo + " " + a.pct + "%").join(", ")}.`,
    `LIVE-SCANNED REPOS:\n${scannedSummary}`,
    `COMPLIANCE: NIST IR 8547 (RSA/ECDSA deprecated 2030, disallowed 2035), NSA CNSA 2.0 (PQC default 2030), CISA roadmap.`,
  ].join("\n");
}
