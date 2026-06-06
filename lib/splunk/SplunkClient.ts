// ============================================================
// splunk/SplunkClient.ts — abstraction + no-op implementation.
// Read methods return null when unavailable so callers can fall
// back to local seed data.
// ============================================================
import type { IngestResult, ScanResult } from "../types";
import type { SplunkSearchResult } from "./SplunkSearchClient";

export type RiskTier = "critical" | "high" | "monitor" | "safe";

export interface RiskSummary {
  riskScore: number;
  riskBand: string;
  lastMonthScore?: number;
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

export interface ComplianceStat {
  framework: string;
  authority: string;
  desc: string;
  progress: number;
  mapped: number;
  atRisk: number;
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
}
