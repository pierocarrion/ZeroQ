// ============================================================
// services/ScanService.ts — orchestrates a repository scan:
// parse → provider (I/O) → detect → score. Depends on the
// SourceProvider + SplunkClient abstractions, not concretions.
// ============================================================
import { parseTarget } from "../scanning/target";
import { detect } from "../scanning/detector";
import { buildScanResult } from "../scanning/scoring";
import { createSourceProvider } from "../providers/sourceProviderFactory";
import type { SplunkClient } from "../splunk/SplunkClient";
import type { IngestResult, ScanResult } from "../types";

export class ScanService {
  constructor(
    private readonly splunk: SplunkClient,
    private readonly maxFiles: number,
    private readonly providerFactory = createSourceProvider,
  ) {}

  async scan(rawTarget: string): Promise<{ result: ScanResult; splunk: IngestResult | null }> {
    const target = parseTarget(rawTarget);
    if (!target) {
      throw new Error("Enter owner/repo (GitHub), group/project (GitLab), or a full URL.");
    }
    const provider = this.providerFactory(target.provider);
    const { meta, files, totalScannable } = await provider.loadRepository(target, this.maxFiles);
    const findings = files.flatMap((f) => detect(meta.fullName, f.path, f.content));
    const result = buildScanResult(meta, totalScannable, files.length, findings, files.map((f) => f.path));
    const splunk = this.splunk.enabled ? await this.splunk.sendFindings(result) : null;
    return { result, splunk };
  }
}
