"use client";
import React, { useState, useRef, useEffect } from "react";
import { Icon, Spinner, LOG_TONE, linkBtn } from "./primitives";

/*
  AgentConsole — visible "AI is working" step runner.
  steps: [{ label, tool, logs: [{t, text}], ms?, lineMs? }]
*/
function allLines(steps) {
  const out = [];
  steps.forEach((s, si) => s.logs.forEach((ln) => out.push({ si, ...ln })));
  return out;
}

export default function AgentConsole({ steps, onDone, title = "Crypto-Agility Agent", subtitle, autorun = true }) {
  const [stepIdx, setStepIdx] = useState(autorun ? 0 : steps.length);
  const [lines, setLines] = useState(autorun ? [] : allLines(steps));
  const [done, setDone] = useState(!autorun);
  const timers = useRef([]);
  const logRef = useRef(null);
  const doneCb = useRef(onDone);
  doneCb.current = onDone;

  const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const run = () => {
    clearAll();
    setDone(false); setStepIdx(0); setLines([]);
    let t = 0;
    steps.forEach((s, si) => {
      timers.current.push(setTimeout(() => setStepIdx(si), t));
      const lineMs = s.lineMs || 240;
      s.logs.forEach((ln, li) => {
        timers.current.push(setTimeout(() => setLines((prev) => [...prev, { si, ...ln }]), t + 160 + li * lineMs));
      });
      t += s.ms || 420 + s.logs.length * lineMs;
    });
    timers.current.push(setTimeout(() => {
      setStepIdx(steps.length); setDone(true);
      doneCb.current && doneCb.current();
    }, t + 260));
  };

  useEffect(() => {
    if (!autorun) { doneCb.current && doneCb.current(); return; }
    run();
    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [lines]);

  const pct = Math.round((Math.min(stepIdx, steps.length) / steps.length) * 100);

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 18px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--brand-dim)", border: "1px solid var(--brand-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-2)", flexShrink: 0 }}>
          <Icon name="ai" size={20} fill="currentColor" stroke={0} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--tx-hi)" }}>{title}</div>
          <div style={{ fontSize: 12.5, color: "var(--tx-mut)" }}>{subtitle || "Agentic loop on Splunk · MCP Server + hosted model"}</div>
        </div>
        {done ? (
          <button onClick={run} style={{ ...linkBtn, padding: "7px 13px" }}><Icon name="refresh" size={14} /> Regenerate</button>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--brand-2)", fontWeight: 600 }}><Spinner size={15} /> working…</span>
        )}
      </div>

      <div style={{ height: 3, background: "#ffffff0d" }}>
        <div style={{ height: "100%", width: pct + "%", background: done ? "var(--safe)" : "var(--brand)", boxShadow: `0 0 10px -1px ${done ? "var(--safe)" : "var(--brand)"}`, transition: "width .5s cubic-bezier(.2,.7,.3,1)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "266px 1fr", minHeight: 232 }}>
        <div style={{ borderRight: "1px solid var(--line)", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
          {steps.map((s, si) => {
            const state = si < stepIdx ? "done" : si === stepIdx ? "run" : "idle";
            const c = state === "done" ? "var(--safe)" : state === "run" ? "var(--brand-2)" : "var(--tx-dim)";
            return (
              <div key={si} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 9px", borderRadius: 9, background: state === "run" ? "var(--brand-dim)" : "transparent", transition: "background .3s" }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: state === "idle" ? "var(--bg-2)" : state === "done" ? "var(--safe-bg)" : "var(--brand-dim)",
                  border: `1px solid ${state === "idle" ? "var(--line)" : state === "done" ? "var(--safe-line)" : "var(--brand-dim)"}`, color: c }}>
                  {state === "done" ? <Icon name="check" size={14} /> : state === "run" ? <Spinner size={13} /> : <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{si + 1}</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: state === "idle" ? "var(--tx-mut)" : "var(--tx-hi)" }}>{s.label}</div>
                  <div className="mono" style={{ fontSize: 10, color: c, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.tool}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div ref={logRef} style={{ padding: "14px 16px", overflowY: "auto", overflowX: "hidden", maxHeight: 300, background: "var(--bg-inset)" }}>
          {lines.map((ln, i) => {
            const isLast = i === lines.length - 1;
            return (
              <div key={i} className="mono" style={{ fontSize: 12, lineHeight: 1.85, display: "flex", gap: 9, alignItems: "baseline" }}>
                <span style={{ color: "var(--tx-dim)", flexShrink: 0 }}>{String(ln.si + 1).padStart(2, "0")}</span>
                <span style={{ color: LOG_TONE[ln.t] || "var(--tx-mut)", flex: 1, minWidth: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                  {ln.text}
                  {!done && isLast && <span style={{ display: "inline-block", width: 7, height: 13, background: "var(--brand-2)", marginLeft: 4, transform: "translateY(2px)", animation: "blink-caret 1s steps(1) infinite" }} />}
                </span>
              </div>
            );
          })}
          {done && (
            <div className="mono" style={{ fontSize: 12, lineHeight: 1.85, display: "flex", gap: 9, alignItems: "baseline", marginTop: 4 }}>
              <span style={{ color: "var(--safe)", flexShrink: 0 }}>✓</span>
              <span style={{ color: "var(--safe)" }}>complete — output ready below.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
