// ============================================================
// lib/services/dataSource.ts — reads dashboard data from Splunk
// when connected and useful, otherwise falls back to the local
// SQLite seed dataset so panels are never empty.
// ============================================================
import { createSplunkClient } from "@/lib/splunk/splunkFactory";
import { LocalDataClient } from "./LocalDataClient";
import type { SplunkClient } from "@/lib/splunk/SplunkClient";

function local(): SplunkClient {
  return new LocalDataClient();
}

export type DataSourceResult<T> = { data: T; source: "splunk" | "local" } | { data: null; source: null };

export async function getRiskSummary(): Promise<DataSourceResult<import("@/lib/splunk/SplunkClient").RiskSummary>> {
  const splunk = createSplunkClient();
  console.log("[dataSource:getRiskSummary] splunk.enabled:", splunk.enabled);
  const live = await splunk.getRiskSummary();
  console.log("[dataSource:getRiskSummary] splunk result:", live ? { riskScore: live.riskScore, endpointsScanned: live.endpointsScanned } : null);
  const useful = live && (live.riskScore > 0 || (live.endpointsScanned ?? 0) > 0 || (live.connectionsObserved ?? 0) > 0);
  if (useful) return { data: live, source: "splunk" };
  const fallback = await local().getRiskSummary();
  console.log("[dataSource:getRiskSummary] local fallback:", fallback ? { riskScore: fallback.riskScore } : null);
  return fallback ? { data: fallback, source: "local" } : { data: null, source: null };
}

export async function getInventory(filters?: { risk?: string; version?: string; cipher?: string }): Promise<DataSourceResult<import("@/lib/splunk/SplunkClient").TlsConnection[]>> {
  const splunk = createSplunkClient();
  const live = await splunk.getInventory(filters);
  console.log("[dataSource:getInventory] splunk rows:", live?.length ?? 0, "filters:", filters);
  if (live && live.length > 0) return { data: live, source: "splunk" };
  const fallback = await local().getInventory(filters);
  console.log("[dataSource:getInventory] local rows:", fallback?.length ?? 0);
  return fallback && fallback.length > 0 ? { data: fallback, source: "local" } : { data: null, source: null };
}

export async function getCertificates(): Promise<DataSourceResult<import("@/lib/splunk/SplunkClient").Certificate[]>> {
  const splunk = createSplunkClient();
  const live = await splunk.getCertificates();
  console.log("[dataSource:getCertificates] splunk rows:", live?.length ?? 0);
  if (live && live.length > 0) return { data: live, source: "splunk" };
  const fallback = await local().getCertificates();
  console.log("[dataSource:getCertificates] local rows:", fallback?.length ?? 0);
  return fallback && fallback.length > 0 ? { data: fallback, source: "local" } : { data: null, source: null };
}

export async function getHndlAnomalies(): Promise<DataSourceResult<import("@/lib/splunk/SplunkClient").HndlAnomaly[]>> {
  const splunk = createSplunkClient();
  const live = await splunk.getHndlAnomalies();
  console.log("[dataSource:getHndlAnomalies] splunk rows:", live?.length ?? 0);
  if (live && live.length > 0) return { data: live, source: "splunk" };
  const fallback = await local().getHndlAnomalies();
  console.log("[dataSource:getHndlAnomalies] local rows:", fallback?.length ?? 0);
  return fallback && fallback.length > 0 ? { data: fallback, source: "local" } : { data: null, source: null };
}

export async function getHndlTimeline(): Promise<DataSourceResult<number[]>> {
  const splunk = createSplunkClient();
  const live = await splunk.getHndlTimeline();
  if (live && live.length > 0) return { data: live, source: "splunk" };
  const fallback = await local().getHndlTimeline();
  return fallback && fallback.length > 0 ? { data: fallback, source: "local" } : { data: null, source: null };
}

export async function getComplianceStats(): Promise<DataSourceResult<import("@/lib/splunk/SplunkClient").ComplianceStat[]>> {
  const splunk = createSplunkClient();
  const live = await splunk.getComplianceStats();
  if (live && live.length > 0) return { data: live, source: "splunk" };
  const fallback = await local().getComplianceStats();
  return fallback && fallback.length > 0 ? { data: fallback, source: "local" } : { data: null, source: null };
}

export async function getAlgoMix(): Promise<DataSourceResult<import("@/lib/types").AlgoMixItem[]>> {
  const splunk = createSplunkClient();
  const live = await splunk.getAlgoMix();
  if (live && live.length > 0) return { data: live, source: "splunk" };
  const fallback = await local().getAlgoMix();
  return fallback && fallback.length > 0 ? { data: fallback, source: "local" } : { data: null, source: null };
}

export async function getTopAssets(): Promise<DataSourceResult<import("@/lib/types").TopAsset[]>> {
  const splunk = createSplunkClient();
  const live = await splunk.getTopAssets();
  if (live && live.length > 0) return { data: live, source: "splunk" };
  const fallback = await local().getTopAssets();
  return fallback && fallback.length > 0 ? { data: fallback, source: "local" } : { data: null, source: null };
}

export async function getRiskTrend(): Promise<DataSourceResult<number[]>> {
  const splunk = createSplunkClient();
  const live = await splunk.getRiskTrend();
  if (live && live.length > 0) return { data: live, source: "splunk" };
  const fallback = await local().getRiskTrend();
  return fallback && fallback.length > 0 ? { data: fallback, source: "local" } : { data: null, source: null };
}

export async function getRoadmap(): Promise<DataSourceResult<import("@/lib/types").RoadmapPhase[]>> {
  const splunk = createSplunkClient();
  const live = await splunk.getRoadmap();
  if (live && live.length > 0) return { data: live, source: "splunk" };
  const fallback = await local().getRoadmap();
  return fallback && fallback.length > 0 ? { data: fallback, source: "local" } : { data: null, source: null };
}

export async function getOrgs(): Promise<DataSourceResult<import("@/lib/types").Org[]>> {
  const splunk = createSplunkClient();
  const live = await splunk.getOrgs();
  if (live && live.length > 0) return { data: live, source: "splunk" };
  const fallback = await local().getOrgs();
  return fallback && fallback.length > 0 ? { data: fallback, source: "local" } : { data: null, source: null };
}

export async function getRepos(): Promise<DataSourceResult<import("@/lib/types").RepoSeed[]>> {
  const splunk = createSplunkClient();
  const live = await splunk.getRepos();
  if (live && live.length > 0) return { data: live, source: "splunk" };
  const fallback = await local().getRepos();
  return fallback && fallback.length > 0 ? { data: fallback, source: "local" } : { data: null, source: null };
}

export async function getCodeRollup(): Promise<DataSourceResult<import("@/lib/types").CodeRollup>> {
  const splunk = createSplunkClient();
  const live = await splunk.getCodeRollup();
  if (live && live.findings > 0) return { data: live, source: "splunk" };
  const fallback = await local().getCodeRollup();
  return fallback && fallback.findings > 0 ? { data: fallback, source: "local" } : { data: null, source: null };
}

export async function getOrgPlan(org: string): Promise<DataSourceResult<import("@/lib/types").OrgPlan>> {
  const splunk = createSplunkClient();
  const live = await splunk.getOrgPlan(org);
  if (live) return { data: live, source: "splunk" };
  const fallback = await local().getOrgPlan(org);
  return fallback ? { data: fallback, source: "local" } : { data: null, source: null };
}
