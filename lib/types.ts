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
  lastCommit: string;
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
  files: string[];
  lastCommit: string;
  real: true;
}

export interface AlgoMixItem {
  algo: string;
  pct: number;
  risk: RiskTier;
}

export interface TopAsset {
  name: string;
  risk: RiskTier;
  algo: string;
  hosts: number;
  txns: string;
  sensitivity: string;
}

export interface RoadmapItem {
  asset: string;
  action: string;
  effort: string;
  impact: string;
  why: string;
}

export interface RoadmapPhase {
  phase: string;
  window: string;
  tone: "crit" | "high" | "safe";
  items: RoadmapItem[];
}

export interface Org {
  id: string;
  provider: Provider;
  name: string;
  repos: number;
  scanned: number;
  lastScan: string;
  status: "connected" | "scanning";
  stars: string;
  members: number;
}

export interface RepoSeed {
  repo: string;
  provider: Provider;
  lang: string;
  loc: string;
  grade: string;
  findings: number;
  critical: number;
  lastCommit: string;
  branch: string;
  owner: string;
  detail: FindingDetail[];
}

export interface CodeRollup {
  reposScanned: number;
  reposTotal: number;
  filesScanned: number;
  findings: number;
  critical: number;
  high: number;
  monitor: number;
  fixablePR: number;
  avgGrade: string;
  byLang: { lang: string; findings: number; color: string }[];
  patterns: { pattern: string; count: number; sev: Severity }[];
}

export interface PlanAction {
  repo: string;
  task: string;
  pr: string;
  effort: string;
}

export interface PlanStream {
  title: string;
  tone: "crit" | "high" | "safe";
  window: string;
  actions: PlanAction[];
}

export interface OrgPlan {
  org: string;
  generated: string;
  summary: string;
  posture: string;
  targetPosture: string;
  weeks: number;
  streams: PlanStream[];
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
