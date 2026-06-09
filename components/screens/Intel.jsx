"use client";
import React, { useState, useRef, useEffect } from "react";
import { TONE, riskTone, Icon, Panel, Tag, Bar, MdLite } from "../primitives";
import { apiAssistant, apiSplunkQuery, useScannedRepos, useSplunkData } from "../client";
import { DATA } from "@/lib/data";

function AiAvatar() {
  return (
    <div style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 9, background: "var(--brand-dim)", border: "1px solid var(--brand-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-2)" }}>
      <Icon name="ai" size={16} fill="currentColor" stroke={0} />
    </div>
  );
}

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

/* ---------------- AI Assistant (real /api/assistant) ---------------- */
export function Assistant() {
  const [msgs, setMsgs] = useState([{ role: "ai", intro: true }]);
  const [thinking, setThinking] = useState(false);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(null);
  const scrollRef = useRef(null);
  const scanned = useScannedRepos();

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs, thinking]);

  const runSplunkTool = async (q) => {
    const lower = q.toLowerCase();
    if (lower.includes("cert") && lower.includes("expire")) {
      return apiSplunkQuery("| index=crypto_pki sourcetype=zeroq:cert | where expiry<30 | stats count");
    }
    if (lower.includes("tls 1.0") || lower.includes("tls 1.1")) {
      return apiSplunkQuery('| index=crypto_net sourcetype=zeroq:tls_connection version IN ("TLS 1.0","TLS 1.1") | stats count by server, version');
    }
    if (lower.includes("critical") || lower.includes("crítico")) {
      return apiSplunkQuery("| index=crypto_source sourcetype=zeroq:crypto_finding sev=critical | stats count by repo");
    }
    if (lower.includes("rsa")) {
      return apiSplunkQuery("| index=crypto_source sourcetype=zeroq:crypto_finding | search kind=*RSA* | stats count by repo, kind");
    }
    return null;
  };

  const ask = async (qtext) => {
    const q = (qtext || input).trim();
    if (!q || thinking) return;
    setInput("");
    const history = msgs.filter((m) => m.text).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setThinking(true);
    try {
      // Optionally enrich prompt with Splunk query results
      let toolCtx = "";
      const toolRes = await runSplunkTool(q);
      if (toolRes && toolRes.result && toolRes.result.results && toolRes.result.results.length) {
        toolCtx = "\n\nSPLUNK DATA:\n" + JSON.stringify(toolRes.result.results.slice(0, 10), null, 2);
      }
      const data = await apiAssistant([...history, { role: "user", content: q + toolCtx }], scanned);
      setMode(data.mode);
      setMsgs((m) => [...m, { role: "ai", text: (data.text || "").trim() || "No response." }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "ai", text: "The assistant is unavailable right now. Try again, or run a repo scan to ground the answer." }]);
    } finally { setThinking(false); }
  };

  const asked = msgs.filter((m) => m.role === "user").map((m) => m.text);
  const remaining = ["Which of our APIs are still using RSA?", "Show servers not yet on TLS 1.3", "What changed in our quantum risk score this month?", "Which certificates expire in under 90 days?"].filter((s) => !asked.includes(s));

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div className="card" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--brand-dim)", border: "1px solid var(--brand-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-2)" }}><Icon name="ai" size={18} fill="currentColor" stroke={0} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--tx-hi)" }}>AI Assistant</div>
            <div style={{ fontSize: 12, color: "var(--tx-mut)" }}>Grounded on your indexed crypto posture + live-scanned repos</div>
          </div>
          <Tag tone={mode === "live" ? "safe" : mode === "fallback" ? "warn" : "brand"}>{mode === "live" ? "live model" : mode === "fallback" ? "local reasoner" : "ready"}</Tag>
        </header>

        <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
          {msgs.map((m, i) => {
            if (m.intro) return (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <AiAvatar />
                <div style={{ maxWidth: 620, fontSize: 13.5, color: "var(--tx)", lineHeight: 1.6, paddingTop: 5 }}>
                  Ask me anything about your organization&apos;s cryptographic posture. I read your TLS telemetry, certificate inventory, live-scanned repositories and the quantum-risk index — then map findings to NIST &amp; NSA deadlines.
                </div>
              </div>
            );
            if (m.role === "user") return (
              <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ maxWidth: 560, padding: "10px 15px", borderRadius: "13px 13px 4px 13px", background: "var(--brand)", color: "#fff", fontSize: 13.5, fontWeight: 500 }}>{m.text}</div>
              </div>
            );
            return (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <AiAvatar />
                <div style={{ maxWidth: 660, flex: 1 }}><MdLite text={m.text} /></div>
              </div>
            );
          })}
          {thinking && (
            <div style={{ display: "flex", gap: 12 }}>
              <AiAvatar />
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8, color: "var(--tx-mut)", fontSize: 13 }}>
                <span style={{ display: "flex", gap: 4 }}>{[0, 1, 2].map((n) => <span key={n} style={{ width: 6, height: 6, borderRadius: 9, background: "var(--brand-2)", animation: `pulse-dot 1s ${n * 0.18}s infinite` }} />)}</span>
                reading posture &amp; reasoning…
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--line)", padding: 14 }}>
          {remaining.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {remaining.map((s) => (
                <button key={s} onClick={() => ask(s)} style={{ padding: "7px 12px", borderRadius: 999, border: "1px solid var(--line)", background: "var(--bg-2)", color: "var(--tx)", fontSize: 12.5, cursor: "pointer", fontFamily: "var(--font)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "var(--brand-2)" }}><Icon name="search" size={13} /></span>{s}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 4px 16px", background: "var(--bg-inset)", border: "1px solid var(--line)", borderRadius: 12 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ask(); }} placeholder="Ask anything about your crypto posture…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--tx)", fontFamily: "var(--font)", fontSize: 13.5, padding: "8px 0" }} />
            <button onClick={() => ask()} disabled={thinking || !input.trim()} style={{ width: 36, height: 36, borderRadius: 9, border: "none", background: thinking || !input.trim() ? "var(--bg-3)" : "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: thinking || !input.trim() ? "default" : "pointer" }}>
              <Icon name="send" size={17} fill="currentColor" stroke={0} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Roadmap ---------------- */
export function Roadmap() {
  const { data: roadmap, source } = useSplunkData("/api/roadmap", DATA.roadmap);
  const phases = roadmap || [];
  if (phases.length === 0) return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ color: "var(--safe)", display: "flex", justifyContent: "center", marginBottom: 10 }}><Icon name="roadmap" size={32} /></div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--tx-hi)", marginBottom: 6 }}>No roadmap data available</div>
        <div style={{ fontSize: 13.5, color: "var(--tx-mut)", maxWidth: 420, margin: "0 auto 16px", lineHeight: 1.5 }}>
          Generate an AI-powered migration roadmap after connecting Splunk and scanning repositories.
        </div>
        <a href="/onboarding" style={{ ...linkBtn, padding: "9px 15px", background: "var(--brand)", color: "#fff", borderColor: "var(--brand)", textDecoration: "none", display: "inline-flex" }}>Start setup</a>
      </div>
    </div>
  );
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SourceBadge source={source} />
      </div>
      <div className="card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "flex-start", background: "linear-gradient(110deg, #131229, #0e1320 60%)", borderColor: "var(--brand-dim)" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--brand-dim)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-2)" }}><Icon name="ai" size={20} fill="currentColor" stroke={0} /></div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: "var(--tx-hi)", fontSize: 15 }}>AI-generated migration roadmap</span>
            <Tag tone="brand">auto-prioritized</Tag>
          </div>
          <div style={{ fontSize: 13, color: "var(--tx-mut)", lineHeight: 1.6, maxWidth: 760 }}>Migration is a configuration and policy effort — measured in engineer-days, not the millions in capital that quantum hardware costs. The economic asymmetry favors defenders who start now.</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {phases.map((phase, pi) => {
          const t = TONE[phase.tone];
          return (
            <div key={pi} className="card" style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--line)", borderLeft: `3px solid ${t.c}` }}>
                <span style={{ fontWeight: 600, color: "var(--tx-hi)", fontSize: 14.5 }}>{phase.phase}</span>
                <Tag tone={phase.tone}>{phase.window}</Tag>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: "var(--tx-mut)" }}>{phase.items.length} actions</span>
              </div>
              <div>
                {phase.items.map((it, ii) => (
                  <div key={ii} style={{ display: "flex", gap: 16, padding: "16px 18px", borderBottom: ii === phase.items.length - 1 ? "none" : "1px solid var(--line-soft)" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: t.bg, border: `1px solid ${t.line}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: t.c, fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600 }}>{ii + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mono" style={{ fontSize: 12.5, color: t.c, fontWeight: 600, marginBottom: 3 }}>{it.asset}</div>
                      <div style={{ fontSize: 13.5, color: "var(--tx-hi)", fontWeight: 500, marginBottom: 4 }}>{it.action}</div>
                      <div style={{ fontSize: 12.5, color: "var(--tx-mut)", lineHeight: 1.5 }}><span style={{ color: "var(--tx-dim)" }}>Why:</span> {it.why} <span style={{ color: "var(--tx-dim)" }}>·</span> <span style={{ color: "var(--safe)" }}>{it.impact}</span></div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      <div className="eyebrow">Effort</div>
                      <div className="mono" style={{ fontSize: 15, fontWeight: 600, color: "var(--tx-hi)", marginTop: 3 }}>{it.effort}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Compliance ---------------- */
export function Compliance() {
  const stateTone = { past: "safe", active: "brand", target: "high" };
  const { data: liveStats, source } = useSplunkData("/api/compliance", DATA.compliance);
  const { data: rollup } = useSplunkData("/api/code-rollup", DATA.codeRollup);
  const frameworks = liveStats || [];
  const r = rollup || {};
  if (frameworks.length === 0) return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ color: "var(--safe)", display: "flex", justifyContent: "center", marginBottom: 10 }}><Icon name="shield" size={32} /></div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--tx-hi)", marginBottom: 6 }}>No compliance data available</div>
        <div style={{ fontSize: 13.5, color: "var(--tx-mut)", maxWidth: 420, margin: "0 auto 16px", lineHeight: 1.5 }}>
          Compliance mappings are built from your indexed findings in Splunk. Connect your instance to start tracking.
        </div>
        <a href="/onboarding" style={{ ...linkBtn, padding: "9px 15px", background: "var(--brand)", color: "#fff", borderColor: "var(--brand)", textDecoration: "none", display: "inline-flex" }}>Connect Splunk</a>
      </div>
    </div>
  );
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SourceBadge source={source} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {frameworks.map((f, i) => (
          <div key={i} className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-2)", flexShrink: 0 }}><Icon name="shield" size={18} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--tx-hi)" }}>{f.framework}</div>
                <div style={{ fontSize: 12, color: "var(--tx-mut)", marginTop: 1 }}>{f.desc}</div>
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12.5, whiteSpace: "nowrap" }}>
                <span className="eyebrow">Migration progress</span>
                <span className="mono" style={{ color: "var(--tx-hi)", fontWeight: 600 }}>{f.progress}%</span>
              </div>
              <Bar pct={f.progress} tone={f.progress > 50 ? "safe" : f.progress > 30 ? "warn" : "high"} />
              <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 12 }}>
                <span style={{ color: "var(--tx-mut)" }}><span className="mono" style={{ color: "var(--safe)" }}>{f.mapped}</span> assets mapped</span>
                <span style={{ color: "var(--tx-mut)" }}><span className="mono" style={{ color: "var(--crit)" }}>{f.atRisk}</span> at risk</span>
              </div>
            </div>
            {(f.milestones && f.milestones.length > 0) && (
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                {f.milestones.map((m, mi) => {
                  const t = TONE[stateTone[m.state]];
                  return (
                    <div key={mi} style={{ display: "flex", gap: 12, position: "relative", paddingBottom: mi === f.milestones.length - 1 ? 0 : 16 }}>
                      {mi < f.milestones.length - 1 && <span style={{ position: "absolute", left: 6, top: 16, bottom: 0, width: 1.5, background: "var(--line)" }} />}
                      <span style={{ width: 13, height: 13, borderRadius: 999, marginTop: 2, flexShrink: 0, zIndex: 1, background: m.state === "past" ? t.c : "var(--bg-1)", border: `2px solid ${t.c}` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: t.c }}>{m.year}</span>
                          {m.state === "past" && <Icon name="check" size={13} style={{ color: "var(--safe)" }} />}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--tx)", marginTop: 1, lineHeight: 1.45 }}>{m.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <Panel title="Audit-ready posture summary" subtitle="Generated mapping of findings to regulatory deadlines">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            ["Window to NSA 2035 deadline", "8.7 yrs", "Migration takes 5–10 — start now", "high"],
            ["Quantum-vulnerable assets", String(r.findings + r.critical + r.high), "across RSA + ECC key exchange", "crit"],
            ["Already PQC-ready", String(Math.round((r.patterns?.filter((p) => p.sev === "safe")?.length || 1) * 100 / Math.max(1, r.patterns?.length || 1))) + "%", "TLS 1.3 + ML-KEM hybrid", "safe"],
            ["Frameworks tracked", String(frameworks.length), "NIST · NSA · CISA", "brand"],
          ].map(([k, v, s, tone]) => (
            <div key={k} style={{ padding: 14, background: "var(--bg-inset)", borderRadius: 11, border: "1px solid var(--line)" }}>
              <div className="eyebrow">{k}</div>
              <div className="mono" style={{ fontSize: 26, fontWeight: 600, color: TONE[tone].c, margin: "6px 0 4px" }}>{v}</div>
              <div style={{ fontSize: 12, color: "var(--tx-mut)", lineHeight: 1.4 }}>{s}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
