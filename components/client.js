"use client";
import { useSyncExternalStore, useEffect, useState } from "react";

/* ============================================================
   Client API + shared store for live-scanned repositories.
   Syncs across browser tabs via BroadcastChannel + localStorage.
   ============================================================ */

const isClient = typeof window !== "undefined";
const BC_NAME = "zeroq-repo-store";

// ---- tiny external store so any screen sees live-scanned repos ----
let scanned = [];
const listeners = new Set();
function emit() { listeners.forEach((l) => l()); }

let scanningTarget = null;
let scanProgress = null;
let lastScanProgress = null;
const scanningListeners = new Set();
function emitScanning() { scanningListeners.forEach((l) => l()); }

function broadcast(type, payload) {
  if (!isClient) return;
  try {
    const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(BC_NAME) : null;
    if (bc) {
      bc.postMessage({ type, payload });
      bc.close();
    }
  } catch {}
  try {
    localStorage.setItem(
      "zeroq.repoStore.v1",
      JSON.stringify({ scanned, scanningTarget, scanProgress, lastScanProgress, ts: Date.now() })
    );
  } catch {}
}

if (isClient) {
  // Hydrate from any other tab that already published state
  try {
    const raw = localStorage.getItem("zeroq.repoStore.v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.scanned)) scanned = parsed.scanned;
      if (parsed.scanningTarget != null) scanningTarget = parsed.scanningTarget;
      if (parsed.scanProgress != null) scanProgress = parsed.scanProgress;
      if (parsed.lastScanProgress != null) lastScanProgress = parsed.lastScanProgress;
    }
  } catch {}

  try {
    const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(BC_NAME) : null;
    if (bc) {
      bc.onmessage = (ev) => {
        const { type, payload } = ev.data || {};
        if (type === "scanned") {
          scanned = payload;
          emit();
        } else if (type === "scanningTarget") {
          scanningTarget = payload;
          emitScanning();
        } else if (type === "scanProgress") {
          scanProgress = payload;
          emitScanning();
        } else if (type === "lastScanProgress") {
          lastScanProgress = payload;
          emitScanning();
        }
      };
    }
  } catch {}

  window.addEventListener("storage", (ev) => {
    if (ev.key !== "zeroq.repoStore.v1") return;
    try {
      const parsed = JSON.parse(ev.newValue || "{}");
      if (Array.isArray(parsed.scanned)) { scanned = parsed.scanned; emit(); }
      if (parsed.scanningTarget !== undefined) { scanningTarget = parsed.scanningTarget; emitScanning(); }
      if (parsed.scanProgress !== undefined) { scanProgress = parsed.scanProgress; emitScanning(); }
      if (parsed.lastScanProgress !== undefined) { lastScanProgress = parsed.lastScanProgress; emitScanning(); }
    } catch {}
  });
}

export const repoStore = {
  subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); },
  getSnapshot() { return scanned; },
  add(result) {
    const i = scanned.findIndex((x) => x.repo === result.repo);
    if (i >= 0) scanned = scanned.map((x, j) => (j === i ? result : x));
    else scanned = [result, ...scanned];
    broadcast("scanned", scanned);
    emit();
  },
  setScanningTarget(target) {
    scanningTarget = target || null;
    broadcast("scanningTarget", scanningTarget);
    emitScanning();
  },
  setScanProgress(progress) {
    scanProgress = progress || null;
    if (scanProgress && (scanProgress.step === "act" || scanProgress.step === "error")) {
      lastScanProgress = scanProgress;
      broadcast("lastScanProgress", lastScanProgress);
    }
    broadcast("scanProgress", scanProgress);
    emitScanning();
  },
  clearScanProgress() {
    scanProgress = null;
    broadcast("scanProgress", null);
    emitScanning();
  },
  clearLastScanProgress() {
    lastScanProgress = null;
    broadcast("lastScanProgress", null);
    emitScanning();
  },
};
export function useScannedRepos() {
  return useSyncExternalStore(repoStore.subscribe, repoStore.getSnapshot, () => scanned);
}
export function useScanningTarget() {
  return useSyncExternalStore(
    (cb) => { scanningListeners.add(cb); return () => scanningListeners.delete(cb); },
    () => scanningTarget,
    () => scanningTarget
  );
}
export function useScanProgress() {
  return useSyncExternalStore(
    (cb) => { scanningListeners.add(cb); return () => scanningListeners.delete(cb); },
    () => scanProgress,
    () => scanProgress
  );
}
export function useLastScanProgress() {
  return useSyncExternalStore(
    (cb) => { scanningListeners.add(cb); return () => scanningListeners.delete(cb); },
    () => lastScanProgress,
    () => lastScanProgress
  );
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

export async function apiPlan(scannedRepos, org, opts = {}) {
  const timeoutMs = opts.timeout ?? 25_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    const res = await fetch("/api/plan", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ scanned: scannedRepos || [], org: org || "acme-corp" }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Plan generation failed");
    return data; // { plan, mode }
  } finally {
    clearTimeout(timer);
  }
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

// ---- Hook: Splunk connectivity health ----
export function useSplunkHealth() {
  const [state, setState] = useState({ connected: false, configured: false, loading: true, reason: "" });
  console.log("[useSplunkHealth] initial state:", state);
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/health/splunk", { cache: "no-store" });
        const json = await res.json();
        console.log("[useSplunkHealth] response:", json);
        if (!mounted) return;
        setState({
          connected: !!json?.connected,
          configured: json?.reason !== "Splunk not configured",
          loading: false,
          reason: json?.reason || "",
        });
      } catch (e) {
        if (!mounted) return;
        setState({ connected: false, configured: false, loading: false, reason: e?.message || "Health check failed" });
      }
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);
  return state;
}

// ---- Hook: fetch from a Splunk-backed endpoint (no seed fallback) ----
export function useSplunkData(endpoint, deps = []) {
  const [state, setState] = useState({ data: null, source: null, loading: true, error: null });
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const json = await apiGet(endpoint);
        console.log(`[useSplunkData:${endpoint}] response:`, { hasData: json.data != null, source: json.source });
        if (!mounted) return;
        if (json.data != null) {
          setState({ data: json.data, source: json.source || "unknown", summary: json.summary || null, loading: false, error: json.error || null });
        } else {
          setState({ data: null, source: null, summary: null, loading: false, error: json.error || "No data" });
        }
      } catch (e) {
        if (!mounted) return;
        setState({ data: null, source: null, summary: null, loading: false, error: e?.message });
      }
    }
    load();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, ...deps]);
  return state;
}
