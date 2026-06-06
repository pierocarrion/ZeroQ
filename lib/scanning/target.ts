// ============================================================
// scanning/target.ts — parse user input into a scan target.
// ============================================================
import type { Target } from "../types";

/**
 * Accepts: owner/repo (GitHub), group/sub/project (GitLab),
 * gitlab:group/project, or a full github.com / gitlab.com URL.
 */
export function parseTarget(input: string): Target | null {
  const s = input.trim().replace(/\.git$/, "");
  if (!s) return null;

  const gh = s.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (gh) return { provider: "github", owner: gh[1], repo: gh[2] };

  const gl = s.match(/gitlab\.com\/(.+)$/i);
  if (gl) return { provider: "gitlab", path: gl[1] };

  if (/^gitlab:/i.test(s)) return { provider: "gitlab", path: s.replace(/^gitlab:/i, "") };

  const short = s.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (short) return { provider: "github", owner: short[1], repo: short[2] };

  if (s.split("/").length >= 3) return { provider: "gitlab", path: s };

  return null;
}
