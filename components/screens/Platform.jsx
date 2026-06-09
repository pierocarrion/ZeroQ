"use client";
import React, { useState, useEffect } from "react";
import { TONE, Icon, Panel, Tag, GradeBadge, Spinner, linkBtn } from "../primitives";
import { DATA } from "@/lib/data";
import AgentConsole from "../AgentConsole";
import { apiPlan, useScannedRepos, useSplunkData } from "../client";

/* ---------------- Org Security Plan (real /api/plan) ---------------- */
export function OrgPlan({ go }) {
  const scanned = useScannedRepos();
  const [ready, setReady] = useState(false);
  const [plan, setPlan] = useState({ org: "—", generated: "—", summary: "", posture: "—", targetPosture: "A", weeks: 0, streams: [] });
  const [mode, setMode] = useState(null);
  const { data: orgPlan } = useSplunkData("/api/org-plan", DATA.orgPlan);
  const { data: rollup } = useSplunkData("/api/code-rollup", DATA.codeRollup);
  const basePlan = orgPlan;
  const r = rollup || {};

  const onAgentDone = async () => {
    try {
      const data = await apiPlan(scanned, scanned[0]?.owner || "acme-corp");
      if (data?.plan) setPlan(data.plan);
      setMode(data?.mode);
    } catch { /* keep fallback */ }
    setReady(true);
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <AgentConsole steps={[]} title="Generating org security plan"
        subtitle={`${scanned[0]?.owner || "org"} · ${scanned.length ? scanned.length + " live-scanned repos" : "no repos scanned yet"} · MCP Server + hosted model`}
        onDone={onAgentDone} />

      {!ready ? (
        <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--tx-mut)", fontSize: 13.5 }}>
          The agent is analyzing your organization. The prioritized plan appears here when it finishes.
        </div>
      ) : (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 20, display: "flex", gap: 16, alignItems: "flex-start", background: "linear-gradient(110deg, #131229, #0e1320 60%)", borderColor: "var(--brand-dim)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--brand-dim)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-2)" }}><Icon name="ai" size={21} fill="currentColor" stroke={0} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, color: "var(--tx-hi)", fontSize: 15.5 }}>Security plan · <span className="mono">{plan.org}</span></span>
                <Tag tone="brand">{mode === "live" ? "AI-generated" : "auto-prioritized"}</Tag>
                <span style={{ fontSize: 12, color: "var(--tx-dim)" }}>{plan.generated}</span>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--tx)", lineHeight: 1.6, maxWidth: 880 }}>{plan.summary}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
              <GradeBadge grade={plan.posture} size={44} />
              <div><div className="eyebrow">Current posture</div><div style={{ fontSize: 13, color: "var(--tx-mut)", marginTop: 3 }}>org ZeroQ grade</div></div>
            </div>
            <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "var(--tx-dim)" }}><Icon name="chevron" size={22} /></span>
              <GradeBadge grade={plan.targetPosture} size={44} />
              <div><div className="eyebrow">Target</div><div style={{ fontSize: 13, color: "var(--safe)", marginTop: 3 }}>in {plan.weeks} weeks</div></div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div className="eyebrow">Auto-fixable now</div>
              <div className="mono" style={{ fontSize: 26, fontWeight: 600, color: "var(--safe)", marginTop: 6 }}>{r.fixablePR ?? 0}<span style={{ fontSize: 15, color: "var(--tx-mut)" }}> / {r.findings ?? 0}</span></div>
              <div style={{ fontSize: 12, color: "var(--tx-mut)" }}>via pull request</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div className="eyebrow">Cost framing</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: "var(--tx-hi)", marginTop: 6 }}>~{Math.ceil((basePlan?.weeks || 12) * 0.5)} eng-weeks</div>
              <div style={{ fontSize: 12, color: "var(--tx-mut)" }}>not millions in capital</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(plan.streams || []).map((s, si) => {
              const t = TONE[s.tone] || TONE.brand;
              return (
                <div key={si} className="card" style={{ overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--line)", borderLeft: `3px solid ${t.c}` }}>
                    <span style={{ fontWeight: 600, color: "var(--tx-hi)", fontSize: 14.5 }}>{s.title}</span>
                    <Tag tone={s.tone}>{s.window}</Tag>
                    <span style={{ flex: 1 }} />
                    <span style={{ fontSize: 12, color: "var(--tx-mut)" }}>{s.actions.length} actions</span>
                  </div>
                  <div>
                    {s.actions.map((a, ai) => (
                      <div key={ai} style={{ display: "flex", gap: 14, padding: "14px 18px", alignItems: "center", borderBottom: ai === s.actions.length - 1 ? "none" : "1px solid var(--line-soft)" }}>
                        <span className="mono" style={{ fontSize: 12, color: t.c, fontWeight: 600, width: 120, flexShrink: 0 }}>{a.repo}</span>
                        <span style={{ flex: 1, fontSize: 13.5, color: "var(--tx)" }}>{a.task}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: String(a.pr).includes("ready") ? "var(--safe)" : "var(--tx-mut)", padding: "4px 10px", borderRadius: 7, background: "var(--bg-2)", border: "1px solid var(--line)", flexShrink: 0 }}>
                          <Icon name={String(a.pr).includes("ready") ? "check" : "roadmap"} size={13} />{a.pr}
                        </span>
                        <span className="mono" style={{ fontSize: 13, color: "var(--tx-hi)", fontWeight: 600, width: 44, textAlign: "right", flexShrink: 0 }}>{a.effort}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...linkBtn, padding: "10px 16px", background: "var(--brand)", color: "#fff", borderColor: "var(--brand)" }}><Icon name="download" size={15} /> Export plan (PDF · Jira · CSV)</button>
            <button onClick={() => go("repos")} style={{ ...linkBtn, padding: "10px 16px" }}><Icon name="inventory" size={15} /> Back to repositories</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Architecture ---------------- */
const ARCH = {
  layers: [
    { title: "Sources", tone: "cyan", nodes: [
      { name: "GitHub / GitLab org", sub: "REST + GraphQL · repo tree, blobs", icon: "globe" },
      { name: "Network TAP / Zeek", sub: "ssl.log · x509.log (passive)", icon: "radar" },
      { name: "PKI / CT logs", sub: "cert inventory feed", icon: "cert" },
    ]},
    { title: "Ingest & Index", tone: "brand", nodes: [
      { name: "ZeroQ Collector", sub: "Next API · async fetch → HEC", icon: "download" },
      { name: "Splunk HEC", sub: "index=crypto_source / network_ssl", icon: "inventory" },
    ]},
    { title: "Splunk Intelligence", tone: "brand", nodes: [
      { name: "SPL correlation searches", sub: "code ↔ runtime ↔ PKI joins", icon: "search" },
      { name: "Splunk MCP Server", sub: "tool layer for the agent", icon: "zap" },
      { name: "Splunk hosted model + AI Assistant", sub: "reasoning · NL queries · plan synthesis", icon: "ai" },
    ]},
    { title: "App & Actions", tone: "safe", nodes: [
      { name: "ZeroQ Dashboard (Next.js)", sub: "React · Splunk custom app", icon: "dashboard" },
      { name: "Agent actions", sub: "open PRs · tickets · policy", icon: "roadmap" },
    ]},
  ],
};
export function Architecture() {
  const a = ARCH;
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "center" }}>
        <span style={{ color: "var(--brand-2)" }}><Icon name="roadmap" size={22} /></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "var(--tx-hi)", fontSize: 15 }}>How it runs on Splunk</div>
          <div style={{ fontSize: 13, color: "var(--tx-mut)", marginTop: 2 }}>Data flows left → right. The Next.js API routes are the collector + agent tool layer; Splunk holds the indexes and the hosted model.</div>
        </div>
        <Tag tone="safe">npm run dev</Tag>
      </div>

      <div className="card" style={{ padding: "26px 22px", overflowX: "auto" }}>
        <div style={{ display: "flex", alignItems: "stretch", gap: 0, minWidth: 880 }}>
          {a.layers.map((layer, li) => {
            const t = TONE[layer.tone] || TONE.brand;
            return (
              <React.Fragment key={li}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ textAlign: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: t.c }}>{layer.title}</span>
                  </div>
                  {layer.nodes.map((n, ni) => (
                    <div key={ni} style={{ background: "var(--bg-inset)", border: `1px solid ${t.line}`, borderRadius: 11, padding: "13px 14px", borderTop: `2px solid ${t.c}` }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 5 }}>
                        <span style={{ color: t.c, display: "flex", flexShrink: 0, marginTop: 1 }}><Icon name={n.icon} size={16} fill={n.icon === "ai" ? "currentColor" : "none"} stroke={n.icon === "ai" ? 0 : 1.7} /></span>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--tx-hi)", lineHeight: 1.25 }}>{n.name}</span>
                      </div>
                      <div className="mono" style={{ fontSize: 10.5, color: "var(--tx-mut)", lineHeight: 1.5 }}>{n.sub}</div>
                    </div>
                  ))}
                </div>
                {li < a.layers.length - 1 && <div style={{ flex: "0 0 38px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--tx-dim)" }}><Icon name="chevron" size={20} /></div>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel title="Repository structure" subtitle="Layered, SOLID — thin routes over services">
          <pre className="mono" style={{ margin: 0, fontSize: 11.5, color: "var(--tx)", lineHeight: 1.7, whiteSpace: "pre" }}>
{`app/
  page.tsx              # landing
  app/page.tsx          # dashboard
  api/{scan,assistant,  # thin controllers →
       plan,ingest}     #   delegate to services
lib/
  config.ts             # typed env (single source)
  rules.ts              # crypto rule set (extensible)
  scanning/             # detector · scoring · target
  providers/            # SourceProvider + GitHub/GitLab
  ai/                   # AIProvider + DeepSeek/Local
  splunk/               # SplunkClient + HEC/Noop
  services/             # Scan/Assistant/Plan + DI root
components/             # React UI`}
          </pre>
        </Panel>
        <Panel title="Configure & run" subtitle="Three steps to 100% functional">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["1", "Install", "npm install — pulls Next.js + React. No other services required to start."],
              ["2", "Configure (optional)", "cp .env.example .env.local — add DEEPSEEK_API_KEY for live AI, GITHUB/GITLAB tokens for higher limits, Splunk HEC to push findings."],
              ["3", "Run", "npm run dev → open http://localhost:3000. Scan a public repo immediately; AI + Splunk activate when keys are set."],
            ].map(([n, title, desc]) => (
              <div key={n} style={{ display: "flex", gap: 13 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand-dim)", border: "1px solid var(--brand-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-2)", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{n}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tx-hi)" }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--tx-mut)", marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
            <div style={{ background: "var(--bg-inset)", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 13px" }}>
              <code className="mono" style={{ fontSize: 12, color: "var(--safe)" }}>$ npm install &amp;&amp; npm run dev</code>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */
export function Settings() {
  const [testing, setTesting] = useState({});
  const [config, setConfig] = useState({
    githubOrg: "", selectedRepos: [], splunkHecUrl: "", splunkHecToken: "", splunkBaseUrl: "", splunkUsername: "", splunkPassword: "", splunkSkipTlsVerify: "", deepseekApiKey: "",
  });

  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [savingRepos, setSavingRepos] = useState(false);
  const [scanningRepos, setScanningRepos] = useState(false);
  const [scanSummary, setScanSummary] = useState(null);

  useEffect(() => {
    fetch("/api/onboarding/config")
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) return;
        setConfig((c) => ({
          ...c,
          githubOrg: data.githubOrg || c.githubOrg,
          selectedRepos: Array.isArray(data.selectedRepos) ? data.selectedRepos : c.selectedRepos,
          splunkHecUrl: data.splunkHecUrl || c.splunkHecUrl,
          splunkHecToken: data.splunkHecToken || c.splunkHecToken,
          splunkBaseUrl: data.splunkBaseUrl || c.splunkBaseUrl,
          splunkUsername: data.splunkUsername || c.splunkUsername,
          splunkPassword: data.splunkPassword || c.splunkPassword,
          splunkSkipTlsVerify: data.splunkSkipTlsVerify || c.splunkSkipTlsVerify,
          deepseekApiKey: data.deepseekApiKey || c.deepseekApiKey,
        }));
        if (Array.isArray(data.selectedRepos)) setSelected(new Set(data.selectedRepos));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!config.githubOrg) { setRepos([]); return; }
    let mounted = true;
    async function load() {
      setReposLoading(true); setScanSummary(null);
      try {
        const res = await fetch(`/api/github/repos?org=${encodeURIComponent(config.githubOrg)}`);
        const data = await res.json();
        if (!mounted) return;
        setRepos(data.data || []);
      } catch { if (mounted) setRepos([]); }
      finally { if (mounted) setReposLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, [config.githubOrg]);

  async function testGitHub() {
    setTesting((t) => ({ ...t, github: true }));
    try {
      const res = await fetch("/api/onboarding/test-github", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ org: config.githubOrg }),
      });
      const data = await res.json();
      setTesting((t) => ({ ...t, github: data.ok ? "ok" : "error", githubMsg: data.ok ? `${data.login} · ${data.publicRepos ?? "?"} public repos` : data.error }));
    } catch (e) {
      setTesting((t) => ({ ...t, github: "error", githubMsg: e?.message }));
    }
  }

  async function testSplunk() {
    setTesting((t) => ({ ...t, splunk: true }));
    try {
      const res = await fetch("/api/onboarding/test-splunk", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ hecUrl: config.splunkHecUrl, hecToken: config.splunkHecToken, baseUrl: config.splunkBaseUrl, username: config.splunkUsername, password: config.splunkPassword, skipTlsVerify: config.splunkSkipTlsVerify === "true" }),
      });
      const data = await res.json();
      setTesting((t) => ({ ...t, splunk: data.ok ? "ok" : "error", splunkMsg: data.ok ? "Connected" : (data.checks?.hec?.error || data.checks?.rest?.error || "Failed") }));
    } catch (e) {
      setTesting((t) => ({ ...t, splunk: "error", splunkMsg: e?.message }));
    }
  }

  async function saveConfig() {
    setTesting((t) => ({ ...t, saving: true }));
    try {
      const res = await fetch("/api/onboarding/config", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          githubOrg: config.githubOrg,
          splunkHecUrl: config.splunkHecUrl,
          splunkHecToken: config.splunkHecToken,
          splunkBaseUrl: config.splunkBaseUrl,
          splunkUsername: config.splunkUsername,
          splunkPassword: config.splunkPassword,
          splunkSkipTlsVerify: config.splunkSkipTlsVerify,
          deepseekApiKey: config.deepseekApiKey,
        }),
      });
      const data = await res.json();
      setTesting((t) => ({ ...t, saving: false, saved: data.ok, savedMsg: data.message || data.error }));
    } catch (e) {
      setTesting((t) => ({ ...t, saving: false, saved: false, savedMsg: e?.message }));
    }
  }

  const toggleRepo = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  async function saveRepoSelection() {
    setSavingRepos(true);
    try {
      const res = await fetch("/api/onboarding/config", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ selectedRepos: Array.from(selected) }),
      });
      const data = await res.json();
      setTesting((t) => ({ ...t, reposSaved: data.ok, reposSavedMsg: data.message || data.error }));
      if (data.ok) setConfig((c) => ({ ...c, selectedRepos: Array.from(selected) }));
    } catch (e) {
      setTesting((t) => ({ ...t, reposSaved: false, reposSavedMsg: e?.message }));
    } finally { setSavingRepos(false); }
  }

  async function runSelectedScan() {
    const targets = Array.from(selected);
    if (targets.length === 0) return;
    setScanningRepos(true); setScanSummary(null);
    try {
      const res = await fetch("/api/scan-batch", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ repos: targets }),
      });
      const data = await res.json();
      setScanSummary(data);
    } catch (e) {
      setScanSummary({ error: e?.message || "Batch scan failed" });
    } finally { setScanningRepos(false); }
  }

  const inputStyle = {
    padding: "0 14px", height: 40, background: "var(--bg-inset)", border: "1px solid var(--line)",
    borderRadius: 10, color: "var(--tx)", fontFamily: "var(--font)", fontSize: 13, outline: "none", width: "100%",
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 800 }}>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ color: "var(--brand-2)" }}><Icon name="lock" size={20} /></span>
          <span style={{ fontWeight: 600, color: "var(--tx-hi)", fontSize: 15 }}>Data Sources</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* GitHub Org */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tx-hi)" }}>GitHub Organization</span>
              {testing.github === "ok" && <Tag tone="safe">Found</Tag>}
              {testing.github === "error" && <Tag tone="crit">{testing.githubMsg}</Tag>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
              <input value={config.githubOrg} onChange={(e) => setConfig((c) => ({ ...c, githubOrg: e.target.value }))} placeholder="e.g. facebook, microsoft, vercel" style={inputStyle} />
              <button onClick={testGitHub} disabled={testing.github === true} style={{ ...linkBtn, padding: "0 14px", height: 40 }}>{testing.github === true ? <Spinner size={14} /> : "Check"}</button>
            </div>
          </div>

          {/* Splunk HEC */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tx-hi)" }}>Splunk HEC</span>
              {testing.splunk === "ok" && <Tag tone="safe">Connected</Tag>}
              {testing.splunk === "error" && <Tag tone="crit">{testing.splunkMsg}</Tag>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input value={config.splunkHecUrl} onChange={(e) => setConfig((c) => ({ ...c, splunkHecUrl: e.target.value }))} placeholder="HEC URL" style={inputStyle} />
              <input type="password" value={config.splunkHecToken} onChange={(e) => setConfig((c) => ({ ...c, splunkHecToken: e.target.value }))} placeholder="HEC Token" style={inputStyle} />
            </div>
          </div>

          {/* Splunk REST */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tx-hi)" }}>Splunk REST API</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <input value={config.splunkBaseUrl} onChange={(e) => setConfig((c) => ({ ...c, splunkBaseUrl: e.target.value }))} placeholder="Base URL" style={inputStyle} />
              <input value={config.splunkUsername} onChange={(e) => setConfig((c) => ({ ...c, splunkUsername: e.target.value }))} placeholder="Username" style={inputStyle} />
              <input type="password" value={config.splunkPassword} onChange={(e) => setConfig((c) => ({ ...c, splunkPassword: e.target.value }))} placeholder="Password" style={inputStyle} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--tx-mut)", cursor: "pointer" }}>
              <input type="checkbox" checked={config.splunkSkipTlsVerify === "true"} onChange={(e) => setConfig((c) => ({ ...c, splunkSkipTlsVerify: e.target.checked ? "true" : "" }))} style={{ accentColor: "var(--brand)" }} />
              Skip TLS certificate verification (local dev only)
            </label>
            <button onClick={testSplunk} disabled={testing.splunk === true} style={{ ...linkBtn, padding: "8px 14px", alignSelf: "flex-start" }}>{testing.splunk === true ? <Spinner size={14} /> : "Test Splunk connections"}</button>
          </div>

          {/* AI */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tx-hi)" }}>AI Provider</span>
            <input type="password" value={config.deepseekApiKey} onChange={(e) => setConfig((c) => ({ ...c, deepseekApiKey: e.target.value }))} placeholder="DeepSeek API Key (optional)" style={inputStyle} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
            <button onClick={saveConfig} disabled={testing.saving} style={{ ...linkBtn, padding: "10px 18px", background: "var(--brand)", color: "#fff", borderColor: "var(--brand)", fontWeight: 600 }}>
              {testing.saving ? <Spinner size={14} /> : "Save configuration"}
            </button>
            {testing.saved === true && <Tag tone="safe">{testing.savedMsg}</Tag>}
            {testing.saved === false && <Tag tone="crit">{testing.savedMsg}</Tag>}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ color: "var(--brand-2)" }}><Icon name="inventory" size={20} /></span>
          <span style={{ fontWeight: 600, color: "var(--tx-hi)", fontSize: 15 }}>Selected repositories</span>
          {Array.isArray(config.selectedRepos) && config.selectedRepos.length > 0 && (
            <Tag tone="brand">{config.selectedRepos.length} saved</Tag>
          )}
        </div>

        {!config.githubOrg ? (
          <div style={{ fontSize: 13, color: "var(--tx-mut)" }}>
            Set a GitHub organization above to manage selected repositories.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {reposLoading && <div style={{ color: "var(--tx-mut)", fontSize: 13 }}><Spinner size={14} /> Loading repositories…</div>}
            {!reposLoading && repos.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: 8 }}>
                {repos.map((r) => (
                  <label key={r.fullName} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                    background: selected.has(r.fullName) ? "var(--brand-dim)" : "transparent",
                  }}>
                    <input type="checkbox" checked={selected.has(r.fullName)} onChange={() => toggleRepo(r.fullName)} style={{ accentColor: "var(--brand)" }} />
                    <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--tx-hi)", flex: 1 }}>{r.fullName}</span>
                    {r.language && <Tag tone="brand" mono>{r.language}</Tag>}
                  </label>
                ))}
              </div>
            )}
            {!reposLoading && repos.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--tx-mut)" }}>No repositories found for <strong>{config.githubOrg}</strong>.</div>
            )}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={saveRepoSelection} disabled={savingRepos || scanningRepos} style={{ ...linkBtn, padding: "10px 18px", background: "var(--brand)", color: "#fff", borderColor: "var(--brand)", fontWeight: 600, fontSize: 14 }}>
                {savingRepos ? <Spinner size={14} /> : <Icon name="check" size={14} />} Save selection
              </button>
              <button onClick={runSelectedScan} disabled={scanningRepos || selected.size === 0} style={{ ...linkBtn, padding: "10px 18px" }}>
                {scanningRepos ? <Spinner size={14} /> : <Icon name="zap" size={14} />} Scan {selected.size} repo{selected.size !== 1 ? "s" : ""}
              </button>
              {testing.reposSaved === true && <Tag tone="safe">{testing.reposSavedMsg}</Tag>}
              {testing.reposSaved === false && <Tag tone="crit">{testing.reposSavedMsg}</Tag>}
            </div>
            {scanSummary && !scanSummary.error && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Tag tone="safe">{scanSummary.summary?.success ?? 0} scanned</Tag>
                <Tag tone={(scanSummary.summary?.critical ?? 0) > 0 ? "crit" : "safe"}>{scanSummary.summary?.critical ?? 0} critical</Tag>
                <Tag tone={(scanSummary.summary?.findings ?? 0) > 0 ? "high" : "safe"}>{scanSummary.summary?.findings ?? 0} findings</Tag>
              </div>
            )}
            {scanSummary?.error && <Tag tone="crit">{scanSummary.error}</Tag>}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tx-hi)", marginBottom: 10 }}>Ingestion guides</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Network (Zeek) → crypto_net", desc: "Forward ssl.log and x509.log to Splunk HEC with sourcetype zeroq:tls_connection." },
            { label: "Certificates → crypto_pki", desc: "Export X.509 metadata (subject, alg, bits, expiry) to Splunk HEC with sourcetype zeroq:cert." },
            { label: "HNDL → crypto_hndl", desc: "Send anomaly events (dst, volume, deviation) to Splunk HEC with sourcetype zeroq:hndl_event." },
          ].map((g) => (
            <div key={g.label} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 12px", background: "var(--bg-inset)", borderRadius: 9, border: "1px solid var(--line)" }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--tx-hi)" }}>{g.label}</span>
              <span style={{ fontSize: 12, color: "var(--tx-mut)" }}>{g.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
