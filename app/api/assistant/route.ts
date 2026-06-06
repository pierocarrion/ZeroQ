import { NextRequest, NextResponse } from "next/server";
import { makeAssistantService } from "@/lib/services/composition";
import type { AssistantMessage, ScanResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/assistant { messages: AssistantMessage[], scanned?: ScanResult[] }
export async function POST(req: NextRequest) {
  try {
    const { messages, scanned } = (await req.json()) as { messages?: AssistantMessage[]; scanned?: ScanResult[] };
    const history = Array.isArray(messages) ? messages : [];
    if (history.length === 0) {
      return NextResponse.json({ error: "No message provided." }, { status: 400 });
    }
    const reply = await makeAssistantService().ask(history, Array.isArray(scanned) ? scanned : []);
    return NextResponse.json(reply);
  } catch (e: any) {
    return NextResponse.json(
      { text: "The assistant is temporarily unavailable. Try again, or run a repo scan to ground the answer.", mode: "error", error: e?.message },
      { status: 200 },
    );
  }
}
