// ============================================================
// providers/GitHubProvider.ts
// ============================================================
import { config } from "../config";
import { SCANNABLE } from "../rules";
import type { LoadedRepository, SourceFile, Target } from "../types";
import { SourceProvider, ProviderError } from "./SourceProvider";

export class GitHubProvider implements SourceProvider {
  readonly kind = "github" as const;

  private headers(): Record<string, string> {
    const h: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "crypto-agility-monitor" };
    if (config.github.token) h.Authorization = `Bearer ${config.github.token}`;
    return h;
  }

  async loadRepository(target: Target, maxFiles: number): Promise<LoadedRepository> {
    const { owner, repo } = target;
    const api = config.github.api;
    const meta = await fetch(`${api}/repos/${owner}/${repo}`, { headers: this.headers(), cache: "no-store" });
    if (meta.status === 404) throw new ProviderError("Repository not found (must be public, or set GITHUB_TOKEN).");
    if (meta.status === 403) throw new ProviderError("GitHub rate limit hit. Set GITHUB_TOKEN in .env.local.");
    if (!meta.ok) throw new ProviderError("GitHub API error " + meta.status);
    const m = await meta.json();
    const branch: string = m.default_branch || "main";
    const language: string = m.language || "—";

    const treeRes = await fetch(`${api}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers: this.headers(), cache: "no-store" });
    if (!treeRes.ok) throw new ProviderError("Could not read repository tree (" + treeRes.status + ")");
    const tree = (await treeRes.json()).tree ?? [];
    const blobs = tree.filter((n: any) => n.type === "blob" && SCANNABLE.test(n.path));
    const picked = blobs.slice(0, maxFiles);

    const files = await this.fetchFiles(owner!, repo!, branch, picked.map((b: any) => b.path));
    return { meta: { fullName: `${owner}/${repo}`, provider: "github", branch, language }, files, totalScannable: blobs.length };
  }

  private async fetchFiles(owner: string, repo: string, branch: string, paths: string[]): Promise<SourceFile[]> {
    const files: SourceFile[] = [];
    const BATCH = 10;
    for (let i = 0; i < paths.length; i += BATCH) {
      const slice = paths.slice(i, i + BATCH);
      const results = await Promise.all(slice.map(async (path) => {
        try {
          const raw = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`, { headers: { "User-Agent": "crypto-agility-monitor" }, cache: "no-store" });
          return raw.ok ? { path, content: await raw.text() } : null;
        } catch { return null; }
      }));
      for (const r of results) if (r) files.push(r);
    }
    return files;
  }
}
