"use client";
import React, { useState } from "react";
import { useSplunkData } from "../client";
import {
  TONE, riskTone, Icon, Panel, RiskPill, Tag, Delta, Gauge, Donut, AreaChart,
  StackedBar, DataTable, StatTile, Bar, linkBtn,
} from "../primitives";

function SourceBadge({ source }) {
  if (!source) return null;
  const live = source === "splunk";
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: live ? "var(--safe)" : "var(--warn)", fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: live ? "var(--safe)" : "var(--warn)", animation: live ? "pulse-dot 1.6s infinite" : "none" }} />
      {live ? "Live · Splunk" : "Demo · seed"}
    </span>
  );
}

/* ---------------- HNDL banner ---------------- */
function HndlBanner({ onView }) {
  const { data: anomalies } = useSplunkData("/api/hndl");
  const a = anomalies && anomalies.length ? anomalies[0] : null;
  if (!a) return null;
  return (
    <div className="card" style={{ borderColor: "var(--crit-line)", background: "linear-gradient(110deg, #1a0f17, #0e1320 55%)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 18, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(420px 90px at 8% 50%, var(--crit-bg), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, flexShrink: 0 }}>
        <span style={{ position: "absolute", width: 42, height: 42, borderRadius: 999, border: "1px solid var(--crit-line)", animation: "pulse-dot 2s infinite" }} />
        <span style={{ color: "var(--crit)", display: "flex" }}><Icon name="radar" size={22} /></span>
      </div>
      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
          <span style={{ fontWeight: 700, color: "var(--tx-hi)", fontSize: 14.5 }}>Harvest-Now-Decrypt-Later signal detected</span>
          <Tag tone="crit">ACTIVE</Tag>
        </div>
        <div style={{ fontSize: 13, color: "var(--tx-mut)" }}>
          <span className="mono" style={{ color: "var(--tx)" }}>{a.volume}</span> of encrypted egress to first-seen destination <span className="mono" style={{ color: "var(--tx)" }}>{a.dst}</span> ({a.geo}) — <span style={{ color: "var(--crit)" }}>{a.deviation}× baseline</span>. Conventional SIEM rules don&apos;t flag this.
        </div>
      </div>
      <button onClick={onView} style={{ flexShrink: 0, padding: "9px 16px", borderRadius: 9, border: "1px solid var(--crit-line)", background: "var(--crit-bg)", color: "var(--crit)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "var(--font)", display: "flex", alignItems: "center", gap: 7 }}>Investigate <Icon name="chevron" size={15} /></button>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
export function Dashboard({ go }) {
  const { data: riskData, source } = useSplunkData("/api/risk");
  const s = riskData || { riskScore: 0, band: "—", lastMonth: 0, breakdown: [] };
  const legend = (s.breakdown || []).map((b) => ({ ...b, label: b.label || b.key, color: b.color || "var(--tx-dim)" }));

  const { data: algoMix, source: algoSource } = useSplunkData("/api/algo-mix");
  const { data: topAssets } = useSplunkData("/api/top-assets");
  const { data: trends } = useSplunkData("/api/trends");

  const noData = source !== "splunk" && !riskData?.riskScore;
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <HndlBanner onView={() => go("hndl")} />
      {noData && (
        <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, background: "var(--warn-bg)", borderColor: "var(--warn-line)" }}>
          <span style={{ color: "var(--warn)", display: "flex" }}><Icon name="alert" size={22} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx-hi)" }}>No live data connected</div>
            <div style={{ fontSize: 12.5, color: "var(--tx-mut)", marginTop: 2 }}>
              Connect Splunk to see real network inventory, certificates and risk scores. <a href="/onboarding" style={{ color: "var(--brand-2)", textDecoration: "none" }}>Start setup →</a>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SourceBadge source={source} />
        {algoSource && <SourceBadge source={algoSource} />}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "300px 280px 1fr", gap: 16 }}>
        <Panel title="Quantum Risk Score" subtitle="Weighted by asset sensitivity & exposure" pad={10}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Gauge value={s.riskScore} band={s.riskBand} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--tx-mut)" }}>
              <Delta value={s.riskScore - s.lastMonth} invert /> vs last month <span style={{ color: "var(--tx-dim)" }}>·</span> was {s.lastMonth}
            </div>
          </div>
        </Panel>
        <Panel title="Connection profiles" subtitle="By quantum risk tier" pad={16}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Donut data={legend.map((l) => ({ value: l.value, color: l.color }))} />
            <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
              {legend.map((l) => (
                <div key={l.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: l.color }} />
                  <span style={{ color: "var(--tx)", flex: 1 }}>{l.label}</span>
                  <span className="mono tnum" style={{ color: "var(--tx-hi)", fontWeight: 600 }}>{l.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 16 }}>
          <StatTile label="Endpoints scanned" value={s.endpointsScanned ? s.endpointsScanned.toLocaleString() : "—"} icon="globe" sub={<span>{s.coverage != null ? <span style={{ color: "var(--safe)" }}>{s.coverage}%</span> : <span style={{ color: "var(--tx-dim)" }}>—</span>} network coverage</span>} tone="brand" />
          <StatTile label="Connections / 24h" value={s.connectionsObserved ? (s.connectionsObserved / 1_000_000).toFixed(2) : "—"} unit="M" icon="zap" sub="passively observed via Zeek" tone="brand" />
          <StatTile label="Certificates at risk" value={s.certsTracked ? String(s.certsTracked) : "—"} icon="cert" tone="high" sub={<span style={{ color: "var(--high)" }}>{s.certsTracked ? "Expiring soon" : "No data"}</span>} />
          <StatTile label="Critical exposures" value={legend.find((x) => x.key === "critical")?.value ?? "—"} icon="alert" tone="crit" sub={<Delta value={-4} invert />} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16 }}>
        <Panel title="Quantum risk trend" subtitle="12-week score · lower is safer" right={<Tag tone="safe">▼ 20 pts since Q1</Tag>}>
          <AreaChart data={trends?.riskTrend || []} color="var(--brand)" height={150} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--tx-dim)", marginTop: 4, fontFamily: "var(--mono)" }}>
            <span>12 wks ago</span><span>9</span><span>6</span><span>3</span><span>now</span>
          </div>
        </Panel>
        <Panel title="Algorithm exposure" subtitle="Share of observed key exchanges">
          <StackedBar data={algoMix || []} />
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 16 }}>
            {(algoMix || []).map((a) => (
              <div key={a.algo} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: TONE[riskTone[a.risk]].c }} />
                <span className="mono" style={{ color: "var(--tx)", flex: 1, fontSize: 12 }}>{a.algo}</span>
                <span className="mono tnum" style={{ color: "var(--tx-mut)" }}>{a.pct}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Highest-risk assets" subtitle="Ranked by sensitivity × quantum exposure" pad={0}
        right={<button onClick={() => go("repos")} style={linkBtn}>Repository scanner <Icon name="chevron" size={14} /></button>}>
        <DataTable
          cols={[
            { k: "name", label: "Asset", mono: true, grow: true },
            { k: "risk", label: "Risk", render: (r) => <RiskPill risk={r.risk} small /> },
            { k: "algo", label: "Vulnerable algorithm", mono: true },
            { k: "hosts", label: "Hosts", align: "right", mono: true },
            { k: "txns", label: "Traffic", align: "right", mono: true, mut: true },
            { k: "sensitivity", label: "Classification" },
          ]}
          rows={topAssets || []}
        />
      </Panel>
    </div>
  );
}

