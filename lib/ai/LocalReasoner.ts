// ============================================================
// ai/LocalReasoner.ts — deterministic fallback used when no API
// key is configured. Keeps the assistant functional offline by
// answering from the indexed posture rather than a live model.
// ============================================================
import { DATA } from "../data";
import type { AICompletionRequest } from "../types";
import { AIProvider } from "./AIProvider";

export class LocalReasoner implements AIProvider {
  readonly live = false;

  async complete(req: AICompletionRequest): Promise<string> {
    const last = [...req.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    return this.answer(last.toLowerCase());
  }

  private answer(q: string): string {
    const s = DATA.summary;
    if (q.includes("rsa"))
      return "3 production services still negotiate RSA key exchange — **payments-api.prod** (38 hosts), **auth-gateway.prod** (22 hosts) and **backup-svc.internal** (6 hosts). All are Tier-0 and harvestable today. First action: enable `X25519MLKEM768` on payments-api.prod (~2 engineer-days).";
    if (q.includes("tls 1.3") || q.includes("tls1.3") || q.includes("version"))
      return "16 of 23 monitored services still negotiate TLS 1.2 or older; **legacy-vpn.dmz** and **iot-hub.ot** are on TLS 1.0 and should be disabled immediately. Disabling TLS 1.0/1.1 fleet-wide is a 1-day policy change with no PQC dependency.";
    if (q.includes("score") || q.includes("month") || q.includes("change"))
      return `Quantum risk score improved **77 → ${s.riskScore}** (-9). Drivers: api-gw.prod and identity-v2.prod moved to ML-KEM hybrid; partly offset by +47 new RSA connections on payments-api.`;
    if (q.includes("cert") || q.includes("expire"))
      return "6 certificates expire within 90 days; 3 are still RSA-2048 (iot-hub.ot RSA-1024 in 5 days is the worst). Renew these directly with `ML-DSA-65` rather than re-issuing RSA — it avoids a second migration later.";
    return `Based on indexed data: your quantum risk score is **${s.riskScore}/100** with 23 critical exposures concentrated in RSA key-exchange services. Set \`ANTHROPIC_API_KEY\` for free-form answers, or open the Repository Scanner to live-scan a repo.`;
  }
}
