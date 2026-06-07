// ============================================================
// services/PlanService.ts — produces an org migration plan.
// Uses the model when live; returns an error when offline.
// ============================================================
import type { AIProvider } from "../ai/AIProvider";
import type { ScanResult } from "../types";
import type { SplunkClient } from "../splunk/SplunkClient";

const SYSTEM = `You are the Crypto-Agility Agent. Produce a prioritized post-quantum migration plan for an engineering organization, as STRICT JSON only (no prose, no markdown fences).

Schema:
{
  "org": string, "generated": "just now", "summary": string,
  "posture": string (letter grade like "D+"), "targetPosture": string, "weeks": number,
  "streams": [{ "title": string, "tone": "crit"|"high"|"safe", "window": string,
    "actions": [{ "repo": string, "task": string, "pr": string, "effort": string }] }]
}

Rank findings by exposure x sensitivity. Use 3 streams: Immediate (code-freeze risks), Dependency uplift, Signing & policy. Frame cost as engineer-days, NOT millions in quantum capital. Keep tasks terse.`;

export interface PlanResult {
  plan: unknown;
  mode: "live" | "fallback";
}

export class PlanService {
  constructor(
    private readonly ai: AIProvider,
    private readonly splunk: SplunkClient,
  ) {}

  async generate(scanned: ScanResult[], org: string): Promise<PlanResult> {
    if (!this.ai.live) {
      return { plan: this.fallbackPlan(org, scanned), mode: "fallback" };
    }
    const raw = await this.ai.complete({
      system: SYSTEM,
      messages: [{ role: "user", content: `Organization: ${org}\n\nFindings:\n${await this.digest(scanned)}\n\nReturn the plan JSON.` }],
      maxTokens: 1500,
    });
    return { plan: this.parse(raw, org), mode: "live" };
  }

  private async digest(scanned: ScanResult[]): Promise<string> {
    if (scanned.length === 0) {
      const live = this.splunk.enabled ? await this.splunk.getCodeRollup() : null;
      if (live) {
        return `No live scans yet; base the plan on this Splunk baseline: ${live.critical} critical, ${live.high} high, ${live.monitor} monitor findings across ${live.reposScanned} repos. Top patterns: ${live.patterns.slice(0, 4).map((p) => `${p.pattern} (${p.count})`).join("; ")}.`;
      }
      return "No live scans yet; run a repo scan to generate a grounded plan.";
    }
    return scanned
      .map((x) => `${x.repo} (grade ${x.grade}, ${x.critical} critical/${x.high} high): ${x.detail.slice(0, 6).map((f) => `${f.kind} @ ${f.file}:${f.line}`).join("; ")}`)
      .join("\n");
  }

  private parse(raw: string, org: string): unknown {
    try {
      return JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    } catch {
      return this.fallbackPlan(org, []);
    }
  }

  private fallbackPlan(org: string, _scanned: ScanResult[]): unknown {
    return {
      org,
      generated: "just now",
      summary: "Auto-prioritized migration plan based on the built-in rule set. Set ANTHROPIC_API_KEY to enable AI-generated plans.",
      posture: "D+",
      targetPosture: "A",
      weeks: 12,
      streams: [
        {
          title: "Immediate code-freeze risks",
          tone: "crit",
          window: "0-2 weeks",
          actions: [
            { repo: "example-org/core-api", task: "Replace RSA-2048 key exchange with hybrid ML-KEM (X25519MLKEM768) under TLS 1.3", pr: "draft", effort: "3d" },
            { repo: "example-org/web-app", task: "Disable TLS 1.0/1.1 fallback and enforce TLS 1.3 fleet-wide", pr: "ready", effort: "1d" },
          ],
        },
        {
          title: "Dependency uplift",
          tone: "high",
          window: "2-6 weeks",
          actions: [
            { repo: "example-org/core-api", task: "Upgrade OpenSSL / BoringSSL to PQC-capable release (3.2+)", pr: "draft", effort: "5d" },
            { repo: "example-org/auth-svc", task: "Replace SHA-1/MD5 certificate fingerprints with SHA-256 or SHA-3", pr: "draft", effort: "2d" },
          ],
        },
        {
          title: "Signing & policy",
          tone: "safe",
          window: "6-12 weeks",
          actions: [
            { repo: "example-org/infra", task: "Publish crypto-agility policy: no new RSA < 3072, no ECDSA P-256, pinned TLS", pr: "draft", effort: "3d" },
            { repo: "example-org/pki", task: "Renew certificates expiring within 90 days using ML-DSA-65 instead of RSA", pr: "draft", effort: "4d" },
          ],
        },
      ],
    };
  }
}
