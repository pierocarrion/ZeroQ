// ============================================================
// lib/db/settings.ts — CRUD for the settings key-value table.
// ============================================================
import { getDb } from "./index";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

export function getSetting(key: string): string | undefined {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string) {
  getDb().prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value ?? "";
  return out;
}

export function migrateEnvLocalOnce() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  let text: string;
  try {
    text = readFileSync(envPath, "utf8");
  } catch {
    return;
  }

  const existing = getAllSettings();
  const insert = getDb().prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    // .env.local only fills gaps; SQLite settings / app defaults take precedence.
    if (key && !(key in existing)) insert.run(key, value);
  }
}

export function deleteSetting(key: string) {
  getDb().prepare("DELETE FROM settings WHERE key = ?").run(key);
}
