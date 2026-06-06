// ============================================================
// splunk/HecSplunkClient.ts — pushes findings to Splunk HEC
// and reads posture data via Splunk REST Search API.
// ============================================================
import { config } from "../config";
import type { IngestResult, ScanResult } from "../types";
import type { SplunkClient, RiskSummary, TlsConnection, Certificate, HndlAnomaly, ComplianceStat, RiskTier } from "./SplunkClient";
import { SplunkSearchClient } from "./SplunkSearchClient";

export class HecSplunkClient implements SplunkClient {
  readonly enabled = true;
  readonly search: SplunkSearchClient;

  constructor() {
    this.search = new SplunkSearchClient();
  }

  async query(search: string, maxCount?: number) {
    return this.search.query(search, { maxCount });
  }

  async sendFindings(result: ScanResult): Promise<IngestResult> {
    if (result.detail.length === 0) return { sent: 0, ok: true };
    const now = Date.now() / 1000;
    const events = result.detail.map((f) => ({
      time: now,
      host: result.provider,
      source: "cam:scanner",
      sourcetype: "cam:crypto_finding",
      index: config.splunk.indexSource,
      event: { repo: result.repo, provider: result.provider, grade: result.grade, ...f },
    }));
    const body = events.map((e) => JSON.stringify(e)).join("\n");
    try {
      const res = await fetch(`${config.splunk.hecUrl}/services/collector/event`, {
        method: "POST",
        headers: { Authorization: `Splunk ${config.splunk.hecToken}` },
        body,
      });
      return { sent: events.length, ok: res.ok, reason: res.ok ? undefined : "HEC " + res.status };
    } catch (e: any) {
      return { sent: 0, ok: false, reason: e?.message || "HEC error" };
    }
  }

  async getRiskSummary(): Promise<RiskSummary | null> {
    if (!this.search.enabled) return null;
    const src = config.splunk.indexSource;
    const [findingsRes, netRes, pkiRes] = await Promise.all([
      this.search.query(`| index=${src} sourcetype=cam:crypto_finding earliest=-30d | stats count by sev`, { earliest: "-30d" }),
      this.search.query(`| index=${config.splunk.indexes.net} sourcetype=cam:tls_connection earliest=-7d | stats count by risk`, { earliest: "-7d" }),
      this.search.query(`| index=${config.splunk.indexes.pki} sourcetype=cam:cert | stats count by urgency`, { earliest: "-1y" }),
    ]);

    const bySev: Record<string, number> = {};
    for (const r of findingsRes.results) bySev[r.sev] = Number(r.count || 0);

    const byNetRisk: Record<string, number> = {};
    for (const r of netRes.results) byNetRisk[r.risk] = Number(r.count || 0);

    const byUrgency: Record<string, number> = {};
    for (const r of pkiRes.results) byUrgency[r.urgency] = Number(r.count || 0);

    const critical = (bySev.critical || 0) + (byNetRisk.critical || 0) + (byUrgency.renew || 0);
    const high = (bySev.high || 0) + (byNetRisk.high || 0) + (byUrgency.plan || 0);
    const monitor = (bySev.monitor || 0) + (byNetRisk.monitor || 0) + (byUrgency.monitor || 0);
    const safe = (byNetRisk.safe || 0) + (byUrgency.done || 0);

    const total = critical + high + monitor + safe || 1;
    const rawScore = Math.round(((safe * 0 + monitor * 33 + high * 66 + critical * 100) / total));
    const riskScore = Math.max(0, Math.min(100, rawScore));
    const riskBand = riskScore >= 75 ? "Critical" : riskScore >= 50 ? "High" : riskScore >= 25 ? "Monitor" : "Low";

    const breakdown: { key: RiskTier; value: number }[] = [
      { key: "critical", value: critical },
      { key: "high", value: high },
      { key: "monitor", value: monitor },
      { key: "safe", value: safe },
    ];

    return { riskScore, riskBand, breakdown };
  }

