// ============================================================
// services/ScanService.ts — orchestrates a repository scan:
// parse → provider (I/O) → detect → score. Depends on the
// SourceProvider + SplunkClient abstractions, not concretions.
//
// Every scan is always persisted to the local SQLite store so the
// dashboard can work offline and the SQLite DB remains the source
// of truth for local scans. Splunk ingestion is attempted in
// parallel when configured.
// ============================================================
import { parseTarget, TargetParseError } from "../scanning/target";
import { detect } from "../scanning/detector";
import { buildScanResult } from "../scanning/scoring";
import { createSourceProvider } from "../providers/sourceProviderFactory";
import type { SplunkClient } from "../splunk/SplunkClient";
import type { IngestResult, ScanResult } from "../types";

export class ScanService {
  constructor(
    private readonly splunk: SplunkClient,
    private readonly localStore: SplunkClient,
    private readonly maxFiles: number,
    private readonly providerFactory = createSourceProvider,
  ) {}

  async scan(rawTarget: string): Promise<{ result: ScanResult; splunk: IngestResult | null; local: IngestResult }> {
    const target = parseTarget(rawTarget);
    const provider = this.providerFactory(target.provider);
    const { meta, files, totalScannable } = await provider.loadRepository(target, this.maxFiles);
    const findings = files.flatMap((f) => detect(meta.fullName, f.path, f.content));
    const result = buildScanResult(meta, totalScannable, files.length, findings, files.map((f) => f.path));

    // Persist to local SQLite always; send to Splunk in parallel if configured.
    const [local, splunk] = await Promise.all([
      this.localStore.sendFindings(result),
      this.splunk.enabled ? this.splunk.sendFindings(result) : null,
    ]);

    return { result, splunk, local };
  }
}
