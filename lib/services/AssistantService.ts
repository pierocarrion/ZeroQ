// ============================================================
// services/AssistantService.ts — answers questions grounded on
// posture context. Delegates generation to an AIProvider.
// ============================================================
import type { AIProvider } from "../ai/AIProvider";
import { buildPostureContext } from "./PostureContext";
import type { AssistantMessage, ScanResult } from "../types";
import type { SplunkClient } from "../splunk/SplunkClient";

const SYSTEM = `You are the AI Assistant inside "ZeroQ", a Splunk security app for post-quantum cryptography readiness. Answer using ONLY the CONTEXT data provided. Be concise, technical and specific — reference exact hosts, repos, ciphers and numbers from the context. Prefer short paragraphs and bullet points. When recommending remediation, frame cost honestly as engineer-days of config/dependency work versus the millions in capital that quantum hardware costs. If a question needs data not present, say briefly what you'd query. Never invent hosts or numbers not in the context.`;

export interface AssistantReply {
  text: string;
  mode: "live" | "fallback";
}

export class AssistantService {
  constructor(
    private readonly ai: AIProvider,
    private readonly splunk: SplunkClient,
    private readonly localStore: SplunkClient,
  ) {}

  async ask(messages: AssistantMessage[], scanned: ScanResult[]): Promise<AssistantReply> {
    const context = await buildPostureContext(scanned, { splunk: this.splunk, localStore: this.localStore });
    const system = `${SYSTEM}\n\nCONTEXT:\n${context}`;
    const text = await this.ai.complete({ system, messages });
    return { text, mode: this.ai.live ? "live" : "fallback" };
  }
}
