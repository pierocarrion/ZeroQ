// ============================================================
// config.ts — single source of truth for environment access.
// Values are read from the local SQLite database first, with
// process.env as a fallback. This allows runtime config changes
// without restarting the dev server.
// ============================================================
import { getSetting } from "./db/settings";

function env(key: string): string | undefined {
  const v = process.env[key];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

function setting(key: string): string | undefined {
  try {
    return getSetting(key);
  } catch {
    return undefined;
  }
}


function str(key: string): string | undefined {
  return setting(key) ?? env(key);
}

function bool(key: string): boolean {
  const v = str(key);
  return v === "true" || v === "1";
}

export const config = {
  ai: {
    apiKey: str("DEEPSEEK_API_KEY"),
    model: str("DEEPSEEK_MODEL") ?? "deepseek-chat",
    provider: str("AI_PROVIDER") ?? (str("DEEPSEEK_API_KEY") ? "deepseek" : "local"),
    get enabled() { return !!this.apiKey; },
  },
  github: {
    org: str("GITHUB_ORG"),
    token: str("GITHUB_TOKEN"),
    api: str("GITHUB_API") ?? "https://api.github.com",
  },
  gitlab: {
    token: str("GITLAB_TOKEN"),
    api: str("GITLAB_API") ?? "https://gitlab.com/api/v4",
  },
  splunk: {
    hecUrl: str("SPLUNK_HEC_URL"),
    hecToken: str("SPLUNK_HEC_TOKEN"),
    indexSource: str("SPLUNK_INDEX_SOURCE") ?? "crypto_source",
    baseUrl: str("SPLUNK_BASE_URL"),
    username: str("SPLUNK_USERNAME"),
    password: str("SPLUNK_PASSWORD"),
    skipTlsVerify: bool("SPLUNK_SKIP_TLS_VERIFY"),
    indexes: {
      net: str("SPLUNK_INDEX_NET") ?? "crypto_net",
      pki: str("SPLUNK_INDEX_PKI") ?? "crypto_pki",
      hndl: str("SPLUNK_INDEX_HNDL") ?? "crypto_hndl",
      plan: str("SPLUNK_INDEX_PLAN") ?? "crypto_plan",
    },
    get hecEnabled() { return !!(this.hecUrl && this.hecToken); },
    get searchEnabled() { return !!(this.baseUrl && this.username && this.password); },
    get enabled() { return this.hecEnabled || this.searchEnabled; },
  },
  scan: {
    maxFiles: Number(str("SCAN_MAX_FILES") ?? 80),
  },
} as const;

export type Capabilities = {
  ai: boolean;
  splunk: boolean;
  github: boolean;
  gitlab: boolean;
};

export function capabilities(): Capabilities {
  return {
    ai: config.ai.enabled,
    splunk: config.splunk.enabled,
    github: !!config.github.token,
    gitlab: !!config.gitlab.token,
  };
}

// Log sanitized config at load time to aid debugging (skip during static build).
if (typeof window !== "undefined" || process.env.NEXT_PHASE !== "phase-production-build") {
  console.log("[config] loaded", {
    ai: { enabled: config.ai.enabled, provider: config.ai.provider, model: config.ai.model },
    github: { org: config.github.org, hasToken: !!config.github.token },
    gitlab: { hasToken: !!config.gitlab.token },
    splunk: {
      enabled: config.splunk.enabled,
      hecEnabled: config.splunk.hecEnabled,
      searchEnabled: config.splunk.searchEnabled,
      baseUrl: config.splunk.baseUrl,
      hecUrl: config.splunk.hecUrl,
      hasPassword: !!config.splunk.password,
      skipTlsVerify: config.splunk.skipTlsVerify,
      indexes: config.splunk.indexes,
    },
    scan: config.scan,
  });
}
