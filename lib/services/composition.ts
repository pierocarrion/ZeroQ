// ============================================================
// services/composition.ts — composition root. The only place
// that wires concrete implementations to the service classes.
// Route handlers depend on these factories, not on concretions.
// ============================================================
import { config } from "../config";
import { createAIProvider } from "../ai/aiFactory";
import { createSplunkClient } from "../splunk/splunkFactory";
import { LocalDataClient } from "./LocalDataClient";
import { ScanService } from "./ScanService";
import { AssistantService } from "./AssistantService";
import { PlanService } from "./PlanService";

export function makeScanService(): ScanService {
  return new ScanService(createSplunkClient(), new LocalDataClient(), config.scan.maxFiles);
}

export function makeAssistantService(): AssistantService {
  return new AssistantService(createAIProvider(), createSplunkClient(), new LocalDataClient());
}

export function makePlanService(): PlanService {
  return new PlanService(createAIProvider(), createSplunkClient(), new LocalDataClient());
}
