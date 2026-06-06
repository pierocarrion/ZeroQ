import { NextRequest, NextResponse } from "next/server";
import { createSplunkClient } from "@/lib/splunk/splunkFactory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_INDEXES = [
  "crypto_source",
  "crypto_net",
  "crypto_pki",
  "crypto_hndl",
  "crypto_plan",
];

function isQueryAllowed(q: string): boolean {
  const lower = q.toLowerCase();
  // Reject any query trying to write, delete, or access unexpected indexes.
  if (/\b(output|input|delete|update|join|lookup\s+output)/.test(lower)) return false;
  const hasAllowed = ALLOWED_INDEXES.some((idx) => lower.includes(`index=${idx}`));
  return hasAllowed;
}

// POST /api/splunk/query { query: string }
export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query?: string };
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Provide a query." }, { status: 400 });
    }
    if (!isQueryAllowed(query)) {
      return NextResponse.json({ error: "Query not allowed." }, { status: 403 });
    }
    const client = createSplunkClient();
    if (!client.enabled) {
      return NextResponse.json({ error: "Splunk not configured." }, { status: 503 });
    }
    const result = await client.query(query, 100);
    return NextResponse.json({ result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Query failed" }, { status: 500 });
  }
}