/* ---------------- Inventory ---------------- */
export function Inventory() {
  const [risk, setRisk] = useState("all");
  const [q, setQ] = useState("");
  const { data: liveRows, source } = useSplunkData("/api/inventory");
  const all = liveRows || [];
  const rows = all.filter((r) => (risk === "all" || r.risk === risk) && (q === "" || (r.server + r.cipher + r.dst + r.src).toLowerCase().includes(q.toLowerCase())));
  const counts = { all: all.length };
  ["critical", "high", "monitor", "safe"].forEach((k) => (counts[k] = all.filter((r) => r.risk === k).length));
  const filters = [
    { k: "all", label: "All" }, { k: "critical", label: "Critical" }, { k: "high", label: "High" },
    { k: "monitor", label: "Monitor" }, { k: "safe", label: "Safe" },
  ];
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, padding: 4, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 10 }}>
          {filters.map((f) => {
            const active = risk === f.k;
            const t = f.k === "all" ? TONE.brand : TONE[riskTone[f.k]];
            return (
              <button key={f.k} onClick={() => setRisk(f.k)} style={{ padding: "7px 13px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "var(--font)", fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, background: active ? t.bg : "transparent", color: active ? t.c : "var(--tx-mut)", boxShadow: active ? `inset 0 0 0 1px ${t.line}` : "none" }}>
                {f.label}<span className="mono tnum" style={{ fontSize: 11, opacity: .8 }}>{counts[f.k]}</span>
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <SourceBadge source={source} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", height: 38, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 10, width: 280 }}>
          <Icon name="search" size={15} style={{ color: "var(--tx-dim)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by host, cipher, IP…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--tx)", fontFamily: "var(--font)", fontSize: 13 }} />
        </div>
      </div>
      <Panel pad={0} title="Live cipher & TLS inventory" subtitle={`${rows.length} connection profiles · sourced from zeek:ssl`}
        right={<span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--tx-mut)" }}><span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--safe)", animation: "pulse-dot 1.6s infinite" }} />streaming</span>}>
        <DataTable
          cols={[
            { k: "server", label: "Server name", mono: true, grow: true },
            { k: "risk", label: "Risk", render: (r) => <RiskPill risk={r.risk} small /> },
            { k: "version", label: "TLS", mono: true },
            { k: "cipher", label: "Cipher suite", mono: true },
            { k: "curve", label: "Curve / KEM", mono: true, render: (r) => <span style={{ color: r.curve === "X25519MLKEM768" ? "var(--safe)" : r.curve === "—" ? "var(--tx-dim)" : "var(--high)" }}>{r.curve}</span> },
            { k: "src", label: "Src", mono: true, mut: true },
            { k: "dst", label: "Dst", mono: true, mut: true },
            { k: "seen", label: "Seen", align: "right", mono: true, mut: true, render: (r) => <span>{r.seen}{typeof r.seen === "string" && !r.seen.endsWith("ago") ? " ago" : ""}</span> },
          ]}
          rows={rows}
        />
      </Panel>
      <div className="card" style={{ padding: 16, display: "flex", gap: 14, alignItems: "flex-start" }}>
        <span style={{ color: "var(--tx-dim)", marginTop: 1 }}><Icon name="lock" size={17} /></span>
        <div style={{ fontSize: 12.5, color: "var(--tx-mut)", lineHeight: 1.55 }}>
          Inventory is built <strong style={{ color: "var(--tx)" }}>passively</strong> from TLS handshake metadata — Zeek writes <span className="mono" style={{ color: "var(--tx)" }}>ssl.log</span> without decrypting any traffic. Only the publicly-visible cipher suite, version, curve and SNI are read.
        </div>
      </div>
    </div>
  );
}

/* ---------------- Certificate planner ---------------- */
const URGENCY = {
  renew: { tone: "crit", label: "Renew now · PQC" },
  plan: { tone: "high", label: "Plan migration" },
  monitor: { tone: "warn", label: "Monitor" },
  done: { tone: "safe", label: "PQC ready" },
};
export function CertPlanner() {
  const [sort, setSort] = useState("expiry");
  const { data: liveCerts, source } = useSplunkData("/api/certs");
  const certs = liveCerts || [];
  const rows = [...certs].sort((a, b) => (sort === "expiry" ? a.expiry - b.expiry : a.subject.localeCompare(b.subject)));
  const isPQC = (a) => a === "ML-DSA-65";
  const keyLabel = (c) => (isPQC(c.alg) ? "ML-DSA-65" : c.alg === "rsaEncryption" ? `RSA-${c.bits}` : `ECC P-${c.bits}`);
  const keyTone = (c) => (isPQC(c.alg) ? "safe" : c.alg === "rsaEncryption" ? "crit" : "high");

  const buckets = [
    { label: "< 30d", tone: "crit", count: certs.filter((c) => c.expiry < 30).length },
    { label: "30-90d", tone: "high", count: certs.filter((c) => c.expiry >= 30 && c.expiry < 90).length },
    { label: "90-365d", tone: "warn", count: certs.filter((c) => c.expiry >= 90 && c.expiry < 365).length },
    { label: "> 1yr", tone: "safe", count: certs.filter((c) => c.expiry >= 365).length },
  ];
  const maxCount = Math.max(...buckets.map((x) => x.count), 1);

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SourceBadge source={source} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        <Panel title="Certificate expiry runway" subtitle="Quantum-vulnerable certs by time-to-expiry">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 140, padding: "8px 4px 0" }}>
            {buckets.map((b) => {
              const t = TONE[b.tone];
              return (
                <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
                  <span className="mono tnum" style={{ fontSize: 18, fontWeight: 600, color: t.c }}>{b.count}</span>
                  <div style={{ width: "100%", height: `${(b.count / maxCount) * 100}%`, minHeight: 6, background: `linear-gradient(180deg, ${t.c}, ${t.c}44)`, borderRadius: "6px 6px 2px 2px", boxShadow: `0 0 18px -6px ${t.c}` }} />
                  <span style={{ fontSize: 11.5, color: "var(--tx-mut)", fontFamily: "var(--mono)" }}>{b.label}</span>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Renew-with-PQC opportunity" subtitle="Avoid a second migration">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span className="mono" style={{ fontSize: 34, fontWeight: 600, color: "var(--tx-hi)" }}>{buckets[0].count + buckets[1].count}</span>
              <span style={{ color: "var(--tx-mut)", fontSize: 13.5 }}>certs expiring in &lt; 90 days are still RSA</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--tx-mut)", lineHeight: 1.6 }}>
              Each forced renewal is a free migration window. Re-issuing these with <span className="mono" style={{ color: "var(--safe)" }}>ML-DSA-65</span> now avoids re-touching them in 2027.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[["RSA today", certs.filter((c) => c.alg === "rsaEncryption").length, "crit"], ["PQC ready", certs.filter((c) => c.alg === "ML-DSA-65").length, "safe"], ["ECC", certs.filter((c) => c.alg === "id-ecPublicKey").length, "high"]].map(([k, v, tone]) => (
                <div key={k} style={{ flex: 1, padding: 12, background: "var(--bg-inset)", borderRadius: 10, border: "1px solid var(--line)" }}>
                  <div className="eyebrow">{k}</div>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: TONE[tone].c, marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
      <Panel pad={0} title="Certificate inventory" subtitle="From PKI logs, CT logs & zeek:x509"
        right={<div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setSort("expiry")} style={{ ...linkBtn, color: sort === "expiry" ? "var(--brand-2)" : "var(--tx-mut)" }}>Sort: expiry</button>
          <button onClick={() => setSort("name")} style={{ ...linkBtn, color: sort === "name" ? "var(--brand-2)" : "var(--tx-mut)" }}>name</button>
        </div>}>
        <DataTable
          cols={[
            { k: "subject", label: "Subject", mono: true, grow: true },
            { k: "alg", label: "Public key", render: (c) => <Tag tone={keyTone(c)} mono>{keyLabel(c)}</Tag> },
            { k: "expiry", label: "Expires in", align: "right", render: (c) => { const t = c.expiry < 30 ? "var(--crit)" : c.expiry < 90 ? "var(--high)" : c.expiry < 365 ? "var(--warn)" : "var(--tx-mut)"; return <span className="mono tnum" style={{ color: t, fontWeight: 600 }}>{c.expiry}d</span>; } },
            { k: "issuer", label: "Issuer", mut: true },
            { k: "urgency", label: "Action", render: (c) => <RiskPill risk={URGENCY[c.urgency].tone === "crit" ? "critical" : URGENCY[c.urgency].tone === "high" ? "high" : URGENCY[c.urgency].tone === "warn" ? "monitor" : "safe"} small /> },
            { k: "label", label: "", render: (c) => <span style={{ fontSize: 12.5, color: "var(--tx-mut)" }}>{URGENCY[c.urgency].label}</span> },
          ]}
          rows={rows}
        />
      </Panel>
    </div>
  );
}

/* ---------------- HNDL detection ---------------- */
export function HndlDetect() {
  const [sel, setSel] = useState(0);
  const { data: anomalies, source } = useSplunkData("/api/hndl");
  const { data: timeline } = useSplunkData("/api/hndl/timeline");
  const list = anomalies || [];
  const a = list[sel] || list[0];
  const statusTone = (s) => (s === "active" ? "crit" : "warn");
  if (list.length === 0) return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ color: "var(--safe)", display: "flex", justifyContent: "center", marginBottom: 10 }}><Icon name="shield" size={32} /></div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--tx-hi)", marginBottom: 6 }}>No HNDL anomalies detected</div>
        <div style={{ fontSize: 13.5, color: "var(--tx-mut)", maxWidth: 420, margin: "0 auto 16px", lineHeight: 1.5 }}>
          Harvest-Now-Decrypt-Later detection requires encrypted egress data indexed in Splunk.
        </div>
        <a href="/onboarding" style={{ ...linkBtn, padding: "9px 15px", background: "var(--brand)", color: "#fff", borderColor: "var(--brand)", textDecoration: "none", display: "inline-flex" }}>Connect data sources</a>
      </div>
    </div>
  );
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SourceBadge source={source} />
      </div>
      <Panel title="Outbound encrypted volume · 48h" subtitle="Egress to external destinations · GB per hour"
        right={<div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--tx-mut)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 16, height: 3, background: "var(--cyan)", borderRadius: 2 }} />observed</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 16, height: 10, background: "var(--crit)", opacity: .25, borderRadius: 2 }} />anomaly window</span>
        </div>}>
        <AreaChart data={timeline || []} color="var(--cyan)" height={170} highlight={[]} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--tx-dim)", marginTop: 4, fontFamily: "var(--mono)" }}>
          <span>-48h</span><span>-36h</span><span>-24h</span><span>-12h</span><span>now</span>
        </div>
      </Panel>
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 16 }}>
        <Panel title="Flagged destinations" subtitle="Bulk-collection candidates" pad={0}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {list.map((x, i) => {
              const t = TONE[statusTone(x.status)];
              const active = i === sel;
              return (
                <button key={i} onClick={() => setSel(i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer", background: active ? "var(--bg-2)" : "transparent", border: "none", textAlign: "left", borderBottom: "1px solid var(--line-soft)", borderLeft: `2px solid ${active ? t.c : "transparent"}`, fontFamily: "var(--font)" }}>
                  <span style={{ color: t.c, display: "flex" }}><Icon name="globe" size={18} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 13, color: "var(--tx-hi)", fontWeight: 500 }}>{x.dst}</div>
                    <div style={{ fontSize: 12, color: "var(--tx-mut)", marginTop: 1 }}>{x.geo} · {x.asn}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="mono tnum" style={{ fontSize: 14, fontWeight: 600, color: "var(--tx-hi)" }}>{x.volume}</div>
                    <div className="mono" style={{ fontSize: 11.5, color: t.c, fontWeight: 600 }}>{x.deviation}× base</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>
        <Panel title="Signal detail" subtitle={a.dst} right={<Tag tone={statusTone(a.status)}>{a.status.toUpperCase()}</Tag>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["Volume", a.volume, "crit"], ["Baseline", a.baseline, "safe"], ["Sessions", a.sessions.toLocaleString(), "brand"], ["Window", a.window, "warn"]].map(([k, v, tone]) => (
                <div key={k} style={{ padding: 12, background: "var(--bg-inset)", borderRadius: 10, border: "1px solid var(--line)" }}>
                  <div className="eyebrow">{k}</div>
                  <div className="mono" style={{ fontSize: 17, fontWeight: 600, color: TONE[tone].c, marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 14, background: "var(--crit-bg)", border: "1px solid var(--crit-line)", borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "var(--crit)", fontWeight: 600, fontSize: 13 }}><Icon name="alert" size={15} /> Why this matters</div>
              <div style={{ fontSize: 12.5, color: "var(--tx)", lineHeight: 1.6 }}>{a.note}</div>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--tx-mut)", lineHeight: 1.6, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              This traffic looks <strong style={{ color: "var(--tx)" }}>perfectly normal</strong> to conventional SIEM — valid TLS, no malware signature. The harvest signal is the <strong style={{ color: "var(--tx)" }}>volume-to-unknown-destination</strong> pattern that only crypto-aware baselining surfaces.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
