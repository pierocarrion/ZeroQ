import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/onboarding/test-github { token }
export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
  const token = body.token;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "crypto-agility-monitor" },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ ok: false, error: `GitHub API ${res.status}: ${text}` }, { status: 400 });
    }
    const user = await res.json();
    return NextResponse.json({ ok: true, login: user.login });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Network error" }, { status: 500 });
  }
}
