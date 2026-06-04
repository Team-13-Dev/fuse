import { NextRequest, NextResponse } from "next/server";
import { initFuse } from "@/lib/fuseData";
import { chatWithFuse, type ChatMessage } from "@/lib/fuseChat";
import { getBusinessContext } from "@/lib/get-business-context";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getBusinessContext(req);
    const body = await req.json();

    const businessId = ctx?.businessId;
    const userMessage: string = body.message?.trim();

    if (!businessId) return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    if (!userMessage) return NextResponse.json({ error: "message is required" },    { status: 400 });

    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];

    // initFuse is idempotent — instant on warm cache, full init on cold start
    const state = await initFuse(businessId);

    const reply = await chatWithFuse({ userMessage, history, state });

    const updatedHistory: ChatMessage[] = [
      ...history,
      { role: "user",      content: userMessage },
      { role: "assistant", content: reply       },
    ];

    return NextResponse.json({ reply, history: updatedHistory });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[FUSE /chat]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}