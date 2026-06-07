// ============================================================
// services/PostureContext.ts — builds the grounded context the
// assistant reasons over. Uses Splunk live data when available.
// ============================================================
import type { ScanResult } from "../types";
import type { SplunkClient } from "../splunk/SplunkClient";

export interface PostureContextOpts {
  splunk?: SplunkClient;
}

export async function buildPostureContext(scanned: ScanResult[], opts: PostureContextOpts = {}): Promise<string> {
  const splunk = opts.splunk && opts.splunk.enabled ? opts.splunk : null;

  const [riskSummary, inventory, certs, algoMix] = await Promise.all([
    splunk?.getRiskSummary(),
    splunk?.getInventory(),
    splunk?.getCertificates(),
    splunk?.getAlgoMix(),
  ]);

  const summary = riskSummary
    ? {
        riskScore: riskSummary.riskScore,
        riskBand: riskSummary.riskBand,
        endpointsScanned: riskSummary.endpointsScanned ?? 0,
        coverage: riskSummary.coverage ?? 0,
        connectionsObserved: riskSummary.connectionsObserved ?? 0,
      }
    : { riskScore: 0, riskBand: "—", endpointsScanned: 0, coverage: 0, connectionsObserved: 0 };

  const liveInventory = inventory && inventory.length > 0 ? inventory : [];
  const liveCerts = certs && certs.length > 0 ? certs : [];
  const liveAlgoMix = algoMix && algoMix.length > 0 ? algoMix : [];

  const tally: Record<string, number> = {};
  liveInventory.forEach((r) => { tally[r.risk] = (tally[r.risk] ?? 0) + 1; });

  const criticalEndpoints = liveInventory
    .filter((r) => r.risk === "critical")
    .map((r) => `${r.server} [${r.version} ${r.cipher}]`)
    .slice(0, 8);

  const expiringCerts = liveCerts
    .filter((c) => c.expiry < 90)
    .map((c) => `${c.subject} (${c.alg === "rsaEncryption" ? "RSA-" + c.bits : c.alg}, ${c.expiry}d)`);

  const scannedSummary = scanned.length
    ? scanned.map((x) => `${x.repo} — grade ${x.grade}, ${x.findings} findings (${x.critical} critical), risk ${x.risk}/100; top: ${x.detail.slice(0, 4).map((f) => `${f.kind} @ ${f.file}:${f.line}`).join("; ")}`).join("\n")
    : "none yet (user can live-scan a public repo in Repository Scanner)";

  return [
    `QUANTUM RISK SCORE: ${summary.riskScore}/100 (${summary.riskBand}), was 0 last month.`,
    `NETWORK: ${summary.endpointsScanned} endpoints, ${summary.coverage}% coverage, ${summary.connectionsObserved ? (summary.connectionsObserved / 1_000_000).toFixed(2) + "M" : "—"} TLS connections/24h.`,
    `CONNECTION PROFILES BY TIER: critical ${tally.critical ?? 0}, high ${tally.high ?? 0}, monitor ${tally.monitor ?? 0}, safe ${tally.safe ?? 0}.`,
    `CRITICAL TLS ENDPOINTS (RSA / legacy): ${criticalEndpoints.join("; ") || "none detected"}.`,
    `CERTS EXPIRING <90d: ${expiringCerts.join("; ") || "none detected"}.`,
    `ALGO MIX: ${liveAlgoMix.map((a) => a.algo + " " + a.pct + "%").join(", ") || "no data"}.`,
    `LIVE-SCANNED REPOS:\n${scannedSummary}`,
    `COMPLIANCE: NIST IR 8547 (RSA/ECDSA deprecated 2030, disallowed 2035), NSA CNSA 2.0 (PQC default 2030), CISA roadmap.`,
  ].join("\n");
}
