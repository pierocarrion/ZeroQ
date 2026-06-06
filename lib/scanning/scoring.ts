// ============================================================
// scanning/scoring.ts — derive grade, risk score, and the
// final ScanResult from a set of findings. Pure functions.
// ============================================================
import { LANGUAGE_BY_EXT } from "../rules";
import type { Finding, RepoMeta, ScanResult, Severity } from "../types";

const count = (findings: Finding[], sev: Severity) => findings.filter((f) => f.sev === sev).length;

/** Letter grade for a repository's cryptographic hygiene. */
export function grade(findings: Finding[]): string {
  if (findings.length === 0) return "A";
  const crit = count(findings, "critical");
  const high = count(findings, "high");
  const score = crit * 5 + high * 2 + (findings.length - crit - high);
  if (crit === 0 && score <= 2) return "B";
  if (crit === 0) return "C";
  if (crit <= 2 && score <= 12) return "D";
  return "F";
}

/** Quantum risk score 0..100 (higher = more exposed). */
export function riskScore(findings: Finding[], fileCount: number): number {
  if (findings.length === 0) return 6;
  const crit = count(findings, "critical");
  const high = count(findings, "high");
  const raw = crit * 9 + high * 4 + (findings.length - crit - high) * 1.5;
  const density = raw / Math.max(1, Math.log10(Math.max(10, fileCount)));
  return Math.max(4, Math.min(100, Math.round(28 + density)));
}

const extOf = (p: string) => (p.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toLowerCase();

/** Dominant language inferred from finding file extensions. */
function inferLanguage(findings: Finding[], fallback: string): string {
  if (fallback && fallback !== "—") return fallback;
  const tally: Record<string, number> = {};
  for (const f of findings) {
    const lang = LANGUAGE_BY_EXT[extOf(f.file)];
    if (lang) tally[lang] = (tally[lang] ?? 0) + 1;
  }
  return Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0] ?? "—";
}

/** Assemble the API-facing ScanResult from raw findings. */
export function buildScanResult(meta: RepoMeta, totalScannable: number, scanned: number, findings: Finding[]): ScanResult {
  return {
    repo: meta.fullName,
    provider: meta.provider,
    lang: inferLanguage(findings, meta.language),
    branch: meta.branch,
    loc: `${totalScannable} files`,
    owner: meta.fullName.split("/")[0],
    grade: grade(findings),
    findings: findings.length,
    critical: count(findings, "critical"),
    high: count(findings, "high"),
    monitor: count(findings, "monitor"),
    scanned,
    fileCount: totalScannable,
    risk: riskScore(findings, totalScannable),
    detail: findings.slice(0, 60).map(({ file, line, kind, sev, code, fix }) => ({ file, line, kind, sev, code, fix })),
    lastCommit: "just scanned",
    real: true,
  };
}
