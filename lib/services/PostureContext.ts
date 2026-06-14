// ============================================================
// services/PostureContext.ts — builds the grounded context the
// assistant reasons over. Prefers Splunk live data, but always
// falls back to the local SQLite store so the assistant works
// offline and local scans are always visible.
// ============================================================
import type { ScanResult, RepoSeed } from "../types";
import type { SplunkClient } from "../splunk/SplunkClient";

export interface PostureContextOpts {
  splunk?: SplunkClient;
  localStore?: SplunkClient;
}

function useful<T>(value: T | null | undefined): value is T {
  if (value == null) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === "object" && "riskScore" in value && (value as any).riskScore === 0 && ((value as any).endpointsScanned ?? 0) === 0) return false;
  return true;
}

export async function buildPostureContext(scanned: ScanResult[], opts: PostureContextOpts = {}): Promise<string> {
  const splunk = opts.splunk && opts.splunk.enabled ? opts.splunk : null;
  const local = opts.localStore && opts.localStore.enabled ? opts.localStore : null;

  const [splunkRisk, splunkInventory, splunkCerts, splunkAlgoMix] = await Promise.all([
    splunk?.getRiskSummary(),
    splunk?.getInventory(),
    splunk?.getCertificates(),
    splunk?.getAlgoMix(),
  ]);

  const [localRisk, localInventory, localCerts, localAlgoMix] = await Promise.all([
    local?.getRiskSummary(),
    local?.getInventory(),
    local?.getCertificates(),
    local?.getAlgoMix(),
  ]);

  const riskSummary = useful(splunkRisk) ? splunkRisk : useful(localRisk) ? localRisk : null;
  const inventory = useful(splunkInventory) ? splunkInventory : useful(localInventory) ? localInventory : [];
  const certs = useful(splunkCerts) ? splunkCerts : useful(localCerts) ? localCerts : [];
  const algoMix = useful(splunkAlgoMix) ? splunkAlgoMix : useful(localAlgoMix) ? localAlgoMix : [];

  const summary = riskSummary
    ? {
        riskScore: riskSummary.riskScore,
        riskBand: riskSummary.riskBand,
        endpointsScanned: riskSummary.endpointsScanned ?? 0,
        coverage: riskSummary.coverage ?? 0,
        connectionsObserved: riskSummary.connectionsObserved ?? 0,
      }
    : { riskScore: 0, riskBand: "—", endpointsScanned: 0, coverage: 0, connectionsObserved: 0 };

  const tally: Record<string, number> = {};
  inventory.forEach((r) => { tally[r.risk] = (tally[r.risk] ?? 0) + 1; });

  const criticalEndpoints = inventory
    .filter((r) => r.risk === "critical")
    .map((r) => `${r.server} [${r.version} ${r.cipher}]`)
    .slice(0, 8);

  const expiringCerts = certs
    .filter((c) => c.expiry < 90)
    .map((c) => `${c.subject} (${c.alg === "rsaEncryption" ? "RSA-" + c.bits : c.alg}, ${c.expiry}d)`);

  let scannedSummary = scanned.length
    ? scanned.map((x) => `${x.repo} — grade ${x.grade}, ${x.findings} findings (${x.critical} critical), risk ${x.risk}/100; top: ${x.detail.slice(0, 4).map((f) => `${f.kind} @ ${f.file}:${f.line}`).join("; ")}`).join("\n")
    : "";

  if (!scannedSummary && local) {
    const localRepos = await local.getRepos();
    if (localRepos && localRepos.length > 0) {
      scannedSummary = localRepos.map((x: RepoSeed) => `${x.repo} — grade ${x.grade}, ${x.findings} findings (${x.critical} critical/${x.high} high), language ${x.lang}; top: ${(x.detail || []).slice(0, 4).map((f) => `${f.kind} @ ${f.file}:${f.line}`).join("; ")}`).join("\n");
    }
  }

  if (!scannedSummary) {
    scannedSummary = "none yet (user can live-scan a public repo in Repository Scanner)";
  }

  return [
    `QUANTUM RISK SCORE: ${summary.riskScore}/100 (${summary.riskBand}), was 0 last month.`,
    `NETWORK: ${summary.endpointsScanned} endpoints, ${summary.coverage}% coverage, ${summary.connectionsObserved ? (summary.connectionsObserved / 1_000_000).toFixed(2) + "M" : "—"} TLS connections/24h.`,
    `CONNECTION PROFILES BY TIER: critical ${tally.critical ?? 0}, high ${tally.high ?? 0}, monitor ${tally.monitor ?? 0}, safe ${tally.safe ?? 0}.`,
    `CRITICAL TLS ENDPOINTS (RSA / legacy): ${criticalEndpoints.join("; ") || "none detected"}.`,
    `CERTS EXPIRING <90d: ${expiringCerts.join("; ") || "none detected"}.`,
    `ALGO MIX: ${algoMix.map((a) => a.algo + " " + a.pct + "%").join(", ") || "no data"}.`,
    `LIVE-SCANNED REPOS:\n${scannedSummary}`,
    `COMPLIANCE: NIST IR 8547 (RSA/ECDSA deprecated 2030, disallowed 2035), NSA CNSA 2.0 (PQC default 2030), CISA roadmap.`,
  ].join("\n");
}
