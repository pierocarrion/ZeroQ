// ============================================================
// services/PlanService.ts — produces an org migration plan.
// Uses the model when live; falls back to the seed plan.
// ============================================================
import type { AIProvider } from "../ai/AIProvider";
import { DATA } from "../data";
import type { ScanResult } from "../types";

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
  constructor(private readonly ai: AIProvider) {}

  async generate(scanned: ScanResult[], org: string): Promise<PlanResult> {
    if (!this.ai.live) {
      return { plan: { ...DATA.orgPlan, org }, mode: "fallback" };
    }
    const raw = await this.ai.complete({
      system: SYSTEM,
      messages: [{ role: "user", content: `Organization: ${org}\n\nFindings:\n${this.digest(scanned)}\n\nReturn the plan JSON.` }],
      maxTokens: 1500,
    });
    return { plan: this.parse(raw, org), mode: "live" };
  }

  private digest(scanned: ScanResult[]): string {
    if (scanned.length === 0) {
      return "No live scans yet; base the plan on this baseline: 13 critical, 12 high, 11 monitor findings across 71 repos (Java/Go/Python/C#). Worst: RSA keygen + TLS_RSA pins in payments-service; TLS 1.0/1.1 in partner-edi.";
    }
    return scanned
      .map((x) => `${x.repo} (grade ${x.grade}, ${x.critical} critical/${x.high} high): ${x.detail.slice(0, 6).map((f) => `${f.kind} @ ${f.file}:${f.line}`).join("; ")}`)
      .join("\n");
  }

  private parse(raw: string, org: string): unknown {
    try {
      return JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    } catch {
      return { ...DATA.orgPlan, org };
    }
  }
}
