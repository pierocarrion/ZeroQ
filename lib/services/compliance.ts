// ============================================================
// lib/services/compliance.ts — shared compliance control catalog
// and evaluator. Used by both the local SQLite client and the
// Splunk REST client so both data sources produce the same
// control-based posture model.
// ============================================================
import type { ComplianceControl, ComplianceStat } from "@/lib/splunk/SplunkClient";
import type { ComplianceSummary } from "@/lib/types";

export interface ComplianceInput {
  repos?: string[]; // all scanned repositories, including clean ones
  repoFindings: Array<{ repo: string; kind: string; sev: "critical" | "high" | "monitor" }>;
  tlsScans: Array<{ host: string; version: string; cipher: string; curve: string; risk: string }>;
  certScans: Array<{ host: string; urgency: "renew" | "plan" | "monitor" | "done" }>;
}

interface ControlDef {
  id: string;
  framework: string;
  authority: string;
  title: string;
  description: string;
  recommendation: string;
  evaluate(input: ComplianceInput): Omit<ComplianceControl, "id" | "framework" | "authority" | "title" | "description" | "recommendation">;
}

function pct(passed: number, total: number): number {
  if (total === 0) return 100; // nothing to evaluate = pass by default
  return Math.round((passed / total) * 100);
}

function allRepos(input: ComplianceInput): Set<string> {
  return new Set(input.repos && input.repos.length > 0 ? input.repos : input.repoFindings.map((x) => x.repo));
}

function stateFromScore(score: number): ComplianceControl["state"] {
  if (score === 100) return "passed";
  if (score === 0) return "failed";
  return "partial";
}

