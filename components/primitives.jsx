"use client";
import React, { useRef, useEffect } from "react";

/* ============================================================
   Shared UI primitives + SVG charts. All exported from one
   module to keep client imports simple and circular-free.
   ============================================================ */

export const TONE = {
  crit: { c: "var(--crit)", bg: "var(--crit-bg)", line: "var(--crit-line)" },
  high: { c: "var(--high)", bg: "var(--high-bg)", line: "var(--high-line)" },
  warn: { c: "var(--warn)", bg: "var(--warn-bg)", line: "var(--warn-line)" },
  safe: { c: "var(--safe)", bg: "var(--safe-bg)", line: "var(--safe-line)" },
  brand: { c: "var(--brand)", bg: "var(--brand-dim)", line: "var(--brand-dim)" },
};
export const riskTone = { critical: "crit", high: "high", monitor: "warn", safe: "safe" };

export const LOG_TONE = {
  info: "var(--tx-mut)", ok: "var(--safe)", warn: "var(--warn)", crit: "var(--crit)", ai: "var(--brand-2)",
};

export const linkBtn = {
  display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 11px", borderRadius: 8,
  border: "1px solid var(--line)", background: "var(--bg-2)", color: "var(--tx)", fontSize: 12.5,
  fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)",
};
export const iconBtn = {
  position: "relative", width: 38, height: 38, borderRadius: 10, border: "1px solid var(--line)",
  background: "var(--bg-1)", color: "var(--tx-mut)", cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center",
};

/* ---------------- Icons ---------------- */
const PATHS = {
  dashboard: "M3 13h7V4H3zM14 21h7v-9h-7zM14 4v5h7V4zM3 21h7v-5H3z",
  inventory: "M4 6h16M4 12h16M4 18h16",
  cert: "M9 4h6l2 2v9l-5 3-5-3V6zM12 19v3M9 22h6",
  radar: "M12 12 19 5M12 3a9 9 0 1 0 9 9M12 8a4 4 0 1 0 4 4",
  ai: "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z",
  roadmap: "M6 4v12a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3M6 4a2 2 0 1 0 0-.01M18 16a2 2 0 1 0 0 .01M12 9a2 2 0 1 0 0-.01",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3",
  bell: "M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0",
  filter: "M3 5h18l-7 8v6l-4-2v-4z",
  download: "M12 4v10m0 0l-4-4m4 4l4-4M5 19h14",
  chevron: "M9 6l6 6-6 6",
  arrowDown: "M12 5v14m0 0l-5-5m5 5l5-5",
  arrowUp: "M12 19V5m0 0l-5 5m5-5l5 5",
  refresh: "M20 11a8 8 0 1 0-1.5 5M20 5v6h-6",
  alert: "M12 3l9 16H3zM12 10v4M12 17v.5",
  check: "M5 12l4 4 10-11",
  x: "M6 6l12 12M18 6L6 18",
  send: "M4 12l16-8-6 16-3-7z",
  clock: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18",
  zap: "M13 3L4 14h6l-1 7 9-11h-6z",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c2.5 2.5 4 6 4 9s-1.5 6.5-4 9c-2.5-2.5-4-6-4-9s1.5-6.5 4-9",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 1 1 8 0v3",
  key: "M14 7a3 3 0 1 1 0 .01M12 9l-7 7v3h3l1-1h2v-2h2l1-1",
};
export function Icon({ name, size = 18, stroke = 1.7, fill = "none", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      <path d={PATHS[name] || ""} />
    </svg>
  );
}

export function Logo({ size = 30 }) {
  return (
    <img
      src="/zeroq-logo.png"
      alt="ZeroQ"
      width={size}
      height={size}
      style={{ display: "block", borderRadius: 6 }}
    />
  );
}

export function RiskPill({ risk, small }) {
  const r = risk || "monitor";
  const t = TONE[riskTone[r] || r] || TONE.brand;
  const label = r.charAt(0).toUpperCase() + r.slice(1);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: small ? "2px 8px" : "3px 10px",
      borderRadius: 999, fontSize: small ? 11 : 12, fontWeight: 600, color: t.c, background: t.bg, border: `1px solid ${t.line}` }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: t.c }} />{label}
    </span>
  );
}

