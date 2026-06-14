// ============================================================
// splunk/SplunkSearchClient.ts — executes SPL via Splunk REST API
// and returns typed results. Falls back gracefully on errors.
// ============================================================
import { config } from "../config";
import { splunkFetch } from "./fetchSplunk";

export interface SplunkSearchResult {
  fields: string[];
  results: Record<string, any>[];
}

export interface SplunkQueryOptions {
  earliest?: string;
  latest?: string;
  maxCount?: number;
}

export class SplunkSearchClient {
  readonly enabled: boolean;
  private readonly baseUrl: string;
  private readonly auth: string;
  private cache = new Map<string, { ts: number; data: SplunkSearchResult }>();
  private readonly ttlMs = 30_000;

  constructor() {
    this.enabled = config.splunk.searchEnabled;
    let url = (config.splunk.baseUrl || "").replace(/\/$/, "");
    // Splunk REST API lives on port 8089 by default; auto-correct if user gave the Web UI URL.
    try {
      const u = new URL(url);
      if (u.port === "" && (u.protocol === "https:" || u.protocol === "http:")) {
        url = `${url}:8089`;
      }
    } catch { /* ignore malformed URLs — let runtime fetch fail naturally */ }
    this.baseUrl = url;
    const user = config.splunk.username || "";
    const pass = config.splunk.password || "";
    this.auth = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  }

  async query(search: string, opts: SplunkQueryOptions = {}): Promise<SplunkSearchResult> {
    console.log("[SplunkSearchClient:query] enabled:", this.enabled, "search:", search.slice(0, 120));
    if (!this.enabled) return { fields: [], results: [] };

    const cacheKey = `${search}::${opts.earliest || ""}::${opts.latest || ""}::${opts.maxCount || 0}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < this.ttlMs) return cached.data;

    try {
      const sid = await this.createJob(search, opts);
      console.log("[SplunkSearchClient:query] job sid:", sid);
      await this.waitForJob(sid);
      const data = await this.readResults(sid, opts.maxCount);
      console.log("[SplunkSearchClient:query] results:", data.results.length);
      this.cache.set(cacheKey, { ts: Date.now(), data });
      return data;
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("[SplunkSearch] query failed:", e?.message || e);
      return { fields: [], results: [] };
    }
  }

  private async createJob(search: string, opts: SplunkQueryOptions): Promise<string> {
    const body = new URLSearchParams({
      search: search.trim().startsWith("search") || search.trim().startsWith("|") ? search : `search ${search}`,
      output_mode: "json",
      earliest_time: opts.earliest ?? "-24h",
      latest_time: opts.latest ?? "now",
    });
    const res = await splunkFetch(`${this.baseUrl}/services/search/jobs`, {
      method: "POST",
      headers: { Authorization: this.auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) throw new Error(`Create job failed: ${res.status}`);
    const json = (await res.json()) as { sid?: string };
    if (!json.sid) throw new Error("No search job SID returned");
    return json.sid;
  }

  private async waitForJob(sid: string): Promise<void> {
    const url = `${this.baseUrl}/services/search/jobs/${sid}?output_mode=json`;
    for (let i = 0; i < 60; i++) {
      const res = await splunkFetch(url, { headers: { Authorization: this.auth } });
      if (!res.ok) throw new Error(`Job status failed: ${res.status}`);
      const json = (await res.json()) as any;
      const entry = json.entry?.[0];
      const dispatchState = entry?.content?.dispatchState;
      if (dispatchState === "DONE" || dispatchState === "FAILED") {
        if (dispatchState === "FAILED") throw new Error("Search job failed");
        return;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error("Search job timed out");
  }

  private async readResults(sid: string, maxCount?: number): Promise<SplunkSearchResult> {
    const params = new URLSearchParams({ output_mode: "json" });
    if (maxCount) params.set("count", String(maxCount));
    const url = `${this.baseUrl}/services/search/jobs/${sid}/results?${params.toString()}`;
    const res = await splunkFetch(url, { headers: { Authorization: this.auth } });
    if (res.status === 204) return { fields: [], results: [] };
    if (!res.ok) throw new Error(`Read results failed: ${res.status}`);
    const json = (await res.json()) as { fields?: { name: string }[]; results?: Record<string, any>[] };
    const fields = (json.fields || []).map((f) => f.name);
    return { fields, results: json.results || [] };
  }
}
