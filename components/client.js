"use client";
import { useSyncExternalStore, useEffect, useState } from "react";

/* ============================================================
   Client API + shared store for live-scanned repositories.
   ============================================================ */

// ---- tiny external store so any screen sees live-scanned repos ----
let scanned = [];
const listeners = new Set();
function emit() { listeners.forEach((l) => l()); }

export const repoStore = {
  subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); },
  getSnapshot() { return scanned; },
  add(result) {
    const i = scanned.findIndex((x) => x.repo === result.repo);
    if (i >= 0) scanned = scanned.map((x, j) => (j === i ? result : x));
    else scanned = [result, ...scanned];
    emit();
  },
};
export function useScannedRepos() {
  return useSyncExternalStore(repoStore.subscribe, repoStore.getSnapshot, () => scanned);
}

// ---- API calls ----
export async function apiScan(target) {
  const res = await fetch("/api/scan", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ target }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Scan failed");
  return data; // { result, splunk }
}

export async function apiAssistant(messages, scannedRepos) {
  const res = await fetch("/api/assistant", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, scanned: scannedRepos || [] }),
  });
  const data = await res.json();
  return data; // { text, mode }
}

export async function apiPlan(scannedRepos, org) {
  const res = await fetch("/api/plan", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ scanned: scannedRepos || [], org: org || "acme-corp" }),
  });
  const data = await res.json();
  return data; // { plan, mode }
}

export async function apiRisk() {
  const res = await fetch("/api/risk", { cache: "no-store" });
  return res.json();
}

export async function apiScanBatch(repos) {
  const res = await fetch("/api/scan-batch", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ repos }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Batch scan failed");
  return data;
}

export async function apiGet(path) {
  const res = await fetch(path, { cache: "no-store" });
  return res.json();
}

export async function apiSplunkQuery(query) {
  const res = await fetch("/api/splunk/query", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

// ---- Hook: fetch from a Splunk-backed endpoint with seed fallback ----
export function useSplunkData(endpoint, fallback, deps = []) {
  const [state, setState] = useState({ data: fallback, source: "seed", loading: true, error: null });
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const json = await apiGet(endpoint);
        if (!mounted) return;
        if (json.data) {
          setState({ data: json.data, source: json.source || "unknown", loading: false, error: json.error || null });
        } else {
          setState({ data: fallback, source: "seed", loading: false, error: json.error || "Invalid response" });
        }
      } catch (e) {
        if (!mounted) return;
        setState({ data: fallback, source: "seed", loading: false, error: e?.message });
      }
    }
    load();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, ...deps]);
  return state;
}
