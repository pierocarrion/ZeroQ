// ============================================================
// providers/GitLabProvider.ts
// ============================================================
import { config } from "../config";
import { SCANNABLE } from "../rules";
import type { LoadedRepository, SourceFile, Target } from "../types";
import { SourceProvider, ProviderError } from "./SourceProvider";

export class GitLabProvider implements SourceProvider {
  readonly kind = "gitlab" as const;

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "User-Agent": "crypto-agility-monitor" };
    if (config.gitlab.token) h["PRIVATE-TOKEN"] = config.gitlab.token;
    return h;
  }

  async loadRepository(target: Target, maxFiles: number): Promise<LoadedRepository> {
    const api = config.gitlab.api;
    const pid = encodeURIComponent(target.path ?? "");
    const meta = await fetch(`${api}/projects/${pid}`, { headers: this.headers(), cache: "no-store" });
    if (meta.status === 404) throw new ProviderError("Project not found (must be public, or set GITLAB_TOKEN).");
    if (!meta.ok) throw new ProviderError("GitLab API error " + meta.status);
    const m = await meta.json();
    const branch: string = m.default_branch || "main";

    const blobs: any[] = [];
    for (let page = 1; page <= 5; page++) {
      const tr = await fetch(`${api}/projects/${pid}/repository/tree?recursive=true&ref=${branch}&per_page=100&page=${page}`, { headers: this.headers(), cache: "no-store" });
      if (!tr.ok) break;
      const batch = await tr.json();
      if (!Array.isArray(batch) || batch.length === 0) break;
      for (const n of batch) if (n.type === "blob" && SCANNABLE.test(n.path)) blobs.push(n);
      if (batch.length < 100) break;
    }
    const picked = blobs.slice(0, maxFiles);
    const files = await this.fetchFiles(pid, branch, picked.map((b: any) => b.path));
    return { meta: { fullName: target.path ?? "", provider: "gitlab", branch, language: "—" }, files, totalScannable: blobs.length };
  }

  private async fetchFiles(pid: string, branch: string, paths: string[]): Promise<SourceFile[]> {
    const files: SourceFile[] = [];
    const BATCH = 10;
    for (let i = 0; i < paths.length; i += BATCH) {
      const slice = paths.slice(i, i + BATCH);
      const results = await Promise.all(slice.map(async (path) => {
        try {
          const fp = encodeURIComponent(path);
          const raw = await fetch(`${config.gitlab.api}/projects/${pid}/repository/files/${fp}/raw?ref=${branch}`, { headers: this.headers(), cache: "no-store" });
          return raw.ok ? { path, content: await raw.text() } : null;
        } catch { return null; }
      }));
      for (const r of results) if (r) files.push(r);
    }
    return files;
  }
}
