// ============================================================
// ai/aiFactory.ts — pick the model provider based on config.
// ============================================================
import { config } from "../config";
import { AIProvider } from "./AIProvider";
import { AnthropicProvider } from "./AnthropicProvider";
import { LocalReasoner } from "./LocalReasoner";

export function createAIProvider(): AIProvider {
  return config.ai.enabled ? new AnthropicProvider() : new LocalReasoner();
}
