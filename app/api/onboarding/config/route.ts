import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db/settings";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSelectedRepos(): string[] {
  const rows = getDb().prepare("SELECT repo FROM selected_repos ORDER BY repo").all() as { repo: string }[];
  return rows.map((r) => r.repo).filter(Boolean);
}

function setSelectedRepos(repos: string[]) {
  const db = getDb();
  db.prepare("DELETE FROM selected_repos").run();
  const insert = db.prepare("INSERT INTO selected_repos (repo) VALUES (?)");
  for (const repo of repos) {
    const trimmed = String(repo ?? "").trim();
    if (trimmed) insert.run(trimmed);
  }
}

function pick(body: Record<string, any>, existingKey: string, bodyValue?: any, fallback?: string): string {
  if (bodyValue !== undefined) return String(bodyValue ?? "");
  try {
    const existing = getSetting(existingKey);
    if (existing !== undefined) return existing;
  } catch {}
  return fallback ?? "";
}

// GET /api/onboarding/config
// Returns current values from the local SQLite database.
export async function GET() {
  return NextResponse.json({
    ok: true,
    githubOrg: getSetting("GITHUB_ORG") ?? "",
    selectedRepos: getSelectedRepos(),
    splunkHecUrl: getSetting("SPLUNK_HEC_URL") ?? "",
    splunkHecToken: getSetting("SPLUNK_HEC_TOKEN") ?? "",
    splunkBaseUrl: getSetting("SPLUNK_BASE_URL") ?? "",
    splunkUsername: getSetting("SPLUNK_USERNAME") ?? "",
    splunkPassword: getSetting("SPLUNK_PASSWORD") ?? "",
    splunkSkipTlsVerify: getSetting("SPLUNK_SKIP_TLS_VERIFY") ?? "",
    deepseekApiKey: getSetting("DEEPSEEK_API_KEY") ?? "",
    aiProvider: getSetting("AI_PROVIDER") ?? "deepseek",
  });
}

// POST /api/onboarding/config
// Persists configuration into the local SQLite database.
export async function POST(req: NextRequest) {
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
  console.log("[api/onboarding/config] POST body keys:", Object.keys(body));

  if (Array.isArray(body.selectedRepos)) {
    setSelectedRepos(body.selectedRepos);
  }

  const save = (key: string, value?: any, fallback?: string) => {
    setSetting(key, pick(body, key, value, fallback));
  };

  save("DEEPSEEK_API_KEY", body.deepseekApiKey);
  save("DEEPSEEK_MODEL", body.deepseekModel, "deepseek-chat");
  save("AI_PROVIDER", body.aiProvider, "deepseek");
  save("GITHUB_ORG", body.githubOrg);
  save("GITHUB_TOKEN", body.githubToken);
  save("GITLAB_TOKEN", body.gitlabToken);
  save("SPLUNK_HEC_URL", body.splunkHecUrl);
  save("SPLUNK_HEC_TOKEN", body.splunkHecToken);
  save("SPLUNK_INDEX_SOURCE", body.splunkIndexSource, "crypto_source");
  save("SPLUNK_BASE_URL", body.splunkBaseUrl);
  save("SPLUNK_USERNAME", body.splunkUsername);
  save("SPLUNK_PASSWORD", body.splunkPassword);
  save("SPLUNK_SKIP_TLS_VERIFY", body.splunkSkipTlsVerify);
  save("SPLUNK_INDEX_NET", body.splunkIndexNet, "crypto_net");
  save("SPLUNK_INDEX_PKI", body.splunkIndexPki, "crypto_pki");
  save("SPLUNK_INDEX_HNDL", body.splunkIndexHndl, "crypto_hndl");
  save("SPLUNK_INDEX_PLAN", body.splunkIndexPlan, "crypto_plan");
  save("SCAN_MAX_FILES", body.scanMaxFiles, "80");

  return NextResponse.json({ ok: true, message: "Configuration saved." });
}
