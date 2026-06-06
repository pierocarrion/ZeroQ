// ============================================================
// Shared domain types.
// ============================================================

export type Severity = "critical" | "high" | "monitor";
export type RiskTier = "critical" | "high" | "monitor" | "safe";
export type Provider = "github" | "gitlab";

/** A parsed scan target. */
export interface Target {
  provider: Provider;
  owner?: string;
  repo?: string;
  path?: string;
}

/** A source file pulled from a provider, ready to scan. */
export interface SourceFile {
  path: string;
  content: string;
}

/** Repository metadata returned by a provider. */
export interface RepoMeta {
  fullName: string;
  provider: Provider;
  branch: string;
  language: string;
}

/** What a provider returns from loadRepository(). */
export interface LoadedRepository {
  meta: RepoMeta;
  files: SourceFile[];
  totalScannable: number;
}

/** A single crypto finding inside a source file. */
export interface Finding {
  repo: string;
  file: string;
  line: number;
  kind: string;
  sev: Severity;
  code: string;
  fix: string;
  rule: string;
}

export type FindingDetail = Pick<Finding, "file" | "line" | "kind" | "sev" | "code" | "fix">;

/** Result of scanning one repository. */
export interface ScanResult {
  repo: string;
  provider: Provider;
  lang: string;
  branch: string;
  loc: string;
  owner: string;
  grade: string;
  findings: number;
  critical: number;
  high: number;
  monitor: number;
  scanned: number;
  fileCount: number;
  risk: number;
  detail: FindingDetail[];
  lastCommit: string;
  real: true;
}

export interface IngestResult {
  sent: number;
  ok: boolean;
  reason?: string;
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AICompletionRequest {
  system: string;
  messages: AssistantMessage[];
  maxTokens?: number;
}
