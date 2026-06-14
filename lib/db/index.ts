// ============================================================
// lib/db/index.ts — SQLite local connection, schema & helpers.
// Stores only real data: config, repo scans, TLS scans, certs.
// ============================================================
import Database from "better-sqlite3";
import { resolve } from "path";
import { mkdirSync } from "fs";

const DATA_DIR = resolve(process.cwd(), "data");
const DB_PATH = resolve(DATA_DIR, "zeroq.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  try {
    mkdirSync(DATA_DIR, { recursive: true });
  } catch { /* ignore */ }
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  ensureSchema();
  return db;
}

function ensureSchema() {
  const d = getDb();
  d.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS selected_repos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo TEXT UNIQUE NOT NULL
    );

    -- Real repository scan results
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target TEXT NOT NULL,
      provider TEXT,
      lang TEXT,
      branch TEXT,
      loc TEXT,
      owner TEXT,
      grade TEXT,
      findings INTEGER,
      critical INTEGER,
      high INTEGER,
      monitor INTEGER,
      scanned INTEGER,
      file_count INTEGER,
      risk INTEGER,
      detail_json TEXT,
      files_json TEXT,
      last_commit TEXT,
      real INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Domains / IPs owned by the user to scan
    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host TEXT UNIQUE NOT NULL,
      port INTEGER DEFAULT 443,
      sensitivity TEXT,
      txns_day TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Real TLS scan results per host
    CREATE TABLE IF NOT EXISTS tls_scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host TEXT NOT NULL,
      port INTEGER,
      src TEXT,
      dst TEXT,
      version TEXT,
      cipher TEXT,
      curve TEXT,
      risk TEXT,
      hosts INTEGER DEFAULT 1,
      seen TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Real certificate scan results
    CREATE TABLE IF NOT EXISTS cert_scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host TEXT NOT NULL,
      subject TEXT,
      alg TEXT,
      bits INTEGER,
      expiry INTEGER,
      issuer TEXT,
      urgency TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- HNDL (Harvest-Now-Decrypt-Later) anomaly events
    CREATE TABLE IF NOT EXISTS hndl_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dst TEXT NOT NULL,
      asn TEXT,
      geo TEXT,
      volume TEXT,
      baseline TEXT,
      deviation REAL,
      sessions INTEGER,
      window TEXT,
      status TEXT,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function resetDbConnection() {
  if (db) {
    try { db.close(); } catch {}
    db = null;
  }
}
