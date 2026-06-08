// ============================================================
// ai/DeepSeekProvider.ts — DeepSeek Chat Completions API.
// Compatible with OpenAI-format: https://api.deepseek.com
// ============================================================
import { config } from "../config";
import type { AICompletionRequest } from "../types";
import { AIProvider } from "./AIProvider";

export class DeepSeekProvider implements AIProvider {
  readonly live = true;
  readonly name = "DeepSeek";

  async complete(req: AICompletionRequest): Promise<string> {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.ai.apiKey as string}`,
      },
      body: JSON.stringify({
        model: config.ai.model,
        max_tokens: req.maxTokens ?? 1024,
        messages: [
          ...(req.system ? [{ role: "system" as const, content: req.system }] : []),
          ...req.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`DeepSeek ${res.status}: ${detail.slice(0, 200)}`);
    }
    const data = await res.json();
    return (data?.choices?.[0]?.message?.content ?? "").trim();
  }
}
