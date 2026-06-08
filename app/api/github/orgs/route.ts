import { NextRequest, NextResponse } from "next/server";
import { GitHubProvider } from "@/lib/providers/GitHubProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/github/orgs?org=facebook
// Validates that an org exists (no token required for public orgs)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const org = searchParams.get("org");
  if (!org) {
    return NextResponse.json({ data: null, error: "Missing org parameter" }, { status: 400 });
  }
  try {
    const provider = new GitHubProvider();
    const info = await provider.validateOrg(org);
    if (!info) {
      return NextResponse.json({ data: null, error: "Organization not found" }, { status: 404 });
    }
    return NextResponse.json({ data: [info], source: "github" });
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e?.message || "Failed to validate org" }, { status: 400 });
  }
}