export function Tag({ children, tone = "brand", mono }) {
  const t = TONE[tone] || TONE.brand;
  return (
    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, color: t.c, background: t.bg,
      border: `1px solid ${t.line}`, fontFamily: mono ? "var(--mono)" : "inherit", whiteSpace: "nowrap" }}>{children}</span>
  );
}

export function Panel({ title, subtitle, right, children, pad = 18, style, className }) {
  return (
    <section className={"card " + (className || "")} style={{ display: "flex", flexDirection: "column", ...style }}>
      {(title || right) && (
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: "1px solid var(--line)", gap: 12 }}>
          <div>
            {title && <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--tx-hi)" }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 12.5, color: "var(--tx-mut)", marginTop: 2 }}>{subtitle}</div>}
          </div>
          {right}
        </header>
      )}
      <div style={{ padding: pad, flex: 1, minHeight: 0 }}>{children}</div>
    </section>
  );
}

export function Bar({ pct, tone = "brand", height = 7 }) {
  const t = TONE[tone] || TONE.brand;
  return (
    <div style={{ height, borderRadius: 999, background: "#ffffff0d", overflow: "hidden" }}>
      <div style={{ width: pct + "%", height: "100%", borderRadius: 999, background: t.c, boxShadow: `0 0 12px -2px ${t.c}`, transition: "width 1s cubic-bezier(.2,.7,.3,1)" }} />
    </div>
  );
}

export function Delta({ value, invert }) {
  const down = value < 0;
  const good = invert ? down : !down;
  const t = good ? TONE.safe : TONE.crit;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: t.c, fontSize: 12.5, fontWeight: 600 }}>
      <Icon name={down ? "arrowDown" : "arrowUp"} size={13} stroke={2.2} />{Math.abs(value)}
    </span>
  );
}

