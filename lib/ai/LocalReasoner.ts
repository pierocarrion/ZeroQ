// ============================================================
// ai/LocalReasoner.ts — deterministic fallback used when no API
// key is configured. Gives generic guidance instead of seed data.
// ============================================================
import type { AICompletionRequest } from "../types";
import { AIProvider } from "./AIProvider";

export class LocalReasoner implements AIProvider {
  readonly live = false;
  readonly name = "Local Reasoner";

  async complete(req: AICompletionRequest): Promise<string> {
    const last = [...req.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    return this.answer(last.toLowerCase());
  }

  private answer(q: string): string {
    if (q.includes("rsa"))
      return "RSA key exchange is quantum-vulnerable. Prioritize migrating Tier-0 services to hybrid ML-KEM (e.g., X25519MLKEM768) under TLS 1.3.";
    if (q.includes("tls 1.3") || q.includes("tls1.3") || q.includes("version"))
      return "Enable TLS 1.3 fleet-wide and disable TLS 1.0/1.1 fallback. This is typically a policy/config change measured in hours, not days.";
    if (q.includes("score") || q.includes("month") || q.includes("change"))
      return "Connect Splunk to see live quantum risk scores and trends.";
    if (q.includes("cert") || q.includes("expire"))
      return "Track certificates expiring within 90 days and renew them with PQC-capable algorithms (ML-DSA-65) rather than RSA to avoid double migration.";
    return "Set ANTHROPIC_API_KEY for free-form AI answers, or open the Repository Scanner to live-scan a public repo.";
  }
}
