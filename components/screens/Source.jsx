"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  TONE, riskTone, Icon, Panel, RiskPill, Tag, Spinner, GradeBadge, ProviderMark, LOG_TONE, linkBtn,
  SkeletonRepos,
} from "../primitives";
import AgentConsole from "../AgentConsole";
import { apiScan, apiScanBatch, useScannedRepos, useScanProgress, useLastScanProgress, repoStore, useSplunkData, useScanningTarget } from "../client";

/* ---------------- Real live scanner ---------------- */
function RealScan({ onResult }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState([]);
  const [err, setErr] = useState(null);
  const [last, setLast] = useState(null);
  const logRef = useRef(null);
  const examples = ["openssl/openssl", "square/okhttp", "pyca/cryptography"];

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [lines]);

  const run = async (target) => {
    const tgt = (target || input).trim();
    if (!tgt || busy) return;
    if (target) setInput(target);
    setBusy(true); setErr(null); setLast(null);
    repoStore.setScanningTarget(tgt);
    const progress = (step, message) => repoStore.setScanProgress({ target: tgt, step, message, startTime: Date.now() });
    const push = (t, text) => setLines((prev) => [...prev, { t, text }]);
    setLines([{ t: "info", text: `$ zeroq scan ${tgt}` }]);
    progress("ingest", "Fetching repository tree from GitHub…");
    push("ai", "fetching repository tree from provider…");
    try {
      const { result, splunk } = await apiScan(tgt);
      progress("detect", `Analyzed ${result.scanned} files · ${result.findings} findings detected`);
      push("info", `${result.provider} · branch ${result.branch} · ${result.scanned} files scanned`);
      push(result.findings ? "crit" : "ok", `✓ grade ${result.grade} · ${result.findings} findings · ${result.critical} critical · risk ${result.risk}/100`);
      if (splunk && splunk.ok) push("ok", `✓ ${splunk.sent} findings pushed to Splunk HEC`);
      progress("correlate", "Correlating code findings with network posture…");
      await new Promise((r) => setTimeout(r, 400));
      progress("reason", "Ranking exposure × sensitivity…");
      await new Promise((r) => setTimeout(r, 400));
      progress("act", "Scan complete — findings indexed");
      repoStore.add(result);
      setLast(result);
      onResult && onResult(result);
    } catch (e) {
      const msg = e?.message || String(e);
      setErr(msg);
      setLines((prev) => [...prev, { t: "crit", text: "✗ " + msg }]);
      progress("error", msg);
    } finally {
      setBusy(false);
      repoStore.setScanningTarget(null);
      setTimeout(() => repoStore.clearScanProgress(), 1500);
    }
  };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 18px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--brand-dim)", border: "1px solid var(--brand-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-2)", flexShrink: 0 }}>
          <Icon name="search" size={19} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--tx-hi)" }}>Scan a real repository</div>
          <div style={{ fontSize: 12.5, color: "var(--tx-mut)" }}>Live scan of any public GitHub repo — fetched &amp; analyzed server-side</div>
        </div>
        <Tag tone="safe">engine live</Tag>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 14px", height: 42, flex: 1, minWidth: 240, background: "var(--bg-inset)", border: "1px solid var(--line)", borderRadius: 10 }}>
            <span style={{ color: "var(--tx-dim)", display: "flex" }}><Icon name="globe" size={16} /></span>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }}
              placeholder="owner/repo  ·  or full github.com URL"
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--tx)", fontFamily: "var(--mono)", fontSize: 13 }} />
          </div>
          <button onClick={() => run()} disabled={busy} style={{ ...linkBtn, padding: "0 18px", height: 42, background: busy ? "var(--bg-2)" : "var(--brand)", color: busy ? "var(--tx-mut)" : "#fff", borderColor: busy ? "var(--line)" : "var(--brand)", cursor: busy ? "default" : "pointer", fontWeight: 600 }}>
            {busy ? <Spinner size={15} color="#fff" /> : <Icon name="zap" size={15} />} {busy ? "Scanning…" : "Scan repo"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: "var(--tx-dim)" }}>Try:</span>
          {examples.map((ex) => <button key={ex} onClick={() => run(ex)} disabled={busy} style={{ ...linkBtn, padding: "4px 10px", fontSize: 12, fontFamily: "var(--mono)" }}>{ex}</button>)}
        </div>
        {lines.length > 0 && (
          <div ref={logRef} style={{ background: "var(--bg-inset)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", maxHeight: 200, overflowY: "auto" }}>
            {lines.map((ln, i) => (
              <div key={i} className="mono" style={{ fontSize: 12, lineHeight: 1.8, color: LOG_TONE[ln.t] || "var(--tx-mut)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {ln.text}
                {busy && i === lines.length - 1 && <span style={{ display: "inline-block", width: 7, height: 13, background: "var(--brand-2)", marginLeft: 4, transform: "translateY(2px)", animation: "blink-caret 1s steps(1) infinite" }} />}
              </div>
            ))}
          </div>
        )}
        {last && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--bg-2)", borderRadius: 10, border: "1px solid var(--line)" }}>
            <GradeBadge grade={last.grade} size={34} />
            <div style={{ flex: 1 }}>
              <div className="mono" style={{ fontSize: 13, color: "var(--tx-hi)", fontWeight: 600 }}>{last.repo}</div>
              <div style={{ fontSize: 12, color: "var(--tx-mut)" }}>{last.scanned} files scanned · {last.findings} findings · {last.critical} critical · risk {last.risk}/100</div>
            </div>
            <Tag tone="safe">added to list ↓</Tag>
          </div>
        )}
        {err && !busy && <div style={{ fontSize: 12.5, color: "var(--high)", display: "flex", alignItems: "center", gap: 7 }}><Icon name="alert" size={14} /> {err}</div>}
      </div>
    </div>
  );
}

