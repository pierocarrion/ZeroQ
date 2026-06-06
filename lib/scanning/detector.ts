// ============================================================
// scanning/detector.ts — turns source text into findings.
// Single responsibility: apply rules to lines.
// ============================================================
import { ALL_RULES } from "../rules";
import type { Finding } from "../types";

const MAX_LINE = 400; // skip minified / generated lines

/** Scan one text blob and return all rule matches as findings. */
export function detect(repo: string, path: string, text: string): Finding[] {
  const out: Finding[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > MAX_LINE) continue;
    for (const rule of ALL_RULES) {
      if (rule.pattern.test(line)) {
        out.push({
          repo, file: path, line: i + 1,
          kind: rule.kind, sev: rule.severity,
          code: line.trim().slice(0, 180), fix: rule.fix, rule: rule.id,
        });
      }
    }
  }
  return out;
}
