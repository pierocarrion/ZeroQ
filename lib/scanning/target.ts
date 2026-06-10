// ============================================================
// scanning/target.ts — parse user input into a scan target.
// ============================================================
import type { Target } from "../types";

export class TargetParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TargetParseError";
  }
}

/**
 * Accepts: owner/repo (GitHub) or a full github.com/owner/repo URL.
 */
export function parseTarget(input: string): Target {
  const s = input.trim().replace(/\.git$/, "");
  if (!s) {
    throw new TargetParseError("Enter a repository target.");
  }

  // Detect org-only URL like https://github.com/upc-is (missing repo name)
  const orgOnly = s.match(/^https?:\/\/github\.com\/([^/]+)\/?$/i);
  if (orgOnly) {
    throw new TargetParseError(
      `That URL is an organization/profile, not a repository. Try: github.com/${orgOnly[1]}/REPO-NAME`
    );
  }

  // Full URL: https://github.com/owner/repo
  const gh = s.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (gh) return { provider: "github", owner: gh[1], repo: gh[2] };

  // Short form: owner/repo
  const short = s.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (short) return { provider: "github", owner: short[1], repo: short[2] };

  throw new TargetParseError(
    'Invalid target. Use "owner/repo" or a full "github.com/owner/repo" URL.'
  );
}
