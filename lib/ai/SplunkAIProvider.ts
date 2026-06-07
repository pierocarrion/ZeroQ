// ============================================================
// ai/SplunkAIProvider.ts — stub for Splunk AI Assistant integration.
// When Splunk exposes a public completion API, implement complete() here.
// ============================================================
import type { AICompletionRequest } from "../types";
import { AIProvider } from "./AIProvider";

export class SplunkAIProvider implements AIProvider {
  readonly live = false;
  readonly name = "Splunk AI Assistant";

  async complete(_req: AICompletionRequest): Promise<string> {
    return "Splunk AI Assistant integration is coming soon. Please select Anthropic Claude or Local Reasoner in Settings.";
  }
}
