"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo, Icon, Spinner, Tag, linkBtn } from "../primitives";

/* ============================================================
   Onboarding Wizard — guides first-time enterprise users
   through connecting GitHub org, Splunk, and AI.
   ============================================================ */

const STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "github", label: "GitHub" },
  { id: "splunk", label: "Splunk" },
  { id: "scan", label: "Repositories" },
  { id: "ai", label: "AI Setup" },
];

function StepNav({ step, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div style={{
            width: 32, height: 32, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 600,
            background: i <= step ? "var(--brand)" : "var(--bg-2)",
            color: i <= step ? "#fff" : "var(--tx-mut)",
            border: `1px solid ${i <= step ? "var(--brand)" : "var(--line)"}`,
          }}>{i + 1}</div>
          {i < total - 1 && (
            <div style={{ flex: 1, height: 2, background: i < step ? "var(--brand)" : "var(--line)", borderRadius: 2 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Input({ label, type = "text", value, onChange, placeholder, disabled }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--tx-hi)" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          padding: "0 14px", height: 42, background: "var(--bg-inset)", border: "1px solid var(--line)",
          borderRadius: 10, color: "var(--tx)", fontFamily: "var(--font)", fontSize: 13, outline: "none",
        }}
      />
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div className="card" style={{ padding: 28, maxWidth: 720, width: "100%", ...style }}>
      {children}
    </div>
  );
}

/* ---------------- Welcome ---------------- */
function WelcomeStep({ onNext }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "var(--tx-hi)" }}>Welcome to Crypto-Agility Monitor</h1>
      <p style={{ fontSize: 14.5, color: "var(--tx-mut)", lineHeight: 1.6, margin: 0 }}>
        This tool inventories every quantum-vulnerable cipher across your <strong>code</strong> and <strong>network</strong>,
        then produces a prioritized migration plan backed by your Splunk instance.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
        {[
          "Connect your GitHub organization to scan repositories",
          "Link your existing Splunk instance for network & PKI data",
          "Configure AI to generate migration roadmaps",
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--tx)" }}>
            <span style={{ width: 20, height: 20, borderRadius: 999, background: "var(--safe-bg)", border: "1px solid var(--safe-line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--safe)", fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
            {t}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={onNext} style={{ ...linkBtn, padding: "10px 18px", background: "var(--brand)", color: "#fff", borderColor: "var(--brand)", fontWeight: 600, fontSize: 14 }}>
          Get started <Icon name="chevron" size={14} />
        </button>
      </div>
    </div>
  );
}

/* ---------------- GitHub ---------------- */
function GitHubStep({ config, setConfig, onNext }) {
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  async function testToken() {
    setTesting(true); setTestOk(null);
    try {
      const res = await fetch("/api/onboarding/test-github", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: config.githubToken }),
      });
      const data = await res.json();
      setTestOk(data.ok ? { ok: true, login: data.login } : { ok: false, error: data.error });
      if (data.ok) loadOrgs(config.githubToken);
    } catch (e) {
      setTestOk({ ok: false, error: e?.message || "Network error" });
    } finally { setTesting(false); }
  }

  async function loadOrgs(token) {
    setLoadingOrgs(true);
    try {
      const res = await fetch(`/api/github/orgs?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      setOrgs(data.data || []);
    } catch { setOrgs([]); }
    finally { setLoadingOrgs(false); }
  }

  useEffect(() => {
    if (config.githubToken && config.githubToken.startsWith("ghp_")) {
      testToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--tx-hi)" }}>Connect GitHub</h2>
      <p style={{ fontSize: 13.5, color: "var(--tx-mut)", margin: 0 }}>
        We need a Personal Access Token to list your organization repositories and scan them for quantum-vulnerable crypto.
        The token needs <code style={{ background: "var(--bg-inset)", padding: "1px 5px", borderRadius: 5, fontSize: 12 }}>repo</code> scope for private repos, or no scope for public repos only.
      </p>
      <Input label="GitHub Personal Access Token" type="password" value={config.githubToken} onChange={(v) => { setConfig((c) => ({ ...c, githubToken: v })); setTestOk(null); setOrgs([]); }} placeholder="ghp_xxxxxxxxxxxx" />
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={testToken} disabled={testing || !config.githubToken} style={{ ...linkBtn, padding: "8px 14px" }}>
          {testing ? <Spinner size={14} /> : <Icon name="refresh" size={14} />} Test connection
        </button>
        {testOk && (
          <Tag tone={testOk.ok ? "safe" : "crit"}>{testOk.ok ? `Connected as ${testOk.login}` : testOk.error}</Tag>
        )}
      </div>

      {orgs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--tx-hi)" }}>Select organization</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {orgs.map((o) => (
              <button key={o.login} onClick={() => setConfig((c) => ({ ...c, githubOrg: o.login }))}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
                  border: `1px solid ${config.githubOrg === o.login ? "var(--brand)" : "var(--line)"}`,
                  background: config.githubOrg === o.login ? "var(--brand-dim)" : "var(--bg-2)",
                  cursor: "pointer", color: "var(--tx)", fontFamily: "var(--font)", fontSize: 13,
                }}>
                {o.avatar_url && <img src={o.avatar_url} alt="" width={24} height={24} style={{ borderRadius: 6 }} />}
                <span style={{ fontWeight: 600 }}>{o.login}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onNext} disabled={!testOk?.ok} style={{ ...linkBtn, padding: "10px 18px", background: "var(--brand)", color: "#fff", borderColor: "var(--brand)", fontWeight: 600, fontSize: 14 }}>
          Continue <Icon name="chevron" size={14} />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Splunk ---------------- */
function SplunkStep({ config, setConfig, onNext }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  async function testConnection() {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch("/api/onboarding/test-splunk", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          hecUrl: config.splunkHecUrl,
          hecToken: config.splunkHecToken,
          baseUrl: config.splunkBaseUrl,
          username: config.splunkUsername,
          password: config.splunkPassword,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e) {
      setTestResult({ ok: false, error: e?.message || "Network error" });
    } finally { setTesting(false); }
  }

  const hecOk = testResult?.checks?.hec?.ok;
  const restOk = testResult?.checks?.rest?.ok;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--tx-hi)" }}>Connect Splunk</h2>
      <p style={{ fontSize: 13.5, color: "var(--tx-mut)", margin: 0 }}>
        Link your existing Splunk Cloud or Enterprise instance. The app will read network inventory, certificates, and HNDL data from Splunk Search API, and push code findings via HEC.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--tx-hi)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="globe" size={14} /> HTTP Event Collector (write)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="HEC URL" value={config.splunkHecUrl} onChange={(v) => setConfig((c) => ({ ...c, splunkHecUrl: v }))} placeholder="https://tenant.splunkcloud.com:8088" />
          <Input label="HEC Token" type="password" value={config.splunkHecToken} onChange={(v) => setConfig((c) => ({ ...c, splunkHecToken: v }))} placeholder="abcd1234-..." />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--tx-hi)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="search" size={14} /> REST Search API (read)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Base URL" value={config.splunkBaseUrl} onChange={(v) => setConfig((c) => ({ ...c, splunkBaseUrl: v }))} placeholder="https://tenant.splunkcloud.com" />
          <Input label="Username" value={config.splunkUsername} onChange={(v) => setConfig((c) => ({ ...c, splunkUsername: v }))} placeholder="cam_api" />
          <Input label="Password" type="password" value={config.splunkPassword} onChange={(v) => setConfig((c) => ({ ...c, splunkPassword: v }))} placeholder="" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={testConnection} disabled={testing} style={{ ...linkBtn, padding: "8px 14px" }}>
          {testing ? <Spinner size={14} /> : <Icon name="refresh" size={14} />} Test connections
        </button>
        {testResult && (
          <div style={{ display: "flex", gap: 8 }}>
            <Tag tone={hecOk ? "safe" : "crit"}>{hecOk ? "HEC OK" : "HEC fail"}</Tag>
            <Tag tone={restOk ? "safe" : "crit"}>{restOk ? "REST OK" : "REST fail"}</Tag>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onNext} disabled={!testResult?.ok} style={{ ...linkBtn, padding: "10px 18px", background: "var(--brand)", color: "#fff", borderColor: "var(--brand)", fontWeight: 600, fontSize: 14 }}>
          Continue <Icon name="chevron" size={14} />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Scan Repos ---------------- */
function ScanStep({ config, onNext }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    if (!config.githubOrg || !config.githubToken) return;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/github/repos?org=${encodeURIComponent(config.githubOrg)}&token=${encodeURIComponent(config.githubToken)}`);
        const data = await res.json();
        const list = data.data || [];
        setRepos(list);
        if (list.length <= 10) setSelected(new Set(list.map((r) => r.fullName)));
      } catch { setRepos([]); }
      finally { setLoading(false); }
    }
    load();
  }, [config.githubOrg, config.githubToken]);

  async function runScan() {
    const targets = Array.from(selected);
    if (targets.length === 0) return;
    setScanning(true); setScanResult(null);
    try {
      const res = await fetch("/api/scan-batch", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ repos: targets }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch (e) {
      setScanResult({ error: e?.message || "Batch scan failed" });
    } finally { setScanning(false); }
  }

  const toggle = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--tx-hi)" }}>Select repositories to scan</h2>
      <p style={{ fontSize: 13.5, color: "var(--tx-mut)", margin: 0 }}>
        We found {repos.length} repositories in <strong>{config.githubOrg}</strong>. Select the ones you want to scan for quantum-vulnerable cryptography.
      </p>

      {loading && <div style={{ color: "var(--tx-mut)", fontSize: 13 }}><Spinner size={14} /> Loading repositories…</div>}

      {!loading && repos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: 8 }}>
          {repos.map((r) => (
            <label key={r.fullName} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer",
              background: selected.has(r.fullName) ? "var(--brand-dim)" : "transparent",
            }}>
              <input type="checkbox" checked={selected.has(r.fullName)} onChange={() => toggle(r.fullName)} style={{ accentColor: "var(--brand)" }} />
              <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--tx-hi)", flex: 1 }}>{r.fullName}</span>
              {r.language && <Tag tone="brand" mono>{r.language}</Tag>}
            </label>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={runScan} disabled={scanning || selected.size === 0} style={{ ...linkBtn, padding: "10px 18px", background: "var(--brand)", color: "#fff", borderColor: "var(--brand)", fontWeight: 600, fontSize: 14 }}>
          {scanning ? <Spinner size={14} /> : <Icon name="zap" size={14} />} Scan {selected.size} repo{selected.size !== 1 ? "s" : ""}
        </button>
        <button onClick={onNext} style={{ ...linkBtn, padding: "10px 18px" }}>Skip for now</button>
      </div>

      {scanResult && !scanResult.error && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Tag tone="safe">{scanResult.summary.success} scanned</Tag>
          <Tag tone={scanResult.summary.critical > 0 ? "crit" : "safe"}>{scanResult.summary.critical} critical</Tag>
          <Tag tone={scanResult.summary.findings > 0 ? "high" : "safe"}>{scanResult.summary.findings} findings</Tag>
        </div>
      )}
      {scanResult?.error && <Tag tone="crit">{scanResult.error}</Tag>}
    </div>
  );
}

