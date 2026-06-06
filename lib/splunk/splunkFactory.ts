// ============================================================
// splunk/splunkFactory.ts — composition root for Splunk clients.
// ============================================================
import { config } from "../config";
import { SplunkClient, NoopSplunkClient } from "./SplunkClient";
import { HecSplunkClient } from "./HecSplunkClient";

export function createSplunkClient(): SplunkClient {
  return config.splunk.hecEnabled || config.splunk.searchEnabled
    ? new HecSplunkClient()
    : new NoopSplunkClient();
}
