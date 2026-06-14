#!/usr/bin/env node
// ============================================================
// scripts/purge-splunk.js — deletes all events from the ZeroQ
// indexes in the connected Splunk instance.
//
// Usage:
//   node scripts/purge-splunk.js
//
// Reads config from data/zeroq.db (settings table) first,
// then falls back to .env.local, then to localhost dev defaults.
//
// The script ensures the current user has the `delete_by_keyword`
// capability by creating a helper role that imports both `admin`
// and `can_delete`, and assigning it to the user.
// ============================================================
const https = require("https");
const fetch = require("node-fetch");
const path = require("path");

const DB_PATH = path.resolve(process.cwd(), "data/zeroq.db");

function loadEnv() {
  const fs = require("fs");
  const envPath = path.resolve(process.cwd(), ".env.local");
  const env = { ...process.env };
  if (!fs.existsSync(envPath)) return env;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!m) continue;
    const [, key, raw] = m;
    env[key] = raw.replace(/^["']|["']$/g, "").trim();
  }
  return env;
}

function loadSettings() {
  try {
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH);
    const rows = db.prepare("SELECT key, value FROM settings").all();
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    db.close();
    return settings;
  } catch {
    return {};
  }
}

const settings = loadSettings();
const env = loadEnv();

const BASE_URL = (settings.SPLUNK_BASE_URL || env.SPLUNK_BASE_URL || "https://localhost:8089").replace(/\/$/, "");
const USERNAME = settings.SPLUNK_USERNAME || env.SPLUNK_USERNAME || "sc_admin";
const PASSWORD = settings.SPLUNK_PASSWORD || env.SPLUNK_PASSWORD || "j6n7ba2tz1lbm6nb";
const SKIP_TLS = (settings.SPLUNK_SKIP_TLS_VERIFY || env.SPLUNK_SKIP_TLS_VERIFY || "true").toLowerCase() === "true";

const INDEXES = [
  settings.SPLUNK_INDEX_SOURCE || env.SPLUNK_INDEX_SOURCE || "crypto_source",
  settings.SPLUNK_INDEX_NET || env.SPLUNK_INDEX_NET || "crypto_net",
  settings.SPLUNK_INDEX_PKI || env.SPLUNK_INDEX_PKI || "crypto_pki",
  settings.SPLUNK_INDEX_HNDL || env.SPLUNK_INDEX_HNDL || "crypto_hndl",
  settings.SPLUNK_INDEX_PLAN || env.SPLUNK_INDEX_PLAN || "crypto_plan",
];

if (!BASE_URL || !USERNAME || !PASSWORD) {
  console.error("Splunk REST credentials not found in data/zeroq.db or .env.local");
  process.exit(1);
}

const insecureAgent = new https.Agent({ rejectUnauthorized: false });
const authHeader = "Basic " + Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64");
const defaultHeaders = { Authorization: authHeader, "Content-Type": "application/x-www-form-urlencoded" };

async function splunkFetch(url, opts = {}) {
  const body = opts.body instanceof URLSearchParams ? opts.body.toString() : opts.body;
  const res = await fetch(url, {
    ...opts,
    headers: { ...defaultHeaders, ...opts.headers },
    agent: SKIP_TLS ? insecureAgent : undefined,
    body,
  });
  return res;
}

async function ensureDeleteCapability() {
  // 1. Check whether the current user already can delete events.
  const userRes = await splunkFetch(`${BASE_URL}/servicesNS/nobody/system/authentication/users/${encodeURIComponent(USERNAME)}`);
  if (!userRes.ok) throw new Error(`Cannot read current user: ${userRes.status}`);
  const userXml = await userRes.text();
  const hasDelete = userXml.includes("<s:item>delete_by_keyword</s:item>");
  if (hasDelete) {
    console.log("User already has delete_by_keyword capability.");
    return;
  }

  // 2. Create a helper role that imports admin + can_delete.
  const roleName = "zeroq_admin";
  const roleRes = await splunkFetch(`${BASE_URL}/servicesNS/nobody/system/authorization/roles`, {
    method: "POST",
    body: new URLSearchParams({ name: roleName, imported_roles: "admin", "imported_roles": "can_delete", defaultApp: "search" }),
  });
  if (!roleRes.ok && roleRes.status !== 409) {
    const text = await roleRes.text().catch(() => "");
    throw new Error(`Failed to create ${roleName} role: ${roleRes.status} ${text.slice(0, 200)}`);
  }
  if (roleRes.ok) console.log(`Created helper role '${roleName}' (imports admin + can_delete).`);

  // 3. Assign the helper role to the current user (keep existing roles).
  const existingRoles = [...userXml.matchAll(/<s:item>([^<]+)<\/s:item>/g)]
    .filter((m) => userXml.slice(0, m.index).includes('<s:key name="roles">'))
    .map((m) => m[1]);
  const roles = Array.from(new Set([...existingRoles, roleName]));
  const params = new URLSearchParams();
  for (const r of roles) params.append("roles", r);
  const assignRes = await splunkFetch(`${BASE_URL}/servicesNS/nobody/system/authentication/users/${encodeURIComponent(USERNAME)}`, {
    method: "POST",
    body: params,
  });
  if (!assignRes.ok) {
    const text = await assignRes.text().catch(() => "");
    throw new Error(`Failed to assign ${roleName} role: ${assignRes.status} ${text.slice(0, 200)}`);
  }
  console.log(`Assigned '${roleName}' role to ${USERNAME}.`);
}

async function runDelete(index) {
  const res = await splunkFetch(`${BASE_URL}/services/search/jobs`, {
    method: "POST",
    body: new URLSearchParams({
      search: `search index=${index} | delete`,
      earliest_time: "0",
      latest_time: "now",
      exec_mode: "blocking",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Splunk ${res.status}: ${text.slice(0, 200)}`);
  }
}

async function countEvents(index) {
  const res = await splunkFetch(`${BASE_URL}/services/search/jobs/export`, {
    method: "POST",
    body: new URLSearchParams({
      search: `| tstats count WHERE index=${index}`,
      earliest_time: "0",
      latest_time: "now",
      output_mode: "json",
    }),
  });
  if (!res.ok) return null;
  const text = await res.text();
  try {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const obj = JSON.parse(lines[lines.length - 1]);
    const count = obj.result?.count ?? obj.count ?? obj.results?.[0]?.count;
    return count !== undefined ? parseInt(count, 10) : null;
  } catch {
    const m = text.match(/"count"[:\s]+"?(\d+)"?/);
    return m ? parseInt(m[1], 10) : null;
  }
}

(async () => {
  console.log(`Connecting to Splunk: ${BASE_URL} as ${USERNAME}`);
  await ensureDeleteCapability();

  for (const index of INDEXES) {
    try {
      await runDelete(index);
      const count = await countEvents(index);
      if (count === 0) {
        console.log(`✓ Purged index=${index} (0 events remaining)`);
      } else if (count !== null) {
        console.warn(`⚠ index=${index} still has ${count} events (delete may require a restart or clean eventdata)`);
      } else {
        console.log(`✓ Purged index=${index} (could not verify count)`);
      }
    } catch (e) {
      console.error(`✗ Failed to purge index=${index}: ${e.message}`);
    }
  }

  console.log("\nDone. Events were soft-deleted; to reclaim disk space, run 'clean eventdata' on each index from Splunk UI or CLI.");
})();
