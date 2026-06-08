import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/onboarding/test-github { org }
// Validates that a GitHub organization exists (no token required)
export async function POST(req: NextRequest) {
  let body: { org?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
  const org = body.org?.trim();
  if (!org) {
    return NextResponse.json({ ok: false, error: "Missing org name" }, { status: 400 });
  }
  try {
    const res = await fetch(`https://api.github.com/orgs/${encodeURIComponent(org)}`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "zeroq" },
      cache: "no-store",
    });
    if (res.status === 404) {
      return NextResponse.json({ ok: false, error: "Organization not found" }, { status: 404 });
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ ok: false, error: `GitHub API ${res.status}: ${text}` }, { status: 400 });
    }
    const data = await res.json();
    return NextResponse.json({ ok: true, login: data.login, publicRepos: data.public_repos });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Network error" }, { status: 500 });
  }
}
