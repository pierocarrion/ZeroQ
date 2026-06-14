// ============================================================
// splunk/splunkFactory.ts — composition root for Splunk clients.
// ============================================================
import { config } from "../config";
import { SplunkClient } from "./SplunkClient";
import { HecSplunkClient } from "./HecSplunkClient";
import { LocalDataClient } from "../services/LocalDataClient";

export function createSplunkClient(): SplunkClient {
  return config.splunk.hecEnabled || config.splunk.searchEnabled
    ? new HecSplunkClient()
    : new LocalDataClient();
}
