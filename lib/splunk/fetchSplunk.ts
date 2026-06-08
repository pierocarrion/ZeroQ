import https from "https";
import nodeFetch from "node-fetch";
import { config } from "../config";

const insecureAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Fetch wrapper for Splunk endpoints.
 * Uses node-fetch (which respects the `agent` option) so that
 * SPLUNK_SKIP_TLS_VERIFY=true works reliably across all Node versions.
 *
 * @param forceSkipTlsVerify - override config (used by onboarding test before env is saved)
 */
export function splunkFetch(
  url: string,
  init?: nodeFetch.RequestInit,
  forceSkipTlsVerify?: boolean
) {
  const agent = (forceSkipTlsVerify || config.splunk.skipTlsVerify) ? insecureAgent : undefined;
  return nodeFetch(url, { ...init, agent });
}
