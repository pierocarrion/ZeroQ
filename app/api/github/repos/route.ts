import { NextRequest, NextResponse } from "next/server";
import { GitHubProvider } from "@/lib/providers/GitHubProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/github/repos?org=facebook
// Lists public repos of an organization (no token required)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const org = searchParams.get("org");
  if (!org) {
    return NextResponse.json({ data: null, error: "Missing org parameter" }, { status: 400 });
  }
  try {
    const provider = new GitHubProvider();
    const repos = await provider.listRepos(org);
    return NextResponse.json({ data: repos, source: "github" });
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e?.message || "Failed to list repos" }, { status: 400 });
  }
}
