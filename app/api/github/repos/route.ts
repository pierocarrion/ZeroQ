import { NextRequest, NextResponse } from "next/server";
import { GitHubProvider } from "@/lib/providers/GitHubProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/github/repos?org=owner&token=ghp_xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const org = searchParams.get("org");
  const token = searchParams.get("token") || undefined;
  if (!org) {
    return NextResponse.json({ data: null, error: "Missing org parameter" }, { status: 400 });
  }
  try {
    const provider = new GitHubProvider();
    const repos = await provider.listRepos(org, token || undefined);
    return NextResponse.json({ data: repos, source: "github" });
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e?.message || "Failed to list repos" }, { status: 400 });
  }
}
