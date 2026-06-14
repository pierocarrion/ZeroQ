import { NextResponse } from "next/server";
import { getSetting } from "@/lib/db/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const hecUrl = getSetting("SPLUNK_HEC_URL");
  const hecToken = getSetting("SPLUNK_HEC_TOKEN");
  const baseUrl = getSetting("SPLUNK_BASE_URL");
  const username = getSetting("SPLUNK_USERNAME");
  const password = getSetting("SPLUNK_PASSWORD");

  return NextResponse.json({
    hecEnabled: !!(hecUrl && hecToken),
    searchEnabled: !!(baseUrl && username && password),
    hecUrl: hecUrl ?? null,
    baseUrl: baseUrl ?? null,
    username: username ?? null,
    password: password ? "***set***" : "***empty***",
    skipTlsVerify: getSetting("SPLUNK_SKIP_TLS_VERIFY") === "true",
  });
}