  async getInventory(filters?: { risk?: string; version?: string; cipher?: string }): Promise<TlsConnection[] | null> {
    if (!this.search.enabled) return null;
    const idx = config.splunk.indexes.net;
    let spl = `| index=${idx} sourcetype=cam:tls_connection earliest=-7d | sort - _time | head 200`;
    const wheres: string[] = [];
    if (filters?.risk) wheres.push(`risk="${filters.risk}"`);
    if (filters?.version) wheres.push(`version="${filters.version}"`);
    if (filters?.cipher) wheres.push(`cipher="${filters.cipher}"`);
    if (wheres.length) spl = `| index=${idx} sourcetype=cam:tls_connection earliest=-7d | search ${wheres.join(" AND ")} | sort - _time | head 200`;
    const res = await this.search.query(spl, { earliest: "-7d", maxCount: 200 });
    return res.results.map((r) => ({
      server: String(r.server || ""),
      src: String(r.src || ""),
      dst: String(r.dst || ""),
      version: String(r.version || ""),
      cipher: String(r.cipher || ""),
      curve: String(r.curve || ""),
      risk: (String(r.risk || "monitor") as RiskTier),
      hosts: Number(r.hosts || 1),
      seen: String(r.seen || ""),
      _time: String(r._time || ""),
    }));
  }

  async getCertificates(): Promise<Certificate[] | null> {
    if (!this.search.enabled) return null;
    const idx = config.splunk.indexes.pki;
    const spl = `| index=${idx} sourcetype=cam:cert | eval days_left=round((expiry_epoch - now())/86400,0) | sort days_left | head 200`;
    const res = await this.search.query(spl, { earliest: "-1y", maxCount: 200 });
    return res.results.map((r) => ({
      subject: String(r.subject || ""),
      alg: String(r.alg || ""),
      bits: r.bits ? Number(r.bits) : null,
      expiry: Number(r.expiry || r.days_left || 0),
      issuer: String(r.issuer || ""),
      urgency: (String(r.urgency || "plan") as Certificate["urgency"]),
      _time: String(r._time || ""),
    }));
  }

  async getHndlAnomalies(): Promise<HndlAnomaly[] | null> {
    if (!this.search.enabled) return null;
    const idx = config.splunk.indexes.hndl;
    const spl = `| index=${idx} sourcetype=cam:hndl_event | sort - deviation | head 50`;
    const res = await this.search.query(spl, { earliest: "-7d", maxCount: 50 });
    return res.results.map((r) => ({
      dst: String(r.dst || ""),
      asn: String(r.asn || ""),
      geo: String(r.geo || ""),
      volume: String(r.volume || ""),
      baseline: String(r.baseline || ""),
      deviation: Number(r.deviation || 0),
      sessions: Number(r.sessions || 0),
      window: String(r.window || ""),
      status: (String(r.status || "watch") as HndlAnomaly["status"]),
      note: String(r.note || ""),
      _time: String(r._time || ""),
    }));
  }

  async getComplianceStats(): Promise<ComplianceStat[] | null> {
    if (!this.search.enabled) return null;
    const idx = config.splunk.indexSource;
    const spl = `| index=${idx} sourcetype=cam:crypto_finding earliest=-90d | lookup cam_compliance_mapping rule OUTPUT framework, authority, desc | stats count by framework, authority, desc | eval progress=0, mapped=count, atRisk=count`;
    const res = await this.search.query(spl, { earliest: "-90d", maxCount: 50 });
    if (res.results.length === 0) return null;
    return res.results.map((r) => ({
      framework: String(r.framework || ""),
      authority: String(r.authority || ""),
      desc: String(r.desc || ""),
      progress: Number(r.progress || 0),
      mapped: Number(r.mapped || 0),
      atRisk: Number(r.atRisk || 0),
    }));
  }
}