export function Spinner({ size = 16, color = "var(--brand-2)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: "spin .8s linear infinite" }}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="var(--line)" strokeWidth="3" />
      <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- Charts ---------------- */
export function Gauge({ value, band, size = 196 }) {
  const r = size / 2 - 16;
  const cx = size / 2, cy = size / 2 + 8;
  const START = 150, SWEEP = 240;
  const toXY = (deg) => { const rad = (deg * Math.PI) / 180; return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]; };
  const arc = (a0, a1) => { const [x0, y0] = toXY(a0), [x1, y1] = toXY(a1); const large = (a1 - a0) % 360 > 180 ? 1 : 0; return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`; };
  const valAng = START + (value / 100) * SWEEP;
  const bandColor = value >= 80 ? "var(--crit)" : value >= 60 ? "var(--high)" : value >= 35 ? "var(--warn)" : "var(--safe)";
  const [nx, ny] = toXY(valAng);
  const circ = (Math.PI * r * SWEEP) / 180;
  return (
    <svg width={size} height={size * 0.82} viewBox={`0 0 ${size} ${size * 0.82}`}>
      <defs>
        <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2fd6a6" /><stop offset=".45" stopColor="#ffd24a" />
          <stop offset=".72" stopColor="#ff9340" /><stop offset="1" stopColor="#ff5160" />
        </linearGradient>
      </defs>
      <path d={arc(START, START + SWEEP)} fill="none" stroke="#ffffff0e" strokeWidth="13" strokeLinecap="round" />
      <path d={arc(START, START + SWEEP)} fill="none" stroke="url(#gauge-grad)" strokeWidth="13" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - value / 100)} style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.2,.7,.3,1)" }} />
      <circle cx={nx} cy={ny} r="7" fill="#0e1320" stroke={bandColor} strokeWidth="3" />
      <text x={cx} y={cy - 6} textAnchor="middle" fontFamily="var(--mono)" fontWeight="600" fontSize="42" fill="var(--tx-hi)">{value}</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize="12.5" fill="var(--tx-mut)" letterSpacing="1.5">/ 100</text>
      <text x={cx} y={cy + 40} textAnchor="middle" fontSize="13.5" fontWeight="700" fill={bandColor} letterSpacing=".06em">{(band || "—").toUpperCase()} EXPOSURE</text>
    </svg>
  );
}

export function Donut({ data, size = 150, thickness = 18 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - thickness / 2 - 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff0a" strokeWidth={thickness} />
      {data.map((d, i) => {
        const frac = d.value / total; const off = circ * (1 - frac); const rot = (acc / total) * 360 - 90; acc += d.value;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={thickness} strokeDasharray={circ} strokeDashoffset={off} transform={`rotate(${rot} ${cx} ${cy})`} style={{ transition: "stroke-dashoffset 1s" }} />;
      })}
      <text x={cx} y={cy - 3} textAnchor="middle" fontFamily="var(--mono)" fontWeight="600" fontSize="26" fill="var(--tx-hi)">{total}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="var(--tx-mut)" letterSpacing="1">PROFILES</text>
    </svg>
  );
}

export function AreaChart({ data, height = 120, color = "var(--brand)", highlight }) {
  const w = 600;
  let sanitized = (Array.isArray(data) ? data : []).map((v) => (typeof v === "number" && !isNaN(v) ? v : 0));
  if (sanitized.length === 0) {
    return (
      <svg width="100%" height={height + 22} viewBox={`0 0 ${w} ${height + 22}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" y1={height * g} x2={w} y2={height * g} stroke="#ffffff08" strokeWidth="1" />)}
        <text x={w / 2} y={(height + 22) / 2} fill="var(--tx-mut)" fontSize="12" textAnchor="middle">No data</text>
      </svg>
    );
  }
  if (sanitized.length === 1) sanitized = [sanitized[0], sanitized[0]];
  const max = Math.max(...sanitized) * 1.12;
  const min = Math.min(...sanitized, 0);
  const span = max - min || 1;
  const x = (i) => (i / (sanitized.length - 1)) * w;
  const y = (v) => height - ((v - min) / span) * height;
  const line = sanitized.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `0,${height} ${line} ${w},${height}`;
  const gid = "area-" + Math.round(color.length * 7 + sanitized.length);
  const validHighlight = Array.isArray(highlight) && highlight.length >= 2 && typeof highlight[0] === "number" && typeof highlight[1] === "number";
  return (
    <svg width="100%" height={height + 22} viewBox={`0 0 ${w} ${height + 22}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".34" /><stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" y1={height * g} x2={w} y2={height * g} stroke="#ffffff08" strokeWidth="1" />)}
      {validHighlight && <rect x={x(highlight[0])} y="0" width={x(highlight[1]) - x(highlight[0])} height={height} fill="var(--crit)" opacity=".09" />}
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(sanitized.length - 1)} cy={y(sanitized[sanitized.length - 1])} r="3.5" fill={color} />
    </svg>
  );
}

export function StackedBar({ data }) {
  return (
    <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", border: "1px solid var(--line)" }}>
      {data.map((d, i) => <div key={i} title={`${d.algo} · ${d.pct}%`} style={{ width: d.pct + "%", background: TONE[riskTone[d.risk]].c, opacity: .92 }} />)}
    </div>
  );
}

/* ---------------- Data table ---------------- */
export function DataTable({ cols, rows, onRow }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.k} style={{ textAlign: c.align || "left", padding: "11px 16px", fontWeight: 600, fontSize: 11,
                letterSpacing: ".08em", textTransform: "uppercase", color: "var(--tx-dim)", borderBottom: "1px solid var(--line)",
                whiteSpace: "nowrap", background: "var(--bg-inset)", position: "sticky", top: 0 }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} onClick={() => onRow && onRow(r)} style={{ cursor: onRow ? "pointer" : "default" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {cols.map((c) => (
                <td key={c.k} style={{ textAlign: c.align || "left", padding: "11px 16px", borderBottom: "1px solid var(--line-soft)",
                  color: c.mut ? "var(--tx-mut)" : "var(--tx)", whiteSpace: c.wrap ? "normal" : "nowrap",
                  fontFamily: c.mono ? "var(--mono)" : "inherit", fontSize: c.mono ? 12.5 : 13, width: c.grow ? "99%" : "auto" }}>
                  {c.render ? c.render(r) : r[c.k]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatTile({ label, value, unit, sub, tone, icon }) {
  const t = TONE[tone] || TONE.brand;
  return (
    <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="eyebrow">{label}</span>
        {icon && <span style={{ color: t.c, display: "flex" }}><Icon name={icon} size={16} /></span>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span className="mono tnum" style={{ fontSize: 30, fontWeight: 600, color: "var(--tx-hi)", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: "var(--tx-mut)" }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 12.5, color: "var(--tx-mut)", display: "flex", alignItems: "center", gap: 6 }}>{sub}</div>}
    </div>
  );
}

/* ---------------- Provider mark + grade ---------------- */
export function ProviderMark({ provider, size = 16 }) {
  if (provider === "gitlab") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#fc6d26">
        <path d="M12 21.8L8.4 10.7H15.6L12 21.8zM3.6 10.7l-1.1 3.4c-.1.3 0 .7.3.9l9.2 6.8-8.4-11.1zM3.6 10.7H8.4L6.3 4.2c-.1-.3-.6-.3-.7 0L3.6 10.7zM20.4 10.7l1.1 3.4c.1.3 0 .7-.3.9L12 21.8l8.4-11.1zM20.4 10.7H15.6l2.1-6.5c.1-.3.6-.3.7 0l2 6.5z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--tx)">
      <path d="M12 2C6.5 2 2 6.6 2 12.3c0 4.5 2.9 8.4 6.8 9.7.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.2-4.6-5.1 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9 9 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.8-4.6 5.1.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 3.9-1.3 6.8-5.2 6.8-9.7C22 6.6 17.5 2 12 2z" />
    </svg>
  );
}

const GRADE_TONE = { A: "safe", B: "safe", "B+": "safe", C: "warn", "C+": "warn", D: "high", "D+": "high", F: "crit" };
export function GradeBadge({ grade, size = 30 }) {
  const t = TONE[GRADE_TONE[grade] || "warn"];
  return (
    <span style={{ width: size, height: size, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: t.bg, border: `1px solid ${t.line}`, color: t.c, fontFamily: "var(--mono)", fontWeight: 700, fontSize: size * 0.46, flexShrink: 0 }}>{grade}</span>
  );
}

/* ---------------- Lightweight markdown ---------------- */
export function MdLite({ text }) {
  const blocks = String(text).split("\n");
  const inline = (s) => {
    const parts = []; let rest = s, key = 0; const rx = /(\*\*[^*]+\*\*|`[^`]+`)/; let m;
    while ((m = rest.match(rx))) {
      const idx = m.index; if (idx > 0) parts.push(rest.slice(0, idx));
      const tok = m[0];
      if (tok.startsWith("**")) parts.push(<strong key={key++} style={{ color: "var(--tx-hi)", fontWeight: 600 }}>{tok.slice(2, -2)}</strong>);
      else parts.push(<code key={key++} className="mono" style={{ fontSize: 12, background: "var(--bg-inset)", padding: "1px 5px", borderRadius: 5, color: "var(--cyan)" }}>{tok.slice(1, -1)}</code>);
      rest = rest.slice(idx + tok.length);
    }
    if (rest) parts.push(rest);
    return parts;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {blocks.map((ln, i) => {
        const t = ln.trim(); if (!t) return null;
        if (/^([-•*]|\d+\.)\s+/.test(t)) {
          const body = t.replace(/^([-•*]|\d+\.)\s+/, "");
          return <div key={i} style={{ display: "flex", gap: 9, fontSize: 13.5, color: "var(--tx)", lineHeight: 1.55 }}><span style={{ color: "var(--brand-2)", flexShrink: 0 }}>•</span><span style={{ flex: 1 }}>{inline(body)}</span></div>;
        }
        return <div key={i} style={{ fontSize: 13.5, color: "var(--tx)", lineHeight: 1.6 }}>{inline(t)}</div>;
      })}
    </div>
  );
}

/* ---------------- Loading skeletons ---------------- */
export {
  Skeleton,
  SkeletonCard,
  SkeletonStat,
  SkeletonTable,
  SkeletonPlan,
  SkeletonDashboard,
  SkeletonInventory,
  SkeletonCerts,
  SkeletonHndl,
  SkeletonRepos,
  SkeletonRoadmap,
  SkeletonCompliance,
  SkeletonSettings,
  SkeletonAssistant,
} from "./Skeleton";
