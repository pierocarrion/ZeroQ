// ============================================================
// config.ts — single source of truth for environment access.
// Nothing else in the codebase reads process.env directly.
// ============================================================

function str(key: string): string | undefined {
  const v = process.env[key];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export const config = {
  ai: {
    apiKey: str("ANTHROPIC_API_KEY"),
    model: str("ANTHROPIC_MODEL") ?? "claude-3-5-sonnet-20241022",
    provider: str("AI_PROVIDER") ?? "anthropic",
    get enabled() { return !!this.apiKey; },
  },
  github: {
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
