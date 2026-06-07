// ============================================================
// ai/aiFactory.ts — pick the model provider based on config.
// ============================================================
import { config } from "../config";
import { AIProvider } from "./AIProvider";
import { AnthropicProvider } from "./AnthropicProvider";
import { LocalReasoner } from "./LocalReasoner";
import { SplunkAIProvider } from "./SplunkAIProvider";

export function createAIProvider(): AIProvider {
  if (config.ai.provider === "splunk") return new SplunkAIProvider();
  return config.ai.enabled ? new AnthropicProvider() : new LocalReasoner();
}