/* ---------------- AI Setup ---------------- */
function AIStep({ config, setConfig, onFinish }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveAndFinish() {
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding/config", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          githubToken: config.githubToken,
          splunkHecUrl: config.splunkHecUrl,
          splunkHecToken: config.splunkHecToken,
          splunkBaseUrl: config.splunkBaseUrl,
          splunkUsername: config.splunkUsername,
          splunkPassword: config.splunkPassword,
          anthropicApiKey: config.anthropicApiKey,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSaved(true);
        setTimeout(() => onFinish(), 1200);
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--tx-hi)" }}>AI Configuration</h2>
      <p style={{ fontSize: 13.5, color: "var(--tx-mut)", margin: 0 }}>
        Choose the AI engine that will generate your migration plans and answer questions about your posture.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { key: "anthropic", label: "Anthropic Claude", desc: "Best reasoning. Requires API key.", available: true },
          { key: "local", label: "Local Reasoner", desc: "Deterministic fallback. No API key needed.", available: true },
          { key: "splunk", label: "Splunk AI Assistant", desc: "Coming soon. Will use on-platform Splunk AI.", available: false },
        ].map((opt) => (
          <button key={opt.key} onClick={() => opt.available && setConfig((c) => ({ ...c, aiProvider: opt.key }))}
            disabled={!opt.available}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "12px 14px", borderRadius: 10,
              border: `1px solid ${config.aiProvider === opt.key ? "var(--brand)" : "var(--line)"}`,
              background: config.aiProvider === opt.key ? "var(--brand-dim)" : "var(--bg-2)",
              cursor: opt.available ? "pointer" : "default", opacity: opt.available ? 1 : 0.6,
              color: "var(--tx)", fontFamily: "var(--font)", textAlign: "left", width: "100%",
            }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx-hi)" }}>{opt.label}</div>
            <div style={{ fontSize: 12.5, color: "var(--tx-mut)" }}>{opt.desc}</div>
          </button>
        ))}
      </div>

      {config.aiProvider === "anthropic" && (
        <Input label="Anthropic API Key" type="password" value={config.anthropicApiKey} onChange={(v) => setConfig((c) => ({ ...c, anthropicApiKey: v }))} placeholder="sk-ant-..." />
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={saveAndFinish} disabled={saving || saved} style={{ ...linkBtn, padding: "10px 18px", background: saved ? "var(--safe)" : "var(--brand)", color: "#fff", borderColor: saved ? "var(--safe)" : "var(--brand)", fontWeight: 600, fontSize: 14 }}>
          {saving ? <Spinner size={14} /> : saved ? <><Icon name="check" size={14} /> Saved</> : <>Finish setup <Icon name="check" size={14} /></>}
        </button>
      </div>

      <p style={{ fontSize: 12, color: "var(--tx-dim)", margin: 0 }}>
        Note: after saving, restart <code style={{ fontSize: 11 }}>npm run dev</code> for all environment variables to take effect.
      </p>
    </div>
  );
}

/* ---------------- Main Wizard ---------------- */
export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    githubToken: "",
    githubOrg: "",
    splunkHecUrl: "",
    splunkHecToken: "",
    splunkBaseUrl: "",
    splunkUsername: "",
    splunkPassword: "",
    anthropicApiKey: "",
    aiProvider: "anthropic",
  });

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const finish = () => router.push("/app");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-0)", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Logo size={32} />
        <span style={{ fontWeight: 600, color: "var(--tx-hi)", fontSize: 15 }}>Crypto-Agility Monitor</span>
      </div>
      <Card>
        <StepNav step={step} total={STEPS.length} />
        {step === 0 && <WelcomeStep onNext={next} />}
        {step === 1 && <GitHubStep config={config} setConfig={setConfig} onNext={next} />}
        {step === 2 && <SplunkStep config={config} setConfig={setConfig} onNext={next} />}
        {step === 3 && <ScanStep config={config} onNext={next} />}
        {step === 4 && <AIStep config={config} setConfig={setConfig} onFinish={finish} />}
      </Card>
    </div>
  );
}
