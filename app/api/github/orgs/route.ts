import { NextRequest, NextResponse } from "next/server";
import { GitHubProvider } from "@/lib/providers/GitHubProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/github/orgs?token=ghp_xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || undefined;
  try {
    const provider = new GitHubProvider();
    const orgs = await provider.listOrgs(token || undefined);
    return NextResponse.json({ data: orgs, source: "github" });
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e?.message || "Failed to list orgs" }, { status: 400 });
  }
}
