"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { TONE, Icon, Logo, Tag, iconBtn } from "./primitives";
import { useSplunkData } from "./client";
import { Dashboard, Inventory, CertPlanner, HndlDetect } from "./screens/Monitor";
import { Repos, Agent } from "./screens/Source";
import { Assistant, Roadmap, Compliance } from "./screens/Intel";
import { OrgPlan, Architecture, Settings } from "./screens/Platform";
import { apiRisk } from "./client";

const NAV = [
  { group: "Monitor", items: [
    { id: "dashboard", label: "Risk Dashboard", icon: "dashboard" },
    { id: "inventory", label: "Crypto Inventory", icon: "inventory" },
    { id: "certs", label: "Certificate Planner", icon: "cert" },
  ]},
  { group: "Sources", items: [
    { id: "repos", label: "Repository Scanner", icon: "inventory" },
    { id: "agent", label: "AI Agent", icon: "ai" },
    { id: "plan", label: "Org Security Plan", icon: "roadmap" },
  ]},
  { group: "Detect", items: [
    { id: "hndl", label: "HNDL Detection", icon: "radar", alert: true },
  ]},
  { group: "Act", items: [
    { id: "assistant", label: "AI Assistant", icon: "ai" },
    { id: "roadmap", label: "Migration Roadmap", icon: "roadmap" },
    { id: "compliance", label: "Compliance", icon: "shield" },
  ]},
  { group: "Platform", items: [
    { id: "settings", label: "Settings", icon: "lock" },
    { id: "architecture", label: "Architecture", icon: "roadmap" },
  ]},
];

const TITLES = {
  dashboard: ["Quantum Risk Dashboard", "Real-time crypto-agility posture across the network"],
  inventory: ["Crypto Inventory", "Every cipher suite & TLS profile observed on the wire"],
  certs: ["Certificate Migration Planner", "Quantum-vulnerable certificates ranked by expiry"],
  repos: ["Repository Scanner", "Live-scan any public GitHub or GitLab repo for crypto-in-code"],
  agent: ["AI Agent", "The agentic loop running on Splunk — ingest, detect, correlate, reason, act"],
  plan: ["Org Security Plan", "AI-generated, prioritized remediation across your whole organization"],
  hndl: ["Harvest-Now-Decrypt-Later Detection", "Anomalous encrypted egress that conventional SIEM misses"],
  assistant: ["AI Assistant", "Natural-language queries over your crypto posture"],
  roadmap: ["AI Migration Roadmap", "Prioritized, plain-English path to quantum-safe"],
  compliance: ["Compliance Mapping", "Findings mapped to NIST, NSA & CISA deadlines"],
  settings: ["Settings", "Manage connections to GitHub, Splunk and AI"],
  architecture: ["Architecture", "How the app runs on Splunk — install, configure, done"],
};

function Screen({ id, go }) {
  switch (id) {
    case "dashboard": return <Dashboard go={go} />;
    case "inventory": return <Inventory />;
    case "certs": return <CertPlanner />;
    case "repos": return <Repos go={go} />;
    case "agent": return <Agent />;
    case "plan": return <OrgPlan go={go} />;
    case "hndl": return <HndlDetect />;
    case "assistant": return <Assistant />;
    case "roadmap": return <Roadmap />;
    case "compliance": return <Compliance />;
    case "settings": return <Settings />;
    case "architecture": return <Architecture />;
    default: return <Dashboard go={go} />;
  }
}

