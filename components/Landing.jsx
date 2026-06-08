"use client";
import React from "react";
import Link from "next/link";
import { Logo, Icon } from "./primitives";

/* ------------------------------------------------------------------
   Minimal, editorial landing. Restraint over decoration:
   one accent, hairline rules, generous whitespace, quiet type.
------------------------------------------------------------------- */

const Wrap = ({ children, style }) => (
  <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px", ...style }}>{children}</div>
);

const Eyebrow = ({ children }) => (
  <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--tx-dim)" }}>{children}</div>
);

const TextLink = ({ href, children }) => (
  <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--tx)", textDecoration: "none", fontSize: 14.5, fontWeight: 500, borderBottom: "1px solid var(--line-strong)", paddingBottom: 2 }}>
    {children}
  </Link>
);

const PrimaryLink = ({ href, children }) => (
  <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--tx-hi)", color: "var(--bg-0)", textDecoration: "none", fontSize: 14, fontWeight: 600, padding: "11px 18px", borderRadius: 8 }}>
    {children}
  </Link>
);

const CAPS = [
  ["Repository scanning", "Scan every repo across your GitHub and GitLab orgs for quantum-vulnerable crypto — RSA, ECDSA P-256, legacy TLS, 3DES, pre-PQC dependencies — down to file and line."],
  ["Network & HNDL", "Detect “harvest-now, decrypt-later” exfiltration: bulk encrypted egress to unknown destinations that signature-based SIEM never flags."],
  ["Unified risk score", "One weighted 0–100 score across code, network and PKI, trended over time and broken down by asset sensitivity."],
  ["Grounded assistant", "Ask in plain language. Answers are grounded on your live posture and scanned repositories, mapped to NIST and NSA deadlines."],
  ["Migration plan", "An agent ranks findings by exposure × sensitivity and produces a time-boxed plan — most fixes delivered as ready-to-merge pull requests."],
  ["Compliance mapping", "Findings mapped to NIST IR 8547, NSA CNSA 2.0 and the CISA PQC roadmap, with audit-ready posture summaries."],
];

const STEPS = [
  ["Ingest", "Org repositories and TLS telemetry are indexed into Splunk."],
  ["Detect", "Source is scanned for quantum-vulnerable cryptographic patterns."],
  ["Correlate", "Code findings are joined with live TLS and certificate data."],
  ["Reason", "A hosted model ranks risk and drafts the migration plan."],
  ["Act", "Fixes are opened as pull requests; policy is updated."],
];

