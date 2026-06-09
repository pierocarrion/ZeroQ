import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    hecEnabled: config.splunk.hecEnabled,
    searchEnabled: config.splunk.searchEnabled,
    hecUrl: config.splunk.hecUrl,
    baseUrl: config.splunk.baseUrl,
    username: config.splunk.username,
    password: config.splunk.password ? "***set***" : "***empty***",
    skipTlsVerify: config.splunk.skipTlsVerify,
  });
}
