// ============================================================
// ai/AnthropicProvider.ts — Anthropic Messages API.
// ============================================================
import { config } from "../config";
import type { AICompletionRequest } from "../types";
import { AIProvider } from "./AIProvider";

export class AnthropicProvider implements AIProvider {
  readonly live = true;
  readonly name = "Anthropic Claude";

  async complete(req: AICompletionRequest): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.ai.apiKey as string,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.ai.model,
        max_tokens: req.maxTokens ?? 1024,
        system: req.system,
        messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Anthropic ${res.status}: ${detail.slice(0, 200)}`);
    }
    const data = await res.json();
    return (data?.content?.[0]?.text ?? "").trim();
  }
}
