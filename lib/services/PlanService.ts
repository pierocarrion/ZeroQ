// ============================================================
// services/PlanService.ts — produces an org migration plan.
// Uses the model when live; returns an error when offline.
// ============================================================
import type { AIProvider } from "../ai/AIProvider";
import type { ScanResult } from "../types";
import type { SplunkClient } from "../splunk/SplunkClient";

const SYSTEM = `You are the ZeroQ Agent. Produce a prioritized post-quantum migration plan for an engineering organization, as STRICT JSON only (no prose, no markdown fences).

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
    private readonly localStore: SplunkClient,
  ) {}

  async generate(scanned: ScanResult[], org: string): Promise<PlanResult> {
    const context = await this.buildContext(scanned);
    if (!this.ai.live) {
      return { plan: this.fallbackPlan(org, context), mode: "fallback" };
    }
    const raw = await this.ai.complete({
      system: SYSTEM,
      messages: [{ role: "user", content: `Organization: ${org}\n\nFindings:\n${context.digest}\n\nReturn the plan JSON.` }],
      maxTokens: 1500,
    });
    return { plan: this.parse(raw, org), mode: "live" };
  }

  private async buildContext(scanned: ScanResult[]): Promise<{ scanned: ScanResult[]; digest: string; rollup: import("../types").CodeRollup | null }> {
    if (scanned.length > 0) {
      return { scanned, digest: this.scannedDigest(scanned), rollup: null };
    }
    const live = this.splunk.enabled ? await this.splunk.getCodeRollup() : null;
    if (live && live.findings > 0) {
      return { scanned: [], digest: `No live scans yet; base the plan on this Splunk baseline: ${live.critical} critical, ${live.high} high, ${live.monitor} monitor findings across ${live.reposScanned} repos. Top patterns: ${live.patterns.slice(0, 4).map((p) => `${p.pattern} (${p.count})`).join("; " )}.`, rollup: live };
    }
    const local = this.localStore.enabled ? await this.localStore.getCodeRollup() : null;
    if (local && local.findings > 0) {
      const localRepos = await this.localStore.getRepos();
      const repoList = (localRepos || []).slice(0, 20);
      return { scanned: repoList as any, digest: `Base the plan on local SQLite scans: ${local.critical} critical, ${local.high} high, ${local.monitor} monitor findings across ${local.reposScanned} repos. Top patterns: ${local.patterns.slice(0, 4).map((p) => `${p.pattern} (${p.count})`).join("; " )}.`, rollup: local };
    }
    return { scanned: [], digest: "No live scans yet; run a repo scan to generate a grounded plan.", rollup: null };
  }

  private scannedDigest(scanned: ScanResult[]): string {
    return scanned
      .map((x) => `${x.repo} (grade ${x.grade}, ${x.critical} critical/${x.high} high): ${x.detail.slice(0, 6).map((f) => `${f.kind} @ ${f.file}:${f.line}`).join("; ")}`)
      .join("\n");
  }

  private parse(raw: string, org: string): unknown {
    try {
      return JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    } catch {
      return this.fallbackPlan(org, { scanned: [], digest: "No scans available.", rollup: null });
    }
  }

  private fallbackPlan(org: string, ctx: { scanned: ScanResult[]; digest: string; rollup: import("../types").CodeRollup | null }): unknown {
    const repos = ctx.scanned.length > 0 ? ctx.scanned : [{ repo: "example-org/core-api", grade: "D", critical: 1, high: 2, findings: 3, detail: [] }];
    const critical = repos.filter((r) => (r.critical || 0) > 0);
    const high = repos.filter((r) => (r.high || 0) > 0 && (r.critical || 0) === 0);
    const summary = ctx.rollup
      ? `Auto-prioritized migration plan based on ${ctx.rollup.reposScanned} local repo scan(s) with ${ctx.rollup.critical} critical, ${ctx.rollup.high} high findings. Set DEEPSEEK_API_KEY to enable AI-generated plans.`
      : "Auto-prioritized migration plan based on the built-in rule set. Set DEEPSEEK_API_KEY to enable AI-generated plans.";
    const posture = ctx.rollup
      ? (ctx.rollup.critical > 0 ? "F" : ctx.rollup.high > 0 ? "D+" : "C")
      : "D+";

    return {
      org,
      generated: "just now",
      summary,
      posture,
      targetPosture: "A",
      weeks: 12,
      streams: [
        {
          title: "Immediate code-freeze risks",
          tone: "crit",
          window: "0-2 weeks",
          actions: critical.length
            ? critical.slice(0, 6).map((r) => ({ repo: r.repo, task: `Address ${r.critical} critical quantum-vulnerable finding(s) in ${r.repo}`, pr: "draft", effort: "2d" }))
            : [{ repo: "example-org/core-api", task: "Replace RSA-2048 key exchange with hybrid ML-KEM (X25519MLKEM768) under TLS 1.3", pr: "draft", effort: "3d" }],
        },
        {
          title: "Dependency uplift",
          tone: "high",
          window: "2-6 weeks",
          actions: high.length
            ? high.slice(0, 6).map((r) => ({ repo: r.repo, task: `Fix ${r.high} high-severity crypto pattern(s) in ${r.repo}`, pr: "draft", effort: "3d" }))
            : [{ repo: "example-org/core-api", task: "Upgrade OpenSSL / BoringSSL to PQC-capable release (3.2+)", pr: "draft", effort: "5d" }],
        },
        {
          title: "Signing & policy",
          tone: "safe",
          window: "6-12 weeks",
          actions: [
            { repo: org, task: "Publish ZeroQ policy: no new RSA < 3072, no ECDSA P-256, pinned TLS", pr: "draft", effort: "3d" },
            { repo: org, task: "Renew certificates expiring within 90 days using ML-DSA-65 instead of RSA", pr: "draft", effort: "4d" },
          ],
        },
      ],
    };
  }
}
