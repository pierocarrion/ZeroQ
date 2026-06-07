import { NextRequest, NextResponse } from "next/server";
import { makeScanService } from "@/lib/services/composition";
import { ProviderError } from "@/lib/providers/SourceProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/scan-batch { repos: ["owner/repo", ...] }
export async function POST(req: NextRequest) {
  let body: { repos?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const targets = Array.isArray(body.repos) ? body.repos.filter((r) => typeof r === "string" && r.includes("/")) : [];
  if (targets.length === 0) {
    return NextResponse.json({ error: "Provide at least one repo in repos[]" }, { status: 400 });
  }
  if (targets.length > 20) {
    return NextResponse.json({ error: "Max 20 repos per batch" }, { status: 400 });
  }

  const service = makeScanService();
  const results: any[] = [];
  const errors: any[] = [];

  for (const target of targets) {
    try {
      const data = await service.scan(target);
      results.push({ target, ...data });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Scan failed";
      errors.push({ target, error: message });
    }
  }

  return NextResponse.json({
    results,
    errors,
    summary: {
      total: targets.length,
      success: results.length,
      failed: errors.length,
      findings: results.reduce((s, r) => s + (r.result?.findings || 0), 0),
      critical: results.reduce((s, r) => s + (r.result?.critical || 0), 0),
    },
  });
}
