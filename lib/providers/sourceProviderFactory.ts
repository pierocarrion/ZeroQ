// ============================================================
// providers/sourceProviderFactory.ts — selects a provider for
// a target. Adding a new host means adding a case here and a
// class; nothing downstream changes (Open/Closed).
// ============================================================
import type { Provider } from "../types";
import { SourceProvider } from "./SourceProvider";
import { GitHubProvider } from "./GitHubProvider";
import { GitLabProvider } from "./GitLabProvider";

export function createSourceProvider(kind: Provider): SourceProvider {
  switch (kind) {
    case "github": return new GitHubProvider();
    case "gitlab": return new GitLabProvider();
    default: throw new Error(`Unsupported provider: ${kind}`);
  }
}
