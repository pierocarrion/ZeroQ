// ============================================================
// ai/aiFactory.ts — pick the model provider based on config.
// ============================================================
import { config } from "../config";
import { AIProvider } from "./AIProvider";
import { DeepSeekProvider } from "./DeepSeekProvider";
import { LocalReasoner } from "./LocalReasoner";
import { SplunkAIProvider } from "./SplunkAIProvider";

export function createAIProvider(): AIProvider {
  if (config.ai.provider === "splunk") return new SplunkAIProvider();
  if (config.ai.provider === "deepseek") return new DeepSeekProvider();
  return config.ai.enabled ? new DeepSeekProvider() : new LocalReasoner();
}
