// ============================================================
// lib/ai/LocalReasoner.ts — deterministic fallback used when no
// external AI API key is configured. It reads the grounded context
// built from local SQLite scans (and Splunk if present) so answers
// are specific to the current posture instead of generic.
// ============================================================
import type { AICompletionRequest } from "../types";
import { AIProvider } from "./AIProvider";

export class LocalReasoner implements AIProvider {
  readonly live = false;
  readonly name = "Local Reasoner";

  async complete(req: AICompletionRequest): Promise<string> {
    const last = [...req.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const ctx = req.system || "";
    return this.answer(last.toLowerCase(), ctx);
  }

  private extract(ctx: string, label: string): string {
    const m = ctx.match(new RegExp(`${label}:\\s*(.+)`));
    return m ? m[1].trim() : "";
  }

  private repos(ctx: string): string[] {
    const block = ctx.match(/LIVE-SCANNED REPOS:\n([\s\S]*?)(?=\n\n|COMPLIANCE:|$)/);
    if (!block) return [];
    return block[1].split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("none yet"));
  }

  private answer(q: string, ctx: string): string {
    const scoreLine = this.extract(ctx, "QUANTUM RISK SCORE");
    const networkLine = this.extract(ctx, "NETWORK");
    const tierLine = this.extract(ctx, "CONNECTION PROFILES BY TIER");
    const criticalEndpoints = this.extract(ctx, "CRITICAL TLS ENDPOINTS");
    const expiringCerts = this.extract(ctx, "CERTS EXPIRING <90d");
    const algoMix = this.extract(ctx, "ALGO MIX");
    const repoLines = this.repos(ctx);

    if (q.includes("score") || q.includes("risk") || q.includes("posture")) {
      return scoreLine
        ? `Your current quantum risk posture: ${scoreLine}. ${networkLine} Connection breakdown: ${tierLine}.`
        : "No scans yet. Run a repository scan or add a TLS endpoint to build your risk score.";
    }

    if (q.includes("repo") || q.includes("code") || q.includes("finding")) {
      if (repoLines.length === 0) return "No repositories have been scanned yet. Use the Repository Scanner to analyze a public repo.";
      const summary = repoLines.map((r) => `• ${r}`).join("\n");
      return `Local repository scans:\n${summary}`;
    }

    if (q.includes("tls") || q.includes("server") || q.includes("endpoint") || q.includes("network")) {
      if (tierLine.includes("critical 0") && tierLine.includes("high 0") && tierLine.includes("monitor 0")) {
        return `${networkLine} No vulnerable TLS endpoints detected locally.`;
      }
      return `${networkLine} Breakdown: ${tierLine}.${criticalEndpoints && criticalEndpoints !== "none detected" ? ` Critical endpoints: ${criticalEndpoints}.` : ""}`;
    }

    if (q.includes("cert") || q.includes("expire") || q.includes("pki")) {
      if (!expiringCerts || expiringCerts === "none detected") return "No certificates expiring within 90 days have been detected.";
      return `Certificates expiring within 90 days: ${expiringCerts}. Renew them with PQC-capable algorithms (e.g., ML-DSA-65) to avoid a second migration.`;
    }

    if (q.includes("rsa")) {
      return "RSA key exchange is quantum-vulnerable. Prioritize migrating Tier-0 services to hybrid ML-KEM (e.g., X25519MLKEM768) under TLS 1.3.";
    }

    if (q.includes("tls 1.3") || q.includes("tls1.3") || q.includes("version")) {
      return "Enable TLS 1.3 fleet-wide and disable TLS 1.0/1.1 fallback. This is typically a policy/config change measured in hours, not days.";
    }

    if (q.includes("algo") || q.includes("cipher") || q.includes("mix")) {
      return algoMix && algoMix !== "no data"
        ? `Observed algorithm mix: ${algoMix}.`
        : "No algorithm mix data available yet. Scan TLS endpoints to populate it.";
    }

    return scoreLine
      ? `Current posture: ${scoreLine}. Ask me about repos, TLS endpoints, certificates, algorithms, or RSA/TLS 1.3 migration.`
      : "Set DEEPSEEK_API_KEY for free-form AI answers, or run a repo/TLS scan to ground answers in your data.";
  }
}
