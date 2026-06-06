// ============================================================
// providers/SourceProvider.ts — abstraction over a code host.
// Providers do I/O only: fetch repository metadata + scannable
// files. They know nothing about rules or scoring.
// ============================================================
import type { LoadedRepository, Provider, Target } from "../types";

export interface SourceProvider {
  readonly kind: Provider;
  loadRepository(target: Target, maxFiles: number): Promise<LoadedRepository>;
}

/** Thrown for expected, user-facing provider failures. */
export class ProviderError extends Error {}