export default function Landing() {
  return (
    <div style={{ background: "var(--bg-0)", minHeight: "100vh", overflowX: "hidden" }}>
      {/* nav */}
      <header style={{ borderBottom: "1px solid var(--line)" }}>
        <Wrap style={{ display: "flex", alignItems: "center", height: 68, gap: 14 }}>
          <Logo size={26} />
          <span style={{ fontWeight: 600, color: "var(--tx-hi)", fontSize: 14.5, letterSpacing: "-.01em" }}>ZeroQ</span>
          <nav style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: 30, alignItems: "center" }} className="zeroq-landing-nav">
            {[["#capabilities", "Capabilities"], ["#how", "How it works"], ["#platform", "Platform"]].map(([h, l]) => (
              <a key={h} href={h} style={{ color: "var(--tx-mut)", textDecoration: "none", fontSize: 13.5 }}>{l}</a>
            ))}
            <Link href="/app" style={{ color: "var(--tx-hi)", textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>Open app →</Link>
          </nav>
        </Wrap>
      </header>

      {/* hero */}
      <Wrap style={{ paddingTop: 104, paddingBottom: 104 }}>
        <div style={{ maxWidth: 760 }}>
          <Eyebrow>Post-quantum cryptography posture</Eyebrow>
          <h1 style={{ margin: "22px 0 0", fontSize: 56, lineHeight: 1.06, letterSpacing: "-.03em", color: "var(--tx-hi)", fontWeight: 600, textWrap: "balance" }}>
            Know your quantum exposure. Close it in engineer-days.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--tx-mut)", maxWidth: 600, marginTop: 26 }}>
            ZeroQ inventories every vulnerable cipher across your code and network, then an AI agent on Splunk produces the migration plan. Built for the gap between today&apos;s encryption and tomorrow&apos;s quantum computer.
          </p>
          <div style={{ display: "flex", gap: 22, marginTop: 36, alignItems: "center", flexWrap: "wrap" }}>
            <PrimaryLink href="/app">Open the dashboard</PrimaryLink>
            <TextLink href="/app">Scan a repository <Icon name="chevron" size={14} /></TextLink>
          </div>
        </div>
      </Wrap>

      {/* metrics strip */}
      <div style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <Wrap style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }} className="zeroq-metrics">
          {[["18", "detection rules"], ["2", "source providers"], ["0–100", "unified risk score"], ["3", "compliance frameworks"]].map(([n, l], i) => (
            <div key={l} style={{ padding: "34px 0", borderLeft: i === 0 ? "none" : "1px solid var(--line)", paddingLeft: i === 0 ? 0 : 28 }}>
              <div className="mono" style={{ fontSize: 34, fontWeight: 600, color: "var(--tx-hi)", letterSpacing: "-.02em" }}>{n}</div>
              <div style={{ fontSize: 13, color: "var(--tx-mut)", marginTop: 6 }}>{l}</div>
            </div>
          ))}
        </Wrap>
      </div>

      {/* thesis */}
      <Wrap style={{ paddingTop: 96, paddingBottom: 96 }}>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 48 }} className="zeroq-thesis">
          <Eyebrow>The thesis</Eyebrow>
          <div style={{ maxWidth: 640 }}>
            <p style={{ fontSize: 24, lineHeight: 1.5, color: "var(--tx-hi)", fontWeight: 500, letterSpacing: "-.01em", margin: 0 }}>
              Breaking your encryption will cost an adversary millions in quantum hardware. Defending against it is a configuration and dependency change measured in engineer-days.
            </p>
            <p style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--tx-mut)", marginTop: 22 }}>
              That asymmetry favors defenders who start now. The hard part was never the fix — it was knowing precisely what to fix, where, and in what order. This tool answers that across your entire estate.
            </p>
          </div>
        </div>
      </Wrap>

      {/* capabilities */}
      <div id="capabilities" style={{ borderTop: "1px solid var(--line)" }}>
        <Wrap style={{ paddingTop: 72, paddingBottom: 28 }}>
          <Eyebrow>Capabilities</Eyebrow>
        </Wrap>
        <Wrap style={{ paddingBottom: 80 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }} className="zeroq-caps">
            {CAPS.map(([title, body], i) => (
              <div key={title} style={{ padding: "28px 28px 28px 0", borderTop: "1px solid var(--line)" }}>
                <div className="mono" style={{ fontSize: 12, color: "var(--tx-dim)", marginBottom: 14 }}>{String(i + 1).padStart(2, "0")}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--tx-hi)", marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13.5, color: "var(--tx-mut)", lineHeight: 1.6 }}>{body}</div>
              </div>
            ))}
          </div>
        </Wrap>
      </div>

      {/* how it works */}
      <div id="how" style={{ borderTop: "1px solid var(--line)", background: "var(--bg-1)" }}>
        <Wrap style={{ paddingTop: 72, paddingBottom: 72 }}>
          <Eyebrow>How it works</Eyebrow>
          <div style={{ marginTop: 32, borderTop: "1px solid var(--line)" }}>
            {STEPS.map(([label, desc], i) => (
              <div key={label} style={{ display: "grid", gridTemplateColumns: "60px 200px 1fr", gap: 24, alignItems: "baseline", padding: "22px 0", borderBottom: "1px solid var(--line)" }} className="zeroq-step-row">
                <div className="mono" style={{ fontSize: 13, color: "var(--brand-2)" }}>{String(i + 1).padStart(2, "0")}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--tx-hi)" }}>{label}</div>
                <div style={{ fontSize: 14, color: "var(--tx-mut)", lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </Wrap>
      </div>

      {/* platform */}
      <div id="platform" style={{ borderTop: "1px solid var(--line)" }}>
        <Wrap style={{ paddingTop: 72, paddingBottom: 80 }}>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 48 }} className="zeroq-thesis">
            <Eyebrow>Platform</Eyebrow>
            <div>
              <p style={{ fontSize: 20, lineHeight: 1.5, color: "var(--tx-hi)", fontWeight: 500, margin: 0, maxWidth: 600 }}>
                Built on Splunk. Source and findings never leave your instance.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginTop: 36 }} className="zeroq-platform">
                {[
                  ["MCP Server", "The tool layer the agent calls to query indexes and take actions."],
                  ["Hosted model", "On-platform reasoning — nothing is sent to third parties."],
                  ["AI Assistant", "A natural-language interface over your cryptographic posture."],
                  ["SPL correlation", "Joins code findings with live TLS and PKI telemetry."],
                ].map(([k, v], i) => (
                  <div key={k} style={{ padding: "22px 28px 22px 0", borderTop: "1px solid var(--line)" }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--tx-hi)", marginBottom: 6 }}>{k}</div>
                    <div style={{ fontSize: 13, color: "var(--tx-mut)", lineHeight: 1.55 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Wrap>
      </div>

      {/* CTA */}
      <div style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <Wrap style={{ paddingTop: 80, paddingBottom: 80, textAlign: "center" }}>
          <h2 style={{ fontSize: 34, color: "var(--tx-hi)", margin: 0, letterSpacing: "-.02em", fontWeight: 600 }}>See your exposure in minutes.</h2>
          <p style={{ fontSize: 15.5, color: "var(--tx-mut)", maxWidth: 480, margin: "16px auto 30px", lineHeight: 1.6 }}>
            Open the dashboard and live-scan a public repository — no setup required.
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}><PrimaryLink href="/app">Open ZeroQ</PrimaryLink></div>
        </Wrap>
      </div>

      <footer>
        <Wrap style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={20} />
            <span style={{ fontSize: 12.5, color: "var(--tx-dim)" }}>ZeroQ</span>
          </div>
          <span className="mono" style={{ fontSize: 11.5, color: "var(--tx-dim)", letterSpacing: ".08em" }}>NEXT.JS · SPLUNK · MIT</span>
        </Wrap>
      </footer>
    </div>
  );
}
