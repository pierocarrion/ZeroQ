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
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "var(--tx-hi)" }}>Welcome to ZeroQ</h1>
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

  async function testOrg() {
    setTesting(true); setTestOk(null);
    try {
      const res = await fetch("/api/onboarding/test-github", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ org: config.githubOrg }),
      });
      const data = await res.json();
      setTestOk(data.ok ? { ok: true, login: data.login, publicRepos: data.publicRepos } : { ok: false, error: data.error });
    } catch (e) {
      setTestOk({ ok: false, error: e?.message || "Network error" });
    } finally { setTesting(false); }
  }

  useEffect(() => {
    if (config.githubOrg) testOrg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--tx-hi)" }}>GitHub Organization</h2>
      <p style={{ fontSize: 13.5, color: "var(--tx-mut)", margin: 0 }}>
        Enter the GitHub organization name to scan its <strong>public repositories</strong> for quantum-vulnerable cryptography.
        No token or login required — we read public repos directly from GitHub's API.
      </p>
      <Input label="Organization name" value={config.githubOrg} onChange={(v) => { setConfig((c) => ({ ...c, githubOrg: v.trim() })); setTestOk(null); }} placeholder="e.g. facebook, microsoft, vercel" />
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={testOrg} disabled={testing || !config.githubOrg} style={{ ...linkBtn, padding: "8px 14px" }}>
          {testing ? <Spinner size={14} /> : <Icon name="refresh" size={14} />} Check organization
        </button>
        {testOk && (
          <Tag tone={testOk.ok ? "safe" : "crit"}>{testOk.ok ? `${testOk.login} · ${testOk.publicRepos ?? "?"} public repos` : testOk.error}</Tag>
        )}
      </div>

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
          skipTlsVerify: config.splunkSkipTlsVerify === "true",
        }),
      });
      const data = await res.json();
      if (data.checks?.hec?.token) {
        setConfig((c) => ({ ...c, splunkHecToken: data.checks.hec.token }));
      }
      setTestResult(data);
    } catch (e) {
      setTestResult({ ok: false, error: e?.message || "Network error" });
    } finally { setTesting(false); }
  }

  const hecOk = testResult?.checks?.hec?.ok;
  const restOk = testResult?.checks?.rest?.ok;
  const canContinue = testResult && (hecOk || restOk);

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
          <Input label="HEC Token" type="password" value={config.splunkHecToken} onChange={(v) => setConfig((c) => ({ ...c, splunkHecToken: v }))} placeholder="leave empty to auto-create" />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--tx-hi)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="search" size={14} /> REST Search API (read)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Base URL" value={config.splunkBaseUrl} onChange={(v) => setConfig((c) => ({ ...c, splunkBaseUrl: v }))} placeholder="https://tenant.splunkcloud.com:8089" />
          <Input label="Username" value={config.splunkUsername} onChange={(v) => setConfig((c) => ({ ...c, splunkUsername: v }))} placeholder="zeroq_api" />
          <Input label="Password" type="password" value={config.splunkPassword} onChange={(v) => setConfig((c) => ({ ...c, splunkPassword: v }))} placeholder="" />
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--tx-mut)", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={config.splunkSkipTlsVerify === "true"}
          onChange={(e) => setConfig((c) => ({ ...c, splunkSkipTlsVerify: e.target.checked ? "true" : "" }))}
          style={{ accentColor: "var(--brand)" }}
        />
        Skip TLS certificate verification (local dev only)
      </label>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={testConnection} disabled={testing} style={{ ...linkBtn, padding: "8px 14px" }}>
          {testing ? <Spinner size={14} /> : <Icon name="refresh" size={14} />} Test connections
        </button>
        {testResult && (
          <div style={{ display: "flex", gap: 8 }}>
            <Tag tone={hecOk ? "safe" : "crit"}>{hecOk ? "HEC OK" : "HEC fail"}</Tag>
            <Tag tone={restOk ? "safe" : restOk === false ? "warn" : "mut"}>{restOk ? "REST OK" : restOk === false ? "REST unavailable" : "REST untested"}</Tag>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onNext} disabled={!canContinue} style={{ ...linkBtn, padding: "10px 18px", background: "var(--brand)", color: "#fff", borderColor: "var(--brand)", fontWeight: 600, fontSize: 14 }}>
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!config.githubOrg) return;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/github/repos?org=${encodeURIComponent(config.githubOrg)}`);
        const data = await res.json();
        const list = data.data || [];
        setRepos(list);
        const persisted = new Set(config.selectedRepos || []);
        if (persisted.size > 0) {
          setSelected(persisted);
        } else if (list.length <= 10) {
          setSelected(new Set(list.map((r) => r.fullName)));
        } else {
          setSelected(new Set());
        }
      } catch { setRepos([]); }
      finally { setLoading(false); }
    }
    load();
  }, [config.githubOrg, config.selectedRepos]);

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

  async function saveSelection(andContinue = false) {
    setSaving(true);
    try {
      await fetch("/api/onboarding/config", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selectedRepos: Array.from(selected) }),
      });
      if (andContinue) onNext();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  const toggle = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const canScan = selected.size > 0 && !scanning && !saving;
  const skipLabel = selected.size === 0 ? "Skip for now" : "Save selection & continue";

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

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={runScan} disabled={!canScan} style={{ ...linkBtn, padding: "10px 18px", background: canScan ? "var(--brand)" : "var(--bg-2)", color: canScan ? "#fff" : "var(--tx-mut)", borderColor: canScan ? "var(--brand)" : "var(--line)", fontWeight: 600, fontSize: 14 }}>
          {scanning ? <Spinner size={14} /> : <Icon name="zap" size={14} />} Scan {selected.size} repo{selected.size !== 1 ? "s" : ""}
        </button>
        <button onClick={() => saveSelection(true)} disabled={saving || scanning} style={{ ...linkBtn, padding: "10px 18px" }}>
          {saving ? <Spinner size={14} /> : <Icon name="check" size={14} />} {skipLabel}
        </button>
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
          splunkHecUrl: config.splunkHecUrl,
          splunkHecToken: config.splunkHecToken,
          splunkBaseUrl: config.splunkBaseUrl,
          splunkUsername: config.splunkUsername,
          splunkPassword: config.splunkPassword,
          splunkSkipTlsVerify: config.splunkSkipTlsVerify,
          deepseekApiKey: config.deepseekApiKey,
          aiProvider: config.aiProvider,
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
          { key: "deepseek", label: "DeepSeek", desc: "Fast & cost-effective. Requires API key.", available: true },
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

      {config.aiProvider === "deepseek" && (
        <Input label="DeepSeek API Key" type="password" value={config.deepseekApiKey} onChange={(v) => setConfig((c) => ({ ...c, deepseekApiKey: v }))} placeholder="sk-..." />
      )}


      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={saveAndFinish} disabled={saving || saved} style={{ ...linkBtn, padding: "10px 18px", background: saved ? "var(--safe)" : "var(--brand)", color: "#fff", borderColor: saved ? "var(--safe)" : "var(--brand)", fontWeight: 600, fontSize: 14 }}>
          {saving ? <Spinner size={14} /> : saved ? <><Icon name="check" size={14} /> Saved</> : <>Finish setup <Icon name="check" size={14} /></>}
        </button>
      </div>

      <p style={{ fontSize: 12, color: "var(--tx-dim)", margin: 0 }}>
        Configuration is saved to the local SQLite database and takes effect immediately.
      </p>
    </div>
  );
}

/* ---------------- Main Wizard ---------------- */
export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    githubOrg: "",
    selectedRepos: [],
    splunkHecUrl: "https://localhost:8088",
    splunkHecToken: "",
    splunkBaseUrl: "https://localhost:8089",
    splunkUsername: "sc_admin",
    splunkPassword: "j6n7ba2tz1lbm6nb",
    splunkSkipTlsVerify: "true",
    deepseekApiKey: "",
    aiProvider: "deepseek",
  });

  useEffect(() => {
    fetch("/api/onboarding/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
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
            aiProvider: data.aiProvider || c.aiProvider,
          }));
        }
      })
      .catch(() => { /* ignore */ });
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const finish = () => router.push("/app");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-0)", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Logo size={32} />
        <span style={{ fontWeight: 600, color: "var(--tx-hi)", fontSize: 15 }}>ZeroQ</span>
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