const CONTROLS: ControlDef[] = [
  {
    id: "nist-no-rsa-keygen",
    framework: "NIST FIPS 140-3",
    authority: "NIST",
    title: "No RSA key generation / encryption",
    description: "RSA key generation, RSA encryption and static RSA cipher suites are vulnerable to Shor's algorithm and must be replaced with PQC KEMs.",
    recommendation: "Replace RSA key generation / encryption with ML-KEM (hybrid X25519MLKEM768) and remove static RSA cipher suites.",
    evaluate(input) {
      const kinds = ["RSA key generation", "RSA encryption", "Static RSA cipher suite"];
      const findings = input.repoFindings.filter((f) => kinds.some((k) => f.kind.includes(k)));
      const failingRepos = new Set(findings.map((f) => f.repo));
      const evaluatedRepos = allRepos(input);
      const total = evaluatedRepos.size;
      const failures = failingRepos.size;
      const score = pct(total - failures, total);
      return { state: stateFromScore(score), score, evaluated: total, failures };
    },
  },
  {
    id: "nist-no-legacy-ciphers",
    framework: "NIST FIPS 140-3",
    authority: "NIST",
    title: "No legacy or weak cipher suites",
    description: "Legacy TLS 1.0/1.1, 3DES and finite-field DH/DSA 1024 are classically weak and not quantum-resistant.",
    recommendation: "Disable TLS 1.0/1.1, remove 3DES and migrate finite-field DH/DSA to ECDH or ML-KEM.",
    evaluate(input) {
      const kinds = ["Legacy TLS 1.0/1.1", "3DES", "Finite-field DH/DSA 1024"];
      const findings = input.repoFindings.filter((f) => kinds.some((k) => f.kind.includes(k)));
      const failingRepos = new Set(findings.map((f) => f.repo));
      const evaluatedRepos = allRepos(input);
      const total = evaluatedRepos.size;
      const failures = failingRepos.size;
      const score = pct(total - failures, total);
      return { state: stateFromScore(score), score, evaluated: total, failures };
    },
  },
  {
    id: "nist-no-weak-digests",
    framework: "NIST FIPS 140-3",
    authority: "NIST",
    title: "No SHA-1 / MD5 usage",
    description: "SHA-1 and MD5 are deprecated and cannot anchor a post-quantum certificate chain.",
    recommendation: "Replace SHA-1/MD5 with SHA-256 or SHA-3 and re-pin certificate chains.",
    evaluate(input) {
      const kinds = ["SHA-1 usage", "MD5 digest"];
      const findings = input.repoFindings.filter((f) => kinds.some((k) => f.kind.includes(k)));
      const failingRepos = new Set(findings.map((f) => f.repo));
      const evaluatedRepos = allRepos(input);
      const total = evaluatedRepos.size;
      const failures = failingRepos.size;
      const score = pct(total - failures, total);
      return { state: stateFromScore(score), score, evaluated: total, failures };
    },
  },
  {
    id: "nsa-pqc-kex",
    framework: "NSA CNSA 2.0",
    authority: "NSA",
    title: "Hybrid PQC key exchange in use",
    description: "NSA CNSA 2.0 requires a transition to quantum-resistant key exchange such as ML-KEM.",
    recommendation: "Enable TLS 1.3 with X25519MLKEM768 (or similar hybrid ML-KEM) on all production endpoints.",
    evaluate(input) {
      const total = input.tlsScans.length;
      const hybrid = input.tlsScans.filter((s) => /MLKEM|X25519MLKEM/i.test(s.curve));
      const failures = total - hybrid.length;
      const score = pct(hybrid.length, total);
      return { state: stateFromScore(score), score, evaluated: total, failures };
    },
  },
  {
    id: "nsa-no-legacy-tls",
    framework: "NSA CNSA 2.0",
    authority: "NSA",
    title: "No legacy TLS or RSA key exchange on the wire",
    description: "TLS 1.0/1.1 and RSA key exchange must be eliminated from network traffic.",
    recommendation: "Require TLS 1.2+ with ECDHE; prefer TLS 1.3 and remove RSA key exchange cipher suites.",
    evaluate(input) {
      const bad = input.tlsScans.filter(
        (s) => /TLS\s*1\.[01]/.test(s.version) || /TLS_RSA|RSA/i.test(s.cipher)
      );
      const failingHosts = new Set(bad.map((s) => s.host));
      const evaluatedHosts = new Set(input.tlsScans.map((s) => s.host));
      const total = evaluatedHosts.size;
      const failures = failingHosts.size;
      const score = pct(total - failures, total);
      return { state: stateFromScore(score), score, evaluated: total, failures };
    },
  },
  {
    id: "cisa-cert-posture",
    framework: "CISA KEM Guidance",
    authority: "CISA",
    title: "Certificate posture ready for PQC migration",
    description: "Certificates that must be renewed now block a smooth migration to PQC PKI.",
    recommendation: "Renew or replace certificates nearing expiry and adopt PQC-aware certificate policies.",
    evaluate(input) {
      const total = input.certScans.length;
      const renew = input.certScans.filter((c) => c.urgency === "renew");
      const failures = renew.length;
      const score = pct(total - failures, total);
      return { state: stateFromScore(score), score, evaluated: total, failures };
    },
  },
  {
    id: "ietf-pinned-tls",
    framework: "IETF RFC 8446",
    authority: "IETF",
    title: "TLS protocol versions are pinned",
    description: "Unpinned or default TLS contexts may negotiate vulnerable protocol versions.",
    recommendation: "Pin TLS contexts to PROTOCOL_TLS_SERVER and set minimum_version=TLSv1_3.",
    evaluate(input) {
      const findings = input.repoFindings.filter((f) => f.kind.includes("Unpinned TLS protocol"));
      const failingRepos = new Set(findings.map((f) => f.repo));
      const evaluatedRepos = allRepos(input);
      const total = evaluatedRepos.size;
      const failures = failingRepos.size;
      const score = pct(total - failures, total);
      return { state: stateFromScore(score), score, evaluated: total, failures };
    },
  },
];

