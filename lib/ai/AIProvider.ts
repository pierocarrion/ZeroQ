// ============================================================
// ai/AIProvider.ts — abstraction over a language model.
// ============================================================
import type { AICompletionRequest } from "../types";

export interface AIProvider {
  /** Whether this is a real hosted model (vs. a local fallback). */
  readonly live: boolean;
  readonly name: string;
  complete(req: AICompletionRequest): Promise<string>;
}
