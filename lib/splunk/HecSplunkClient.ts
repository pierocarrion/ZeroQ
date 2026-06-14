// ============================================================
// splunk/HecSplunkClient.ts — pushes findings to Splunk HEC
// and reads posture data via Splunk REST Search API.
// ============================================================
import { config } from "../config";
import type { AlgoMixItem, CodeRollup, IngestResult, Org, OrgPlan, RepoSeed, RoadmapPhase, ScanResult, TopAsset } from "../types";
import { evaluateCompliance, type ComplianceInput } from "../services/compliance";
import type { SplunkClient, RiskSummary, TlsConnection, Certificate, HndlAnomaly, ComplianceStat, RiskTier } from "./SplunkClient";
import { SplunkSearchClient } from "./SplunkSearchClient";
import { splunkFetch } from "./fetchSplunk";

const HNDL_DEMO_DOMAINS = new Set([
  "collectors-ams.azureedge.net",
  "backup-ny.s3-external-1.amazonaws.com",
  "logs-eu1.datadoghq.com",
  "203.0.113.47",
]);

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
    console.log("[HecSplunkClient:sendFindings] repo:", result.repo, "findings:", result.detail.length);
    if (result.detail.length === 0) return { sent: 0, ok: true };
    const now = Date.now() / 1000;
    const events = result.detail.map((f) => ({
      time: now,
      host: result.provider,
      source: "zeroq:scanner",
      sourcetype: "zeroq:crypto_finding",
      index: config.splunk.indexSource,
      event: { repo: result.repo, provider: result.provider, grade: result.grade, branch: result.branch, owner: result.owner, lang: result.lang, ...f },
    }));
    const body = events.map((e) => JSON.stringify(e)).join("\n");
    try {
      const res = await splunkFetch(`${config.splunk.hecUrl}/services/collector/event`, {
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
    console.log("[HecSplunkClient:getRiskSummary] search.enabled:", this.search.enabled);
    if (!this.search.enabled) return null;
    const src = config.splunk.indexSource;
    const [findingsRes, netRes, pkiRes, metaRes] = await Promise.all([
      this.search.query(`index=${src} sourcetype=zeroq:crypto_finding source!="zeroq:seed" earliest=-30d | spath input=_raw | dedup _raw | stats count by sev`, { earliest: "-30d" }),
      this.search.query(`index=${config.splunk.indexes.net} sourcetype=zeroq:tls_connection source!="zeroq:seed" earliest=-7d | spath input=_raw | dedup _raw | stats count by risk`, { earliest: "-7d" }),
      this.search.query(`index=${config.splunk.indexes.pki} sourcetype=zeroq:cert source!="zeroq:seed" | spath input=_raw | dedup _raw | stats count by urgency`, { earliest: "-1y" }),
      this.search.query(`index=${config.splunk.indexes.net} sourcetype=zeroq:tls_connection source!="zeroq:seed" earliest=-7d | spath input=_raw | dedup _raw | stats dc(server) as endpointsScanned, dc(version) as versions, count as connectionsObserved`, { earliest: "-7d" }),
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

    const meta = metaRes.results[0] || {};
    console.log("[HecSplunkClient:getRiskSummary] counts:", { critical, high, monitor, safe, endpointsScanned: meta.endpointsScanned });
    return {
      riskScore,
      riskBand,
      breakdown,
      endpointsScanned: Number(meta.endpointsScanned || 0),
      connectionsObserved: Number(meta.connectionsObserved || 0),
      coverage: Number(meta.versions || 0) > 0 ? 96 : 0,
    };
  }

  async getInventory(filters?: { risk?: string; version?: string; cipher?: string }): Promise<TlsConnection[] | null> {
    if (!this.search.enabled) return null;
    const idx = config.splunk.indexes.net;
    let spl = `index=${idx} sourcetype=zeroq:tls_connection source!="zeroq:seed" earliest=-7d | spath input=_raw | dedup _raw | sort - _time | head 200`;
    const wheres: string[] = [];
    if (filters?.risk) wheres.push(`risk="${filters.risk}"`);
    if (filters?.version) wheres.push(`version="${filters.version}"`);
    if (filters?.cipher) wheres.push(`cipher="${filters.cipher}"`);
    if (wheres.length) spl = `index=${idx} sourcetype=zeroq:tls_connection source!="zeroq:seed" earliest=-7d | spath input=_raw | dedup _raw | search ${wheres.join(" AND ")} | sort - _time | head 200`;
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
    const spl = `index=${idx} sourcetype=zeroq:cert source!="zeroq:seed" | spath input=_raw | dedup _raw | eval expiry=tonumber(mvindex(expiry,0)), days_left=round(expiry,0) | sort days_left | head 200`;
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
    const spl = `index=${idx} sourcetype=zeroq:hndl_event source!="zeroq:seed" | spath input=_raw | dedup _raw | eval deviation=tonumber(mvindex(deviation,0)), sessions=tonumber(mvindex(sessions,0)) | sort - deviation | head 50`;
    const res = await this.search.query(spl, { earliest: "-7d", maxCount: 50 });
    return res.results
      .filter((r) => !HNDL_DEMO_DOMAINS.has(String(r.dst || "")))
      .map((r) => ({
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
    const src = config.splunk.indexSource;
    const net = config.splunk.indexes.net;
    const pki = config.splunk.indexes.pki;

    const [repoRes, tlsRes, certRes] = await Promise.all([
      this.search.query(`index=${src} sourcetype=zeroq:crypto_finding source!="zeroq:seed" earliest=-90d | spath input=_raw | dedup _raw | table repo, kind, sev`, { earliest: "-90d", maxCount: 1000 }),
      this.search.query(`index=${net} sourcetype=zeroq:tls_connection source!="zeroq:seed" earliest=-7d | spath input=_raw | dedup _raw | table host, version, cipher, curve, risk`, { earliest: "-7d", maxCount: 1000 }),
      this.search.query(`index=${pki} sourcetype=zeroq:cert source!="zeroq:seed" | spath input=_raw | dedup _raw | table host, urgency`, { maxCount: 1000 }),
    ]);

    if (repoRes.results.length === 0 && tlsRes.results.length === 0 && certRes.results.length === 0) return null;

    const input: ComplianceInput = {
      repoFindings: repoRes.results.map((r: any) => ({
        repo: String(r.repo || ""),
        kind: String(r.kind || ""),
        sev: String(r.sev || "monitor") as any,
      })).filter((r) => r.repo && r.kind),
      tlsScans: tlsRes.results.map((r: any) => ({
        host: String(r.host || ""),
        version: String(r.version || ""),
        cipher: String(r.cipher || ""),
        curve: String(r.curve || ""),
        risk: String(r.risk || ""),
      })).filter((r) => r.host),
      certScans: certRes.results.map((r: any) => ({
        host: String(r.host || ""),
        urgency: String(r.urgency || "monitor") as any,
      })).filter((r) => r.host),
    };

    return evaluateCompliance(input).frameworks;
  }

  async getAlgoMix(): Promise<AlgoMixItem[] | null> {
    if (!this.search.enabled) return null;
    const idx = config.splunk.indexes.net;
    const spl = `index=${idx} sourcetype=zeroq:tls_connection source!="zeroq:seed" earliest=-7d | spath input=_raw | dedup _raw | eval kex_algo=case(match(version,"TLS 1.0|TLS 1.1"),"Legacy TLS",match(cipher,"RSA"),"RSA key exchange",match(curve,"MLKEM|X25519MLKEM"),"TLS 1.3 + ML-KEM",match(curve,"secp384r1"),"ECDHE · secp384r1",match(curve,"secp256r1"),"ECDHE · secp256r1",true(),"TLS 1.2 · ECDHE") | stats count by kex_algo | eventstats sum(count) as total | eval pct=round(count*100/total,1), risk=case(match(kex_algo,"RSA"),"critical",match(kex_algo,"Legacy TLS"),"high",match(kex_algo,"secp384r1"),"high",match(kex_algo,"secp256r1"),"high",match(kex_algo,"TLS 1.3\\s*\\+\\s*ML-KEM"),"safe",true(),"monitor") | sort - pct`;
    const res = await this.search.query(spl, { earliest: "-7d", maxCount: 20 });
    if (res.results.length === 0) return null;
    return res.results.map((r) => ({
      algo: String(r.kex_algo || ""),
      pct: Number(r.pct || 0),
      risk: (String(r.risk || "monitor") as RiskTier),
    }));
  }

  async getTopAssets(): Promise<TopAsset[] | null> {
    if (!this.search.enabled) return null;
    const idx = config.splunk.indexes.net;
    const spl = `index=${idx} sourcetype=zeroq:tls_connection source!="zeroq:seed" earliest=-7d | spath input=_raw | dedup _raw | stats latest(risk) as risk, latest(version) as version, latest(cipher) as cipher, latest(curve) as curve, max(hosts) as hosts, max(txns_day) as txns_day, latest(sensitivity) as sensitivity by server | eval algo=case(match(cipher,"RSA"),"RSA key exchange",match(version,"TLS 1.0|TLS 1.1"),"Legacy TLS 1.0/1.1",match(curve,"MLKEM|X25519MLKEM"),"TLS 1.3 + ML-KEM",match(curve,"secp256r1"),"ECDHE · secp256r1",match(curve,"secp384r1"),"ECDHE · secp384r1",true(),"TLS 1.2 · ECDHE"), txns=if(isnull(txns_day),"—",txns_day." /day"), risk=case(risk=="","monitor",true(),risk) | sort risk | head 10`;
    const res = await this.search.query(spl, { earliest: "-7d", maxCount: 10 });
    if (res.results.length === 0) return null;
    return res.results.map((r) => ({
      name: String(r.server || ""),
      risk: (String(r.risk || "monitor") as RiskTier),
      algo: String(r.algo || ""),
      hosts: Number(r.hosts || 1),
      txns: String(r.txns || "—"),
      sensitivity: String(r.sensitivity || "—"),
    }));
  }

  async getRiskTrend(): Promise<number[] | null> {
    if (!this.search.enabled) return null;
    const src = config.splunk.indexSource;
    const net = config.splunk.indexes.net;
    const spl = `(index=${src} sourcetype=zeroq:crypto_finding source!="zeroq:seed") OR (index=${net} sourcetype=zeroq:tls_connection source!="zeroq:seed") | spath input=_raw | dedup _raw | eval sev=mvindex(sev,0), risk=mvindex(risk,0), points=case(sourcetype=="zeroq:crypto_finding" AND sev=="critical",100,sev=="high",66,sev=="monitor",33,sourcetype=="zeroq:tls_connection" AND risk=="critical",100,risk=="high",66,risk=="monitor",33,true(),0) | bucket _time span=1w | stats avg(points) as score by _time | sort _time | eval score=round(score,0)`;
    const res = await this.search.query(spl, { earliest: "-90d", maxCount: 12 });
    if (res.results.length === 0) return null;
    return res.results.map((r) => Number(r.score || 0));
  }

  async getHndlTimeline(): Promise<number[] | null> {
    if (!this.search.enabled) return null;
    const idx = config.splunk.indexes.hndl;
    const spl = `index=${idx} sourcetype=zeroq:hndl_event source!="zeroq:seed" earliest=-48h | spath input=_raw | dedup _raw | eval volume=mvindex(volume,0), volume_gb=tonumber(replace(volume,"[^0-9.]","")) | bucket _time span=1h | stats sum(volume_gb) as v by _time | sort _time | eval v=round(v,1)`;
    const res = await this.search.query(spl, { earliest: "-48h", maxCount: 48 });
    if (res.results.length === 0) return null;
    return res.results.map((r) => Number(r.v || 0));
  }

  async getRoadmap(): Promise<RoadmapPhase[] | null> {
    if (!this.search.enabled) return null;
    const idx = config.splunk.indexes.plan;
    const spl = `index=${idx} sourcetype=zeroq:roadmap source!="zeroq:seed" | spath input=_raw | dedup _raw | sort phase, item_order`;
    const res = await this.search.query(spl, { earliest: "-1y", maxCount: 200 });
    if (res.results.length === 0) return null;
    const phases = new Map<string, RoadmapPhase>();
    for (const r of res.results) {
      const phaseKey = String(r.phase || "");
      if (!phases.has(phaseKey)) {
        phases.set(phaseKey, {
          phase: phaseKey,
          window: String(r.window || ""),
          tone: (String(r.tone || "safe") as RoadmapPhase["tone"]),
          items: [],
        });
      }
      phases.get(phaseKey)!.items.push({
        asset: String(r.asset || ""),
        action: String(r.action || ""),
        effort: String(r.effort || ""),
        impact: String(r.impact || ""),
        why: String(r.why || ""),
      });
    }
    return Array.from(phases.values());
  }

  async getOrgs(): Promise<Org[] | null> {
    if (!this.search.enabled) return null;
    const src = config.splunk.indexSource;
    const spl = `index=${src} sourcetype=zeroq:repo_meta source!="zeroq:seed" earliest=-30d | spath input=_raw | dedup _raw | stats latest(name) as name, latest(provider) as provider, dc(repo) as repos, max(stars) as stars, max(members) as members, max(scanned_epoch) as scanned_epoch by org | eval lastScan=case(now()-scanned_epoch<3600,"4m",now()-scanned_epoch<7200,"1h",true(),round((now()-scanned_epoch)/3600)."h"), status="connected"`;
    const res = await this.search.query(spl, { earliest: "-30d", maxCount: 50 });
    if (res.results.length === 0) return null;
    return res.results.map((r) => ({
      id: `${r.provider}-${r.org}`,
      provider: (String(r.provider || "github") as Org["provider"]),
      name: String(r.org || r.name || ""),
      repos: Number(r.repos || 0),
      scanned: Number(r.repos || 0),
      lastScan: String(r.lastScan || "—"),
      status: (String(r.status || "connected") as Org["status"]),
      stars: String(r.stars || "—"),
      members: Number(r.members || 0),
    }));
  }

  async getRepos(): Promise<RepoSeed[] | null> {
    if (!this.search.enabled) return null;
    const src = config.splunk.indexSource;
    const spl = `index=${src} sourcetype=zeroq:crypto_finding source!="zeroq:seed" earliest=-30d | spath input=_raw | dedup _raw | stats count as findings, sum(eval(if(sev=="critical",1,0))) as critical, sum(eval(if(sev=="high",1,0))) as high, sum(eval(if(sev=="monitor",1,0))) as monitor, latest(lang) as lang, values(file) as files, values(kind) as kinds, values(line) as lines, values(code) as codes, values(fix) as fixes, values(sev) as sevs by repo, provider, branch, owner | eval grade=case(critical>2 OR (critical>0 AND (critical*5+high*2+(findings-critical-high))>12),"F",critical>0 AND (critical*5+high*2+(findings-critical-high))<=12,"D",critical==0 AND (high*2+(findings-high))>2,"C",critical==0 AND findings>0,"B",true(),"A"), loc="—"`;
    const res = await this.search.query(spl, { earliest: "-30d", maxCount: 200 });
    if (res.results.length === 0) return null;
    return res.results.map((r) => {
      const detail: RepoSeed["detail"] = [];
      const files = Array.isArray(r.files) ? r.files : [r.files];
      const kinds = Array.isArray(r.kinds) ? r.kinds : [r.kinds];
      const lines = Array.isArray(r.lines) ? r.lines : [r.lines];
      const codes = Array.isArray(r.codes) ? r.codes : [r.codes];
      const fixes = Array.isArray(r.fixes) ? r.fixes : [r.fixes];
      const sevs = Array.isArray(r.sevs) ? r.sevs : [r.sevs];
      for (let i = 0; i < Math.min(files.length, 6); i++) {
        detail.push({
          file: String(files[i] || ""),
          line: Number(lines[i] || 0),
          kind: String(kinds[i] || ""),
          sev: (String(sevs[i] || "monitor") as RepoSeed["detail"][number]["sev"]),
          code: String(codes[i] || ""),
          fix: String(fixes[i] || ""),
        });
      }
      return {
        repo: String(r.repo || ""),
        provider: (String(r.provider || "github") as RepoSeed["provider"]),
        lang: String(r.lang || "—"),
        loc: String(r.loc || "—"),
        grade: String(r.grade || "A"),
        findings: Number(r.findings || 0),
        critical: Number(r.critical || 0),
        high: Number(r.high || 0),
        monitor: Number(r.monitor || 0),
        lastCommit: "—",
        branch: String(r.branch || "main"),
        owner: String(r.owner || ""),
        detail,
      };
    });
  }

  async getCodeRollup(): Promise<CodeRollup | null> {
    if (!this.search.enabled) return null;
    const src = config.splunk.indexSource;
    const [rollupRes, langRes, patternRes] = await Promise.all([
      this.search.query(`index=${src} sourcetype=zeroq:crypto_finding source!="zeroq:seed" earliest=-30d | spath input=_raw | dedup _raw | stats dc(repo) as reposScanned, count as findings, sum(eval(if(sev=="critical",1,0))) as critical, sum(eval(if(sev=="high",1,0))) as high, sum(eval(if(sev=="monitor",1,0))) as monitor, sum(eval(if(match(kind,"RSA key generation|Static.*cipher|legacy cipher") OR match(fix,"Bump|Upgrade"),1,0))) as fixablePR`, { earliest: "-30d" }),
      this.search.query(`index=${src} sourcetype=zeroq:crypto_finding source!="zeroq:seed" earliest=-30d | spath input=_raw | dedup _raw | stats count as findings by lang | eval color=case(lang=="Java","var(--high)",lang=="Go","var(--cyan)",lang=="Python","var(--brand)",lang=="C#","var(--crit)",lang=="TypeScript","var(--safe)",true(),"var(--warn)") | sort -findings`, { earliest: "-30d", maxCount: 20 }),
      this.search.query(`index=${src} sourcetype=zeroq:crypto_finding source!="zeroq:seed" earliest=-30d | spath input=_raw | dedup _raw | eval pattern=case(match(kind,"RSA key generation|RSA-OAEP|RSA-PKCS1"),"RSA key generation / encryption",match(kind,"Static.*cipher|legacy cipher|TLS_RSA"),"Static / legacy cipher suite pin",match(kind,"RS256|JWT signing"),"RS256 JWT signing",match(kind,"ECDSA P-256|CurveP256"),"ECDSA P-256 only (no hybrid)",match(kind,"pre-PQC|bcprov|pycryptodome|x/crypto"),"Pre-PQC crypto dependency",true(),"Other"), sev=case(match(kind,"RSA key generation|RSA-OAEP|RSA-PKCS1|Static.*cipher|TLS_RSA|SHA-1 cert pin"),"critical",match(kind,"RS256|ECDSA P-256|CurveP256"),"high",true(),"monitor") | stats count by pattern, sev | sort -count`, { earliest: "-30d", maxCount: 20 }),
    ]);
    const rollup = rollupRes.results[0] || {};
    if (Number(rollup.findings || 0) === 0) return null;
    return {
      reposScanned: Number(rollup.reposScanned || 0),
      reposTotal: Number(rollup.reposScanned || 0),
      filesScanned: 0,
      findings: Number(rollup.findings || 0),
      critical: Number(rollup.critical || 0),
      high: Number(rollup.high || 0),
      monitor: Number(rollup.monitor || 0),
      fixablePR: Number(rollup.fixablePR || 0),
      avgGrade: "D+",
      byLang: langRes.results.map((r) => ({ lang: String(r.lang || ""), findings: Number(r.findings || 0), color: String(r.color || "var(--warn)") })),
      patterns: patternRes.results.map((r) => ({ pattern: String(r.pattern || ""), count: Number(r.count || 0), sev: (String(r.sev || "monitor") as CodeRollup["patterns"][number]["sev"]) })),
    };
  }

  async getOrgPlan(org: string): Promise<OrgPlan | null> {
    if (!this.search.enabled) return null;
    const idx = config.splunk.indexes.plan;
    const spl = `index=${idx} sourcetype=zeroq:org_plan source!="zeroq:seed" org="${org.replace(/"/g, '\\"')}" | spath input=_raw | dedup _raw | sort stream_order, action_order`;
    const res = await this.search.query(spl, { earliest: "-1y", maxCount: 200 });
    if (res.results.length === 0) return null;
    const streams = new Map<string, OrgPlan["streams"][number]>();
    for (const r of res.results) {
      const title = String(r.title || "");
      if (!streams.has(title)) {
        streams.set(title, {
          title,
          tone: (String(r.tone || "safe") as OrgPlan["streams"][number]["tone"]),
          window: String(r.window || ""),
          actions: [],
        });
      }
      streams.get(title)!.actions.push({
        repo: String(r.repo || ""),
        task: String(r.task || ""),
        pr: String(r.pr || ""),
        effort: String(r.effort || ""),
      });
    }
    return {
      org,
      generated: "just now",
      summary: String(res.results[0].summary || ""),
      posture: String(res.results[0].posture || "D+"),
      targetPosture: String(res.results[0].targetPosture || "A-"),
      weeks: Number(res.results[0].weeks || 12),
      streams: Array.from(streams.values()),
    };
  }
}
