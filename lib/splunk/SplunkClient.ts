// ============================================================
// splunk/SplunkClient.ts — abstraction + no-op implementation.
// Read methods return null when unavailable so callers can fall
// back to local seed data.
// ============================================================
import type { AlgoMixItem, CodeRollup, IngestResult, Org, OrgPlan, RepoSeed, RoadmapPhase, ScanResult, TopAsset } from "../types";
import type { SplunkSearchResult } from "./SplunkSearchClient";

export type RiskTier = "critical" | "high" | "monitor" | "safe";

export interface RiskSummary {
  riskScore: number;
  riskBand: string;
  lastMonthScore?: number;
  endpointsScanned?: number;
  coverage?: number;
  connectionsObserved?: number;
  certsTracked?: number;
  breakdown: { key: RiskTier; value: number }[];
}

export interface TlsConnection {
  server: string;
  src: string;
  dst: string;
  version: string;
  cipher: string;
  curve: string;
  risk: RiskTier;
  hosts: number;
  seen: string;
  _time?: string;
}

export interface Certificate {
  subject: string;
  alg: string;
  bits: number | null;
  expiry: number;
  issuer: string;
  urgency: "renew" | "plan" | "monitor" | "done";
  _time?: string;
}

export interface HndlAnomaly {
  dst: string;
  asn: string;
  geo: string;
  volume: string;
  baseline: string;
  deviation: number;
  sessions: number;
  window: string;
  status: "active" | "watch";
  note: string;
  _time?: string;
}

export interface ComplianceControl {
  id: string;
  framework: string;
  authority: string;
  title: string;
  description: string;
  state: "passed" | "failed" | "partial";
  score: number;
  evaluated: number;
  failures: number;
  recommendation: string;
}

export interface ComplianceStat {
  framework: string;
  authority: string;
  desc: string;
  progress: number;
  mapped: number;
  atRisk: number;
  controls: ComplianceControl[];
}

export interface ComplianceSummary {
  overallProgress: number;
  totalControls: number;
  passedControls: number;
  atRiskAssets: number;
  totalAssets: number;
}

export interface SplunkClient {
  readonly enabled: boolean;
  sendFindings(result: ScanResult): Promise<IngestResult>;
  query(search: string, maxCount?: number): Promise<SplunkSearchResult>;
  getRiskSummary(): Promise<RiskSummary | null>;
  getInventory(filters?: { risk?: string; version?: string; cipher?: string }): Promise<TlsConnection[] | null>;
  getCertificates(): Promise<Certificate[] | null>;
  getHndlAnomalies(): Promise<HndlAnomaly[] | null>;
  getComplianceStats(): Promise<ComplianceStat[] | null>;
  getAlgoMix(): Promise<AlgoMixItem[] | null>;
  getTopAssets(): Promise<TopAsset[] | null>;
  getRiskTrend(): Promise<number[] | null>;
  getHndlTimeline(): Promise<number[] | null>;
  getRoadmap(): Promise<RoadmapPhase[] | null>;
  getOrgs(): Promise<Org[] | null>;
  getRepos(): Promise<RepoSeed[] | null>;
  getCodeRollup(): Promise<CodeRollup | null>;
  getOrgPlan(org: string): Promise<OrgPlan | null>;
}

/** Used when Splunk is not configured. Always a clean no-op. */
export class NoopSplunkClient implements SplunkClient {
  readonly enabled = false;
  async sendFindings(): Promise<IngestResult> {
    return { sent: 0, ok: false, reason: "Splunk not configured (set SPLUNK_HEC_URL + SPLUNK_HEC_TOKEN)." };
  }
  async query(): Promise<SplunkSearchResult> { return { fields: [], results: [] }; }
  async getRiskSummary(): Promise<null> { return null; }
  async getInventory(): Promise<null> { return null; }
  async getCertificates(): Promise<null> { return null; }
  async getHndlAnomalies(): Promise<null> { return null; }
  async getComplianceStats(): Promise<null> { return null; }
  async getAlgoMix(): Promise<null> { return null; }
  async getTopAssets(): Promise<null> { return null; }
  async getRiskTrend(): Promise<null> { return null; }
  async getHndlTimeline(): Promise<null> { return null; }
  async getRoadmap(): Promise<null> { return null; }
  async getOrgs(): Promise<null> { return null; }
  async getRepos(): Promise<null> { return null; }
  async getCodeRollup(): Promise<null> { return null; }
  async getOrgPlan(): Promise<null> { return null; }
}
