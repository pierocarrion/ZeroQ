import { NextResponse } from "next/server";
import { getSetting } from "@/lib/db/settings";
import { GitHubProvider } from "@/lib/providers/GitHubProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/github/org-repos
// Returns all repos for the GitHub organization stored in settings.
export async function GET() {
  const org = getSetting("GITHUB_ORG")?.trim();
  if (!org) {
    return NextResponse.json({ data: null, error: "No GitHub organization configured", source: null });
  }
  try {
    const provider = new GitHubProvider();
    const repos = await provider.listRepos(org);
    return NextResponse.json({ data: repos, source: "github" });
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e?.message || "Failed to list repos", source: null });
  }
}