export function evaluateCompliance(input: ComplianceInput): { frameworks: ComplianceStat[]; summary: ComplianceSummary } {
  // Evaluate every control.
  const controlResults: ComplianceControl[] = CONTROLS.map((def) => ({
    ...def,
    ...def.evaluate(input),
  }));

  // Group by framework.
  const byFramework = new Map<string, ComplianceStat>();
  for (const c of controlResults) {
    if (!byFramework.has(c.framework)) {
      byFramework.set(c.framework, {
        framework: c.framework,
        authority: c.authority,
        desc: frameworkDesc(c.framework),
        progress: 0,
        mapped: 0,
        atRisk: 0,
        controls: [],
      });
    }
    byFramework.get(c.framework)!.controls.push(c);
  }

  const frameworks: ComplianceStat[] = [];
  for (const f of byFramework.values()) {
    const scores = f.controls.map((c: ComplianceControl) => c.score);
    f.progress = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
    frameworks.push(f);
  }

  // Compute per-framework mapped / at-risk assets with asset-level precision.
  const repoSet = new Set(input.repos && input.repos.length > 0 ? input.repos : input.repoFindings.map((x) => x.repo));
  const tlsHostSet = new Set(input.tlsScans.map((x) => x.host));
  const certHostSet = new Set(input.certScans.map((x) => x.host));

  for (const f of frameworks) {
    if (f.framework === "NSA CNSA 2.0") {
      f.mapped = tlsHostSet.size;
      const badHosts = new Set<string>();
      for (const s of input.tlsScans) {
        const noHybrid = !/MLKEM|X25519MLKEM/i.test(s.curve);
        const legacy = /TLS\s*1\.[01]/.test(s.version) || /TLS_RSA|RSA/i.test(s.cipher);
        if (noHybrid || legacy) badHosts.add(s.host);
      }
      f.atRisk = badHosts.size;
    } else if (f.framework === "CISA KEM Guidance") {
      f.mapped = certHostSet.size;
      f.atRisk = input.certScans.filter((c) => c.urgency === "renew").length;
    } else {
      // Code-side frameworks: NIST FIPS 140-3, IETF RFC 8446.
      f.mapped = repoSet.size;
      const badRepos = new Set<string>();
      for (const c of f.controls) {
        const kinds: string[] = [];
        if (c.id === "nist-no-rsa-keygen") kinds.push("RSA key generation", "RSA encryption", "Static RSA cipher suite");
        if (c.id === "nist-no-legacy-ciphers") kinds.push("Legacy TLS 1.0/1.1", "3DES", "Finite-field DH/DSA 1024");
        if (c.id === "nist-no-weak-digests") kinds.push("SHA-1 usage", "MD5 digest");
        if (c.id === "ietf-pinned-tls") kinds.push("Unpinned TLS protocol");
        for (const finding of input.repoFindings) {
          if (kinds.some((k) => finding.kind.includes(k))) badRepos.add(finding.repo);
        }
      }
      f.atRisk = badRepos.size;
    }
  }

  // Overall summary.
  const allControls = frameworks.flatMap((f) => f.controls);
  const totalControls = allControls.length;
  const passedControls = allControls.filter((c) => c.state === "passed").length;
  const allAssets = new Set<string>();
  repoSet.forEach((r) => allAssets.add("repo:" + r));
  tlsHostSet.forEach((h) => allAssets.add("tls:" + h));
  certHostSet.forEach((h) => allAssets.add("cert:" + h));

  const allAtRisk = new Set<string>();
  for (const f of frameworks) {
    if (f.framework === "NSA CNSA 2.0") {
      for (const s of input.tlsScans) {
        const noHybrid = !/MLKEM|X25519MLKEM/i.test(s.curve);
        const legacy = /TLS\s*1\.[01]/.test(s.version) || /TLS_RSA|RSA/i.test(s.cipher);
        if (noHybrid || legacy) allAtRisk.add("tls:" + s.host);
      }
    } else if (f.framework === "CISA KEM Guidance") {
      for (const c of input.certScans) {
        if (c.urgency === "renew") allAtRisk.add("cert:" + c.host);
      }
    } else {
      const badRepos = new Set<string>();
      for (const c of f.controls) {
        const kinds: string[] = [];
        if (c.id === "nist-no-rsa-keygen") kinds.push("RSA key generation", "RSA encryption", "Static RSA cipher suite");
        if (c.id === "nist-no-legacy-ciphers") kinds.push("Legacy TLS 1.0/1.1", "3DES", "Finite-field DH/DSA 1024");
        if (c.id === "nist-no-weak-digests") kinds.push("SHA-1 usage", "MD5 digest");
        if (c.id === "ietf-pinned-tls") kinds.push("Unpinned TLS protocol");
        for (const finding of input.repoFindings) {
          if (kinds.some((k) => finding.kind.includes(k))) badRepos.add(finding.repo);
        }
      }
      badRepos.forEach((r) => allAtRisk.add("repo:" + r));
    }
  }
  const overallProgress = frameworks.length
    ? Math.round(frameworks.reduce((s, f) => s + f.progress, 0) / frameworks.length)
    : 0;

  return {
    frameworks,
    summary: {
      overallProgress,
      totalControls,
      passedControls,
      atRiskAssets: allAtRisk.size,
      totalAssets: allAssets.size,
    },
  };
}

function frameworkDesc(framework: string): string {
  switch (framework) {
    case "NIST FIPS 140-3":
      return "Approved cryptographic modules and algorithms";
    case "NSA CNSA 2.0":
      return "Commercial National Security Algorithm Suite 2.0";
    case "CISA KEM Guidance":
      return "Post-quantum key encapsulation migration readiness";
    case "IETF RFC 8446":
      return "TLS 1.3 protocol configuration best practices";
    default:
      return "Quantum-safe compliance posture";
  }
}