function Sidebar({ active, go, splunkLive }) {
  return (
    <aside style={{ width: 244, flexShrink: 0, background: "var(--bg-1)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", height: "100%" }}>
      <Link href="/" style={{ padding: "18px 18px 16px", display: "flex", alignItems: "center", gap: 11, borderBottom: "1px solid var(--line)", textDecoration: "none" }}>
        <Logo size={32} />
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 600, color: "var(--tx-hi)", fontSize: 14 }}>Crypto-Agility</div>
          <div style={{ fontSize: 11, color: "var(--tx-mut)", letterSpacing: ".04em" }}>MONITOR</div>
        </div>
      </Link>
      <nav style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 18 }}>
        {NAV.map((sec) => (
          <div key={sec.group}>
            <div className="eyebrow" style={{ padding: "0 10px 8px" }}>{sec.group}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sec.items.map((it) => {
                const on = active === it.id;
                return (
                  <button key={it.id} onClick={() => go(it.id)} className={"cam-nav-btn" + (on ? " active" : "")} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 10px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "var(--font)", fontSize: 13.5, fontWeight: 500, textAlign: "left", width: "100%", position: "relative", color: on ? "var(--tx-hi)" : "var(--tx-mut)" }}>
                    <span style={{ color: on ? "var(--brand-2)" : "var(--tx-dim)", display: "flex" }}><Icon name={it.icon} size={17} fill={it.icon === "ai" ? "currentColor" : "none"} stroke={it.icon === "ai" ? 0 : 1.7} /></span>
                    <span style={{ flex: 1 }}>{it.label}</span>
                    {it.alert && <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--crit)", animation: "pulse-dot 1.6s infinite" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div style={{ padding: 14, borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 10 }}>
        {!splunkLive && (
          <Link href="/onboarding" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--warn-bg)", border: "1px solid var(--warn-line)", borderRadius: 10, textDecoration: "none" }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--warn)", flexShrink: 0 }} />
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 12, color: "var(--tx)", fontWeight: 500 }}>Setup required</div>
              <div style={{ fontSize: 11, color: "var(--tx-mut)" }}>Connect Splunk & GitHub</div>
            </div>
            <span style={{ marginLeft: "auto", color: "var(--warn)" }}><Icon name="chevron" size={12} /></span>
          </Link>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", background: "var(--bg-inset)", border: "1px solid var(--line)", borderRadius: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: splunkLive ? "var(--safe)" : "var(--warn)", animation: splunkLive ? "pulse-dot 1.8s infinite" : "none", flexShrink: 0 }} />
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 12, color: "var(--tx)", fontWeight: 500 }}>{splunkLive ? "Splunk connected" : "Splunk offline"}</div>
            <div style={{ fontSize: 11, color: "var(--tx-mut)" }}>{splunkLive ? "ingesting · search ready" : "seed data mode"}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }}>
          <Tag tone="crit">Security track</Tag>
          <span style={{ fontSize: 11, color: "var(--tx-dim)" }}>Agentic Ops Hackathon</span>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ active, splunkLive }) {
  const [title, sub] = TITLES[active];
  const { data: riskData } = useSplunkData("/api/risk");
  const riskScore = riskData?.riskScore ?? 0;
  const riskBand = riskData?.riskBand ?? "—";
  const band = riskScore >= 60 ? "high" : riskScore >= 35 ? "warn" : "safe";
  const t = TONE[band];
  return (
    <header style={{ display: "flex", alignItems: "center", gap: 16, padding: "15px 26px", borderBottom: "1px solid var(--line)", background: "var(--bg-0)", position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--tx-hi)", letterSpacing: "-.01em" }}>{title}</h1>
        <div style={{ fontSize: 12.5, color: "var(--tx-mut)", marginTop: 2 }}>{sub}</div>
      </div>
      {splunkLive && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 8, background: "var(--safe-bg)", border: "1px solid var(--safe-line)" }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--safe)", animation: "pulse-dot 1.6s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--safe)" }}>Live</span>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 14px 6px 11px", borderRadius: 10, background: t.bg, border: `1px solid ${t.line}` }}>
        <div style={{ position: "relative", width: 9, height: 9 }}>
          <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: t.c, animation: "pulse-dot 2s infinite" }} />
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontSize: 10, color: "var(--tx-dim)", letterSpacing: ".08em" }}>RISK SCORE</div>
          <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: t.c }}>{riskScore || "—"} · {riskBand}</div>
        </div>
      </div>
      <button style={iconBtn}><Icon name="bell" size={17} /><span style={{ position: "absolute", top: 8, right: 9, width: 6, height: 6, borderRadius: 999, background: "var(--crit)" }} /></button>
    </header>
  );
}

export default function AppShell() {
  const [active, setActive] = useState("dashboard");
  const [splunkLive, setSplunkLive] = useState(false);
  const scrollRef = useRef(null);
  const go = (id) => {
    setActive(id);
    try { localStorage.setItem("cam.screen", id); } catch {}
  };
  useEffect(() => {
    try { const s = localStorage.getItem("cam.screen"); if (s && TITLES[s]) setActive(s); } catch {}
  }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [active]);
  useEffect(() => {
    let mounted = true;
    apiRisk().then((d) => { if (mounted) setSplunkLive(!!d?.capabilities?.splunk); }).catch(() => { if (mounted) setSplunkLive(false); });
    return () => { mounted = false; };
  }, []);
  const fullHeight = active === "assistant";

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-0)" }}>
      <Sidebar active={active} go={go} splunkLive={splunkLive} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100%" }}>
        <Topbar active={active} splunkLive={splunkLive} />
        <main ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 26, display: "flex", flexDirection: "column" }}>
          <div key={active} style={{ flex: fullHeight ? 1 : "none", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Screen id={active} go={go} />
          </div>
        </main>
      </div>
    </div>
  );
}