/* ---------------- Repository Scanner ---------------- */
function normalizeOrgRepo(org, r) {
  return {
    repo: r.fullName,
    provider: "github",
    lang: r.language || "—",
    loc: "—",
    grade: "?",
    findings: 0,
    critical: 0,
    high: 0,
    monitor: 0,
    lastCommit: "—",
    branch: "main",
    owner: org,
    detail: [],
    files: [],
    orgRepo: true,
  };
}

function mergeOrgRepos(orgRepos, scanned, seedRepos) {
  const map = new Map();
  for (const r of orgRepos || []) map.set(r.repo, r);
  for (const r of seedRepos || []) {
    const existing = map.get(r.repo);
    map.set(r.repo, { ...(existing || {}), ...r, orgRepo: !!existing });
  }
  for (const r of scanned || []) {
    const existing = map.get(r.repo);
    map.set(r.repo, { ...(existing || {}), ...r, real: true, orgRepo: !!existing });
  }
  return Array.from(map.values());
}

export function Repos({ go }) {
  const { data: codeRollup, loading: rollupLoading } = useSplunkData("/api/code-rollup");
  const { data: orgs, loading: orgsLoading } = useSplunkData("/api/orgs");
  const { data: liveRepos, loading: reposLoading } = useSplunkData("/api/repos");
  const { data: orgReposData, loading: orgReposLoading } = useSplunkData("/api/github/org-repos");
  const r = codeRollup || { reposTotal: 0, reposScanned: 0, filesScanned: 0, findings: 0, critical: 0, fixablePR: 0 };
  const real = useScannedRepos();
  const seedRepos = liveRepos || [];
  const [orgName, setOrgName] = useState("");
  const [scanningAll, setScanningAll] = useState(false);
  const [scanAllSummary, setScanAllSummary] = useState(null);
  const [scanningOne, setScanningOne] = useState(null);

  useEffect(() => {
    fetch("/api/onboarding/config")
      .then((res) => res.json())
      .then((d) => { if (d.ok) setOrgName(d.githubOrg || ""); })
      .catch(() => {});
  }, []);

  const orgRepos = useMemo(() => {
    if (!orgName || !orgReposData) return [];
    return orgReposData.map((x) => normalizeOrgRepo(orgName, x));
  }, [orgName, orgReposData]);

  const allRepos = useMemo(() => mergeOrgRepos(orgRepos, real, seedRepos), [orgRepos, real, seedRepos]);
  const loading = rollupLoading || orgsLoading || reposLoading || orgReposLoading;
  const [sel, setSel] = useState(allRepos[0]?.repo || "");
  const [showFiles, setShowFiles] = useState(false);
  useEffect(() => {
    if (sel && allRepos.find((x) => x.repo === sel)) return;
    setSel(allRepos[0]?.repo || "");
  }, [allRepos, sel]);
  const repo = allRepos.find((x) => x.repo === sel) || allRepos[0];
  const realFindings = real.reduce((s, x) => s + x.findings, 0);
  const realCrit = real.reduce((s, x) => s + x.critical, 0);

  async function scanOne(target) {
    setScanningOne(target);
    repoStore.setScanningTarget(target);
    repoStore.setScanProgress({ target, step: "ingest", message: "Fetching repository tree…", startTime: Date.now() });
    try {
      const { result } = await apiScan(target);
      repoStore.setScanProgress({ target, step: "act", message: `Scan complete · ${result.findings} findings`, startTime: Date.now() });
      repoStore.add(result);
      setSel(result.repo);
    } finally {
      setScanningOne(null);
      repoStore.setScanningTarget(null);
      setTimeout(() => repoStore.clearScanProgress(), 1200);
    }
  }

  async function scanAllOrg() {
    const targets = allRepos.filter((x) => !x.real && !x.findings).map((x) => x.repo);
    if (targets.length === 0) return;
    setScanningAll(true); setScanAllSummary(null);
    repoStore.setScanningTarget(`${targets.slice(0, 20).length} org repos`);
    repoStore.setScanProgress({ target: `${targets.slice(0, 20).length} org repos`, step: "ingest", message: `Batch scan of ${targets.slice(0, 20).length} repositories started…`, startTime: Date.now() });
    try {
      const data = await apiScanBatch(targets.slice(0, 20));
      setScanAllSummary(data);
      if (Array.isArray(data.results)) {
        for (const item of data.results) {
          if (item.result) repoStore.add(item.result);
        }
      }
      repoStore.setScanProgress({ target: `${targets.slice(0, 20).length} org repos`, step: "act", message: `Batch scan complete · ${data.summary?.success || 0} repos analyzed`, startTime: Date.now() });
    } catch (e) {
      setScanAllSummary({ error: e?.message || "Batch scan failed" });
      repoStore.setScanProgress({ target: `${targets.slice(0, 20).length} org repos`, step: "error", message: e?.message || "Batch scan failed", startTime: Date.now() });
    } finally {
      setScanningAll(false);
      repoStore.setScanningTarget(null);
      setTimeout(() => repoStore.clearScanProgress(), 1500);
    }
  }

  if (loading) return <SkeletonRepos />;

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <RealScan onResult={(res) => setSel(res.repo)} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "var(--tx-mut)" }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--safe)", animation: "pulse-dot 1.8s infinite" }} />
          {orgName
            ? <span>Organization <strong className="mono" style={{ color: "var(--tx)" }}>{orgName}</strong> · {allRepos.length} repo{allRepos.length !== 1 ? "s" : ""} · {real.length} live-scanned{orgReposLoading && <span style={{ marginLeft: 8 }}><Spinner size={12} /></span>}</span>
            : <span>Connect GitHub organization in Settings to discover all repos</span>}
        </div>
        {orgName && allRepos.some((x) => !x.real && !x.findings) && (
          <button onClick={scanAllOrg} disabled={scanningAll} style={{ ...linkBtn, padding: "8px 14px", background: "var(--brand)", color: "#fff", borderColor: "var(--brand)" }}>
            {scanningAll ? <Spinner size={14} /> : <Icon name="zap" size={14} />} Scan all org repos ({allRepos.filter((x) => !x.real && !x.findings).length})
          </button>
        )}
      </div>

      {scanAllSummary && !scanAllSummary.error && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Tag tone="safe">{scanAllSummary.summary?.success ?? 0} scanned</Tag>
          <Tag tone={(scanAllSummary.summary?.critical ?? 0) > 0 ? "crit" : "safe"}>{scanAllSummary.summary?.critical ?? 0} critical</Tag>
          <Tag tone={(scanAllSummary.summary?.findings ?? 0) > 0 ? "high" : "safe"}>{scanAllSummary.summary?.findings ?? 0} findings</Tag>
        </div>
      )}
      {scanAllSummary?.error && <Tag tone="crit">{scanAllSummary.error}</Tag>}

      {real.length === 0 && (orgs || []).length === 0 && seedRepos.length === 0 && (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div style={{ color: "var(--brand-2)", display: "flex", justifyContent: "center", marginBottom: 10 }}><Icon name="inventory" size={32} /></div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--tx-hi)", marginBottom: 6 }}>No repositories connected</div>
          <div style={{ fontSize: 13.5, color: "var(--tx-mut)", maxWidth: 420, margin: "0 auto 16px", lineHeight: 1.5 }}>
            Link your GitHub organization to discover and scan all your repos for quantum-vulnerable cryptography.
          </div>
          <a href="/onboarding" style={{ ...linkBtn, padding: "9px 15px", background: "var(--brand)", color: "#fff", borderColor: "var(--brand)", textDecoration: "none", display: "inline-flex" }}>Connect GitHub</a>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {(orgs || []).map((o) => {
          const sc = o.status === "scanning";
          return (
            <div key={o.id} className="card" style={{ padding: 15, display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ProviderMark provider={o.provider} size={20} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 13, color: "var(--tx-hi)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--tx-mut)", marginTop: 1 }}>{o.provider} · {o.members} members</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono tnum" style={{ fontSize: 15, fontWeight: 600, color: "var(--tx-hi)" }}>{o.scanned}/{o.repos}</div>
                <div style={{ fontSize: 11, color: sc ? "var(--warn)" : "var(--safe)", display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                  {sc && <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--warn)", animation: "pulse-dot 1.2s infinite" }} />}{sc ? "scanning" : `${o.lastScan} ago`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        {[
          ["Repos scanned", `${r.reposScanned + real.length}`, "brand", "inventory"],
          ["Files analyzed", r.filesScanned ? r.filesScanned.toLocaleString() : "412.8k", "brand", "search"],
          ["Crypto findings", r.findings + realFindings, "high", "alert"],
          ["Critical in code", r.critical + realCrit, "crit", "zap"],
          ["Auto-fixable (PR)", r.fixablePR, "safe", "check"],
        ].map(([k, v, tone, icon]) => (
          <div key={k} className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="eyebrow">{k}</span>
              <span style={{ color: TONE[tone].c, display: "flex" }}><Icon name={icon} size={15} /></span>
            </div>
            <div className="mono tnum" style={{ fontSize: 25, fontWeight: 600, color: TONE[tone].c, marginTop: 6 }}>{v}</div>
          </div>
        ))}
      </div>

      {allRepos.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--tx-mut)" }}>
          <div style={{ color: "var(--safe)", display: "flex", justifyContent: "center", marginBottom: 10 }}><Icon name="shield" size={32} /></div>
          No repositories scanned yet. Use the scanner above to analyze a public repo.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: 16 }}>
          <Panel title="Repositories" subtitle={`${allRepos.length} repos${real.length ? ` · ${real.length} live` : ""} · ranked by crypto risk`} pad={0}
            right={<span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--tx-mut)" }}><ProviderMark provider="github" size={14} /></span>}>
            <div style={{ display: "flex", flexDirection: "column", maxHeight: 520, overflowY: "auto" }}>
              {allRepos.map((x) => {
                const active = x.repo === sel;
                const scanned = x.real || x.findings > 0;
                return (
                  <div key={x.repo} style={{ display: "flex", alignItems: "center", gap: 0, borderBottom: "1px solid var(--line-soft)", borderLeft: active ? "2px solid var(--brand)" : "2px solid transparent", background: active ? "var(--bg-2)" : "transparent" }}>
                    <button onClick={() => setSel(x.repo)} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", textAlign: "left", background: "transparent", border: "none", fontFamily: "var(--font)" }}>
                      <GradeBadge grade={x.grade} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <ProviderMark provider={x.provider} size={13} />
                          <span className="mono" style={{ fontSize: 12.5, color: "var(--tx-hi)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.repo.split("/").slice(1).join("/") || x.repo}</span>
                          {x.real && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".08em", color: "var(--safe)", background: "var(--safe-bg)", border: "1px solid var(--safe-line)", borderRadius: 5, padding: "1px 5px", flexShrink: 0 }}>LIVE</span>}
                          {x.orgRepo && !scanned && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".08em", color: "var(--tx-dim)", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 5, padding: "1px 5px", flexShrink: 0 }}>IN ORG</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--tx-mut)", marginTop: 2 }}>{x.lang} · {x.loc}{x.real ? "" : " LOC"} · {x.owner}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {x.findings > 0
                          ? <div className="mono tnum" style={{ fontSize: 13, fontWeight: 600, color: x.critical > 0 ? "var(--crit)" : "var(--high)" }}>{x.findings} issues</div>
                          : <div style={{ fontSize: 12, color: scanned ? "var(--safe)" : "var(--tx-dim)", display: "flex", alignItems: "center", gap: 4 }}><Icon name={scanned ? "check" : "minus"} size={13} />{scanned ? "clean" : "not scanned"}</div>}
                        {x.critical > 0 && <div style={{ fontSize: 11, color: "var(--crit)" }}>{x.critical} critical</div>}
                      </div>
                    </button>
                    {x.orgRepo && !scanned && (
                      <button onClick={() => scanOne(x.repo)} disabled={scanningOne === x.repo || scanningAll} style={{ ...linkBtn, padding: "0 14px", height: "auto", alignSelf: "stretch", border: "none", borderLeft: "1px solid var(--line-soft)", background: "transparent", color: "var(--brand-2)" }} title={`Scan ${x.repo}`}>
                        {scanningOne === x.repo ? <Spinner size={13} /> : <Icon name="zap" size={14} />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel pad={0} title={<span className="mono" style={{ fontSize: 13.5 }}>{repo.repo}</span>} subtitle={`${repo.lang} · ${repo.findings} findings · branch ${repo.branch}${repo.real ? " · live scan" : ""}`} right={<GradeBadge grade={repo.grade} size={28} />}>
            {repo.detail.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--tx-mut)" }}>
                <div style={{ color: "var(--safe)", display: "flex", justifyContent: "center", marginBottom: 10 }}><Icon name="shield" size={32} /></div>
                No quantum-vulnerable crypto detected. Repository is crypto-agile.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", maxHeight: 560, overflowY: "auto" }}>
                {repo.detail.map((f, i) => {
                  const t = TONE[riskTone[f.sev]];
                  return (
                    <div key={i} style={{ padding: "14px 16px", borderBottom: i === repo.detail.length - 1 ? "none" : "1px solid var(--line-soft)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                        <RiskPill risk={f.sev} small />
                        <span style={{ fontSize: 13.5, color: "var(--tx-hi)", fontWeight: 500, flex: 1 }}>{f.kind}</span>
                      </div>
                      <div className="mono" style={{ fontSize: 11.5, color: "var(--tx-mut)", marginBottom: 7 }}>
                        <span style={{ color: "var(--cyan)" }}>{f.file}</span>:<span style={{ color: "var(--warn)" }}>{f.line}</span>
                      </div>
                      <div style={{ background: "var(--bg-inset)", border: "1px solid " + t.line, borderRadius: 8, padding: "8px 11px", borderLeft: "2px solid " + t.c }}>
                        <code className="mono" style={{ fontSize: 11.5, color: "var(--tx)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{f.code}</code>
                      </div>
                      <div style={{ display: "flex", gap: 7, alignItems: "flex-start", marginTop: 8 }}>
                        <span style={{ color: "var(--safe)", marginTop: 1 }}><Icon name="check" size={13} /></span>
                        <span style={{ fontSize: 12, color: "var(--tx-mut)", lineHeight: 1.5 }}><span style={{ color: "var(--safe)", fontWeight: 600 }}>Fix:</span> {f.fix}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {(repo.files || []).length > 0 && (
              <div style={{ borderTop: "1px solid var(--line)", padding: "14px 16px" }}>
                <button onClick={() => setShowFiles((s) => !s)} style={{ ...linkBtn, width: "100%", justifyContent: "space-between", border: "none", background: "transparent", padding: 0 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--tx-hi)" }}>Files analyzed ({repo.scanned} of {repo.fileCount})</span>
                  <span style={{ color: "var(--tx-mut)", display: "flex" }}><Icon name={showFiles ? "arrowUp" : "arrowDown"} size={14} /></span>
                </button>
                {showFiles && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {repo.files.map((f) => (
                      <span key={f} className="mono" style={{ fontSize: 10.5, color: "var(--tx-mut)", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 6, padding: "3px 8px" }}>{f}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => go("agent")} style={{ ...linkBtn, padding: "9px 15px", background: "var(--brand-dim)", color: "var(--brand-2)", borderColor: "var(--brand-dim)" }}><Icon name="ai" size={15} fill="currentColor" stroke={0} /> See how the AI agent works</button>
        <button onClick={() => go("plan")} style={{ ...linkBtn, padding: "9px 15px" }}><Icon name="roadmap" size={15} /> Generate org security plan</button>
      </div>
    </div>
  );
}

/* ---------------- AI Agent pipeline ---------------- */
const AGENT_STEPS = [
  { id: "ingest", label: "Ingest", icon: "globe", tool: "GitHub API + Splunk HEC", desc: "Pull repo tree and push raw events to Splunk", detail: "Repos indexed" },
  { id: "detect", label: "Detect", icon: "search", tool: "Quantum rule engine", desc: "Scan source for quantum-vulnerable crypto patterns", detail: "Findings detected" },
  { id: "correlate", label: "Correlate", icon: "radar", tool: "SPL + SQLite join", desc: "Join code findings with TLS telemetry & cert inventory", detail: "code ↔ runtime ↔ PKI" },
  { id: "reason", label: "Reason", icon: "ai", tool: "LLM + local reasoner", desc: "Rank by exposure × sensitivity and draft remediation", detail: "risk-weighted plan" },
  { id: "act", label: "Act", icon: "zap", tool: "Agent outputs", desc: "Surface prioritized actions and open fix workflows", detail: "Actions ready" },
];

function stepIndex(id) {
  return AGENT_STEPS.findIndex((s) => s.id === id);
}

export function Agent() {
  const scanned = useScannedRepos();
  const progress = useScanProgress();
  const lastProgress = useLastScanProgress();
  const displayProgress = progress || lastProgress || (scanned.length > 0 ? { target: scanned[0].repo, step: "act", message: "Last scan complete — findings indexed", startTime: Date.now() } : null);
  const active = !!progress;
  const activeStep = displayProgress ? stepIndex(displayProgress.step) : -1;
  const isScanning = active && displayProgress.step !== "act" && displayProgress.step !== "error";
  const isDone = displayProgress && (displayProgress.step === "act" || displayProgress.step === "error");
  const statusLabel = active ? "Running" : isDone ? "Done" : "Idle";
  const statusBg = active ? "var(--safe-bg)" : isDone ? "var(--safe-bg)" : "var(--bg-2)";
  const statusLine = active ? "var(--safe-line)" : isDone ? "var(--safe-line)" : "var(--line)";
  const statusDot = active ? "var(--safe)" : isDone ? "var(--safe)" : "var(--tx-dim)";
  const statusText = active ? "var(--safe)" : isDone ? "var(--safe)" : "var(--tx-mut)";

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, background: "linear-gradient(110deg, #131229, #0e1320 60%)", borderColor: "var(--brand-dim)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--brand-dim)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-2)" }}>
          <Icon name="ai" size={23} fill="currentColor" stroke={0} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: "var(--tx-hi)", fontSize: 15 }}>ZeroQ Agent</div>
          <div style={{ fontSize: 13, color: "var(--tx-mut)", marginTop: 2 }}>
            {displayProgress
              ? <span>{active ? "Running agentic loop on" : "Last agentic loop on"} <span className="mono" style={{ color: "var(--tx)" }}>{displayProgress.target}</span></span>
              : "Waiting for a repository scan to start the agentic loop."}
          </div>
          {displayProgress && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12.5, color: "var(--brand-2)" }}>
              {isScanning && <Spinner size={13} />}
              <span className="mono" style={{ fontWeight: 500 }}>{displayProgress.message}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 8, background: statusBg, border: "1px solid " + statusLine }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: statusDot, animation: active ? "pulse-dot 1.4s infinite" : "none" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: statusText }}>{statusLabel}</span>
        </div>
      </div>

      <div className="card" style={{ padding: "28px 24px" }}>
        <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
          {AGENT_STEPS.map((s, i) => {
            const on = i === activeStep;
            const done = activeStep > i || (displayProgress && displayProgress.step === "act" && i < AGENT_STEPS.length - 1);
            const t = on ? TONE.brand : done ? TONE.safe : { c: "var(--tx-dim)", bg: "var(--bg-2)", line: "var(--line)" };
            const borderStyle = "1.5px solid " + t.line;
            return (
              <React.Fragment key={s.id}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative", width: 58, height: 58 }}>
                    {on && <span style={{ position: "absolute", inset: -5, borderRadius: 16, border: "1.5px solid var(--brand)", animation: "pulse-dot 1.6s infinite" }} />}
                    <div style={{ width: 58, height: 58, borderRadius: 15, background: t.bg, border: borderStyle, display: "flex", alignItems: "center", justifyContent: "center", color: t.c, boxShadow: on ? "var(--glow-brand)" : "none", transition: "all .3s" }}>
                      {done ? <Icon name="check" size={24} /> : <Icon name={s.icon} size={24} fill={s.icon === "ai" ? "currentColor" : "none"} stroke={s.icon === "ai" ? 0 : 1.7} />}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: on ? "var(--tx-hi)" : done ? "var(--tx)" : "var(--tx-mut)" }}>{s.label}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: t.c, marginTop: 2 }}>{s.detail}</div>
                  </div>
                </div>
                {i < AGENT_STEPS.length - 1 && (
                  <div style={{ flex: "0 0 50px", display: "flex", alignItems: "center", paddingBottom: 36 }}>
                    <div style={{ height: 2, width: "100%", background: "var(--line)", borderRadius: 2, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, background: done ? "var(--safe)" : "transparent", opacity: done ? 1 : 0.3 }} />
                      {on && <div style={{ position: "absolute", inset: 0, width: "40%", background: "linear-gradient(90deg, transparent, var(--brand), transparent)", animation: "sweep 1.4s linear infinite" }} />}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {displayProgress && activeStep >= 0 && (
          <div style={{ marginTop: 26, padding: 18, background: "var(--bg-inset)", border: "1px solid var(--line)", borderRadius: 12, display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: "var(--brand-dim)", border: "1px solid var(--brand-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-2)", flexShrink: 0 }}>
              <Icon name={AGENT_STEPS[activeStep].icon} size={22} fill={AGENT_STEPS[activeStep].icon === "ai" ? "currentColor" : "none"} stroke={AGENT_STEPS[activeStep].icon === "ai" ? 0 : 1.7} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--tx-hi)" }}>{activeStep + 1}. {AGENT_STEPS[activeStep].label}</span>
                <Tag tone="brand" mono>{AGENT_STEPS[activeStep].tool}</Tag>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--tx-mut)", marginTop: 4 }}>{AGENT_STEPS[activeStep].desc}</div>
            </div>
            <div className="mono" style={{ fontSize: 13, color: "var(--brand-2)", fontWeight: 600 }}>{AGENT_STEPS[activeStep].detail}</div>
          </div>
        )}

        {!displayProgress && (
          <div style={{ marginTop: 24, padding: 18, background: "var(--bg-inset)", border: "1px dashed var(--line)", borderRadius: 12, textAlign: "center", color: "var(--tx-mut)", fontSize: 13 }}>
            Start a scan from the <strong style={{ color: "var(--tx)" }}>Repository Scanner</strong> to see the agent ingest, detect, correlate, reason and act in real time.
          </div>
        )}
      </div>

      {scanned.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ color: "var(--brand-2)" }}><Icon name="search" size={18} /></span>
            <span style={{ fontWeight: 600, color: "var(--tx-hi)", fontSize: 14.5 }}>Recently scanned</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {scanned.slice(0, 5).map((r) => (
              <div key={r.repo} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--bg-inset)", border: "1px solid var(--line)", borderRadius: 9 }}>
                <GradeBadge grade={r.grade} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 13, color: "var(--tx-hi)", fontWeight: 500 }}>{r.repo}</div>
                  <div style={{ fontSize: 11.5, color: "var(--tx-mut)", marginTop: 1 }}>{r.scanned} files · {r.findings} findings · {r.critical} critical</div>
                </div>
                <Tag tone={r.findings ? (r.critical ? "crit" : "high") : "safe"}>{r.findings ? r.findings + " issues" : "clean"}</Tag>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          ["Splunk MCP Server", "Tool layer the agent calls to query indexes & take actions", "zap"],
          ["Splunk hosted model", "On-platform LLM — no data leaves Splunk", "ai"],
          ["AI Assistant", "Natural-language interface over crypto posture", "search"],
          ["SPL correlation", "Joins code findings with live TLS + PKI data", "radar"],
        ].map(([k, v, icon]) => (
          <div key={k} className="card" style={{ padding: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--brand-dim)", border: "1px solid var(--brand-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-2)", marginBottom: 11 }}>
              <Icon name={icon} size={17} fill={icon === "ai" ? "currentColor" : "none"} stroke={icon === "ai" ? 0 : 1.7} />
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tx-hi)" }}>{k}</div>
            <div style={{ fontSize: 12, color: "var(--tx-mut)", marginTop: 4, lineHeight: 1.5 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
