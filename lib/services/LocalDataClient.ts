// ============================================================
// LocalDataClient.ts — serves dashboard data computed from real
// scans stored in SQLite: repo scans, TLS scans, cert scans.
// Implements SplunkClient so callers treat it as a transparent
// data source.
// ============================================================
import { getDb } from "@/lib/db";
import type { SplunkClient, RiskSummary, TlsConnection, Certificate, HndlAnomaly, ComplianceStat } from "@/lib/splunk/SplunkClient";
import { listHndlAnomalies } from "./HndlDetector";
import { evaluateCompliance, type ComplianceInput } from "./compliance";
import type { AlgoMixItem, CodeRollup, FindingDetail, IngestResult, Org, OrgPlan, RepoSeed, RoadmapPhase, ScanResult, TopAsset } from "@/lib/types";
import type { SplunkSearchResult } from "@/lib/splunk/SplunkSearchClient";

export class LocalDataClient implements SplunkClient {
  readonly enabled = true;

  private db() {
    return getDb();
  }

  async sendFindings(result: ScanResult): Promise<IngestResult> {
    const detail = Array.isArray(result.detail) ? result.detail : [];
    this.db().prepare(`
      INSERT INTO scans (target, provider, lang, branch, loc, owner, grade, findings, critical, high, monitor, scanned, file_count, risk, detail_json, files_json, last_commit, real)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      result.repo,
      result.provider,
      result.lang,
      result.branch,
      result.loc,
      result.owner,
      result.grade,
      result.findings,
      result.critical,
      result.high,
      result.monitor,
      result.scanned,
      result.fileCount,
      result.risk,
      JSON.stringify(detail),
      JSON.stringify(result.files ?? []),
      result.lastCommit,
      result.real ? 1 : 0
    );
    return { sent: detail.length, ok: true };
  }

  async query(): Promise<SplunkSearchResult> {
    return { fields: [], results: [] };
  }

  async getRiskSummary(): Promise<RiskSummary | null> {
    const scanRows = this.db().prepare(`
      SELECT
        COALESCE(SUM(critical), 0) AS critical,
        COALESCE(SUM(high), 0) AS high,
        COALESCE(SUM(monitor), 0) AS monitor,
        COALESCE(SUM(findings), 0) AS total
      FROM scans
    `).get() as any;

    const tlsRows = this.db().prepare(`
      SELECT risk, COUNT(*) AS c FROM tls_scans GROUP BY risk
    `).all() as any[];

    const certRows = this.db().prepare(`
      SELECT urgency, COUNT(*) AS c FROM cert_scans GROUP BY urgency
    `).all() as any[];

    const inventoryCount = this.db().prepare(`SELECT COUNT(DISTINCT host) AS n FROM tls_scans`).get() as any;

    const critical = Number(scanRows.critical || 0) + (tlsRows.find((r) => r.risk === "critical")?.c || 0) + (certRows.find((r) => r.urgency === "renew")?.c || 0);
    const high = Number(scanRows.high || 0) + (tlsRows.find((r) => r.risk === "high")?.c || 0) + (certRows.find((r) => r.urgency === "plan")?.c || 0);
    const monitor = Number(scanRows.monitor || 0) + (tlsRows.find((r) => r.risk === "monitor")?.c || 0) + (certRows.find((r) => r.urgency === "monitor")?.c || 0);
    const safe = (tlsRows.find((r) => r.risk === "safe")?.c || 0) + (certRows.find((r) => r.urgency === "done")?.c || 0);

    const total = critical + high + monitor + safe;
    if (total === 0) return null;

    const rawScore = Math.round(((safe * 0 + monitor * 33 + high * 66 + critical * 100) / total));
    const riskScore = Math.max(0, Math.min(100, rawScore));
    const riskBand = riskScore >= 75 ? "Critical" : riskScore >= 50 ? "High" : riskScore >= 25 ? "Monitor" : "Low";

    return {
      riskScore,
      riskBand,
      breakdown: [
        { key: "critical", value: critical },
        { key: "high", value: high },
        { key: "monitor", value: monitor },
        { key: "safe", value: safe },
      ],
      endpointsScanned: Number(inventoryCount.n || 0),
      connectionsObserved: 0,
      certsTracked: Number(certRows.reduce((s, r) => s + r.c, 0)),
      coverage: 0,
    };
  }

  async getInventory(filters?: { risk?: string; version?: string; cipher?: string }): Promise<TlsConnection[] | null> {
    let sql = "SELECT * FROM tls_scans WHERE 1=1";
    const params: any[] = [];
    if (filters?.risk) { sql += " AND risk = ?"; params.push(filters.risk); }
    if (filters?.version) { sql += " AND version = ?"; params.push(filters.version); }
    if (filters?.cipher) { sql += " AND cipher LIKE ?"; params.push(`%${filters.cipher}%`); }
    sql += " ORDER BY created_at DESC LIMIT 200";
    const rows = this.db().prepare(sql).all(...params) as any[];
    if (rows.length === 0) return null;
    return rows.map((r) => ({
      server: r.host,
      src: r.src,
      dst: r.dst,
      version: r.version,
      cipher: r.cipher,
      curve: r.curve,
      risk: r.risk,
      hosts: r.hosts,
      seen: r.seen,
    }));
  }

  async getCertificates(): Promise<Certificate[] | null> {
    const rows = this.db().prepare("SELECT * FROM cert_scans ORDER BY expiry ASC LIMIT 200").all() as any[];
    if (rows.length === 0) return null;
    return rows.map((r) => ({
      subject: r.subject,
      alg: r.alg,
      bits: r.bits,
      expiry: r.expiry,
      issuer: r.issuer,
      urgency: r.urgency,
    }));
  }

  async getHndlAnomalies(): Promise<HndlAnomaly[] | null> {
    const rows = listHndlAnomalies();
    if (rows.length === 0) return null;
    return rows;
  }

  async getComplianceStats(): Promise<ComplianceStat[] | null> {
    // Gather all scanned repos (including clean ones) and their findings.
    const allRepos = this.db().prepare(`SELECT DISTINCT target AS repo FROM scans WHERE target IS NOT NULL AND target != ''`).all() as any[];
    const repoRows = this.db().prepare(`
      SELECT target AS repo, json_extract(value, '$.kind') AS kind, json_extract(value, '$.sev') AS sev
      FROM scans, json_each(scans.detail_json)
      WHERE json_extract(value, '$.kind') IS NOT NULL
    `).all() as any[];

    // Gather TLS scans.
    const tlsRows = this.db().prepare(`
      SELECT DISTINCT host, version, cipher, curve, risk
      FROM tls_scans
      WHERE host IS NOT NULL AND host != ''
    `).all() as any[];

    // Gather certificate scans.
    const certRows = this.db().prepare(`
      SELECT DISTINCT host, urgency
      FROM cert_scans
      WHERE host IS NOT NULL AND host != ''
    `).all() as any[];

    if (allRepos.length === 0 && tlsRows.length === 0 && certRows.length === 0) return null;

    const input: ComplianceInput = {
      repos: allRepos.map((r) => String(r.repo)),
      repoFindings: repoRows.map((r) => ({ repo: String(r.repo), kind: String(r.kind), sev: String(r.sev) as any })),
      tlsScans: tlsRows.map((r) => ({ host: String(r.host), version: String(r.version), cipher: String(r.cipher), curve: String(r.curve), risk: String(r.risk) })),
      certScans: certRows.map((r) => ({ host: String(r.host), urgency: String(r.urgency) as any })),
    };

    return evaluateCompliance(input).frameworks;
  }

  async getAlgoMix(): Promise<AlgoMixItem[] | null> {
    const rows = this.db().prepare(`
      SELECT
        CASE
          WHEN cipher LIKE '%RSA%' THEN 'RSA key exchange'
          WHEN version IN ('TLS 1.0','TLS 1.1') THEN 'Legacy TLS 1.0/1.1'
          WHEN curve LIKE '%MLKEM%' OR curve LIKE '%X25519MLKEM%' THEN 'TLS 1.3 + ML-KEM'
          WHEN curve = 'secp384r1' THEN 'ECDHE · secp384r1'
          WHEN curve = 'secp256r1' THEN 'ECDHE · secp256r1'
          ELSE 'TLS 1.2 · ECDHE'
        END AS algo,
        risk,
        COUNT(*) AS c
      FROM tls_scans
      GROUP BY algo, risk
    `).all() as any[];
    if (rows.length === 0) return null;
    const total = rows.reduce((s, r) => s + r.c, 0);
    return rows.map((r) => ({
      algo: r.algo,
      pct: Math.round((r.c / total) * 100),
      risk: r.risk,
    }));
  }

  async getTopAssets(): Promise<TopAsset[] | null> {
    const rows = this.db().prepare(`
      SELECT t.host, t.risk, t.version, t.cipher, t.curve, t.hosts, d.sensitivity, d.txns_day
      FROM tls_scans t
      LEFT JOIN domains d ON d.host = t.host
      ORDER BY
        CASE t.risk WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'monitor' THEN 2 ELSE 3 END,
        t.created_at DESC
      LIMIT 10
    `).all() as any[];
    if (rows.length === 0) return null;
    return rows.map((r) => ({
      name: r.host,
      risk: r.risk,
      algo: r.cipher || r.version,
      hosts: r.hosts || 1,
      txns: r.txns_day || "—",
      sensitivity: r.sensitivity || "—",
    }));
  }

  async getRiskTrend(): Promise<number[] | null> {
    const rows = this.db().prepare(`
      SELECT DATE(created_at) AS day, AVG(risk) AS score
      FROM scans
      WHERE risk IS NOT NULL
      GROUP BY day
      ORDER BY day
      LIMIT 12
    `).all() as any[];
    if (rows.length === 0) return null;
    return rows.map((r) => Math.round(Number(r.score || 0)));
  }

  async getHndlTimeline(): Promise<number[] | null> {
    const anomalies = listHndlAnomalies();
    if (anomalies.length === 0) return null;
    // Build a synthetic 48-hour timeline. Recent hours are elevated based on
    // the number and severity of anomalies.
    const timeline: number[] = [];
    const baseLoad = anomalies.length * 0.8;
    for (let i = 0; i < 48; i++) {
      const proximity = 1 - Math.abs(i - 42) / 48; // spike around the last 6h
      const severity = anomalies.reduce((s, a) => s + a.deviation, 0) / anomalies.length;
      const v = Math.round((baseLoad + proximity * severity * 5 + Math.random() * 3) * 10) / 10;
      timeline.push(v);
    }
    return timeline;
  }

  async getRoadmap(): Promise<RoadmapPhase[] | null> {
    const rows = this.db().prepare(`
      SELECT target,
        MAX(grade) AS grade,
        MAX(lang) AS lang,
        MAX(loc) AS loc,
        SUM(critical) AS critical,
        SUM(high) AS high,
        SUM(monitor) AS monitor
      FROM scans
      GROUP BY target
      ORDER BY critical DESC, high DESC, MAX(created_at) DESC
      LIMIT 20
    `).all() as any[];
    if (rows.length === 0) return null;

    const parseFiles = (loc?: string | null) => {
      const m = String(loc || "").match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    };

    const effort = (r: any) => {
      const files = parseFiles(r.loc);
      const days = Math.max(1, Math.min(20, Math.ceil((r.critical || 0) * 0.5 + (r.high || 0) * 0.2 + files / 800)));
      return `${days} day${days === 1 ? "" : "s"}`;
    };

    const action = (r: any) => {
      if (r.critical >= 6) {
        const extra = r.high > 0 ? ` + ${r.high} high` : "";
        return `Audit and replace ${r.critical} critical${extra} crypto patterns`;
      }
      if (r.critical > 0) {
        const extra = r.high > 0 ? ` and ${r.high} high` : "";
        return `Replace ${r.critical} critical${extra} quantum-vulnerable calls`;
      }
      if (r.high >= 6) return `Refactor ${r.high} high-risk crypto uses`;
      return `Update ${r.high} high-risk crypto call${(r.high || 0) === 1 ? "" : "s"}`;
    };

    const impact = (r: any) => {
      if (r.critical > 0) {
        const parts = [`${r.critical} critical`];
        if (r.high > 0) parts.push(`${r.high} high`);
        return `Eliminates ${parts.join(" and ")} quantum-vulnerable path${r.critical + (r.high || 0) === 1 ? "" : "s"}`;
      }
      return `Reduces ${r.high} high-risk exposure${r.high === 1 ? "" : "s"}`;
    };

    const why = (r: any) => {
      const lang = r.lang ? `${r.lang} repo` : "Repo";
      return `${lang} graded ${r.grade || "—"} · ${r.critical || 0} critical, ${r.high || 0} high, ${r.monitor || 0} monitor findings`;
    };

    const criticalItems = rows
      .filter((r) => r.critical > 0)
      .slice(0, 5)
      .map((r) => ({
        asset: r.target,
        action: action(r),
        effort: effort(r),
        impact: impact(r),
        why: why(r),
      }));

    const highItems = rows
      .filter((r) => r.high > 0 && r.critical === 0)
      .slice(0, 5)
      .map((r) => ({
        asset: r.target,
        action: action(r),
        effort: effort(r),
        impact: impact(r),
        why: why(r),
      }));

    const phases: RoadmapPhase[] = [];
    if (criticalItems.length > 0) {
      phases.push({
        phase: "Phase 1 · Critical repos",
        window: "Now",
        tone: "crit" as const,
        items: criticalItems,
      });
    }
    if (highItems.length > 0) {
      phases.push({
        phase: "Phase 2 · High-priority repos",
        window: "Next",
        tone: "high" as const,
        items: highItems,
      });
    }
    return phases.length > 0 ? phases : null;
  }

  async getOrgs(): Promise<Org[] | null> {
    const rows = this.db().prepare(`
      SELECT provider, owner, COUNT(*) AS repos
      FROM scans
      GROUP BY provider, owner
    `).all() as any[];
    if (rows.length === 0) return null;
    return rows.map((r) => ({
      id: `${r.provider}-${r.owner || "unknown"}`,
      provider: r.provider || "github",
      name: r.owner || "unknown",
      repos: r.repos,
      scanned: r.repos,
      lastScan: "just now",
      status: "connected" as const,
      stars: "—",
      members: 0,
    }));
  }

  async getRepos(): Promise<RepoSeed[] | null> {
    const rows = this.db().prepare("SELECT * FROM scans ORDER BY created_at DESC LIMIT 200").all() as any[];
    if (rows.length === 0) return null;
    return rows.map((r) => ({
      repo: r.target,
      provider: r.provider,
      lang: r.lang,
      loc: r.loc,
      grade: r.grade,
      findings: r.findings,
      critical: r.critical,
      high: r.high,
      monitor: r.monitor,
      lastCommit: r.last_commit,
      branch: r.branch,
      owner: r.owner,
      detail: JSON.parse(r.detail_json || "[]") as FindingDetail[],
    }));
  }

  async getCodeRollup(): Promise<CodeRollup | null> {
    const row = this.db().prepare(`
      SELECT
        COUNT(*) AS reposScanned,
        SUM(findings) AS findings,
        SUM(critical) AS critical,
        SUM(high) AS high,
        SUM(monitor) AS monitor
      FROM scans
    `).get() as any;
    if (!row || row.findings === 0) return null;

    const byLang = this.db().prepare(`
      SELECT lang, SUM(findings) AS c FROM scans WHERE lang IS NOT NULL GROUP BY lang
    `).all() as any[];

    const patterns = this.db().prepare(`
      SELECT json_extract(value, '$.kind') AS pattern, json_extract(value, '$.sev') AS sev, COUNT(*) AS c
      FROM scans, json_each(detail_json)
      GROUP BY pattern, sev
    `).all() as any[];

    return {
      reposScanned: row.reposScanned,
      reposTotal: row.reposScanned,
      filesScanned: 0,
      findings: row.findings,
      critical: row.critical,
      high: row.high,
      monitor: row.monitor,
      fixablePR: 0,
      avgGrade: "D+",
      byLang: byLang.map((r) => ({ lang: r.lang, findings: r.c, color: "var(--warn)" })),
      patterns: patterns.map((r) => ({ pattern: r.pattern, count: r.c, sev: r.sev })),
    };
  }

  async getOrgPlan(org: string): Promise<OrgPlan | null> {
    const rows = this.db().prepare(`SELECT * FROM scans ORDER BY critical DESC, high DESC LIMIT 20`).all() as any[];
    if (rows.length === 0) return null;
    return {
      org,
      generated: "just now",
      summary: `Org ${org} has ${rows.reduce((s, r) => s + r.findings, 0)} findings across ${rows.length} scanned repositories.`,
      posture: "D+",
      targetPosture: "A-",
      weeks: 12,
      streams: [
        {
          title: "Critical findings",
          tone: "crit" as const,
          window: "Week 1",
          actions: rows.filter((r) => r.critical > 0).map((r) => ({
            repo: r.target,
            task: `Fix ${r.critical} critical crypto findings`,
            pr: "draft",
            effort: "2d",
          })),
        },
        {
          title: "High findings",
          tone: "high" as const,
          window: "Weeks 2-4",
          actions: rows.filter((r) => r.high > 0 && r.critical === 0).map((r) => ({
            repo: r.target,
            task: `Fix ${r.high} high crypto findings`,
            pr: "draft",
            effort: "3d",
          })),
        },
      ],
    };
  }
}
