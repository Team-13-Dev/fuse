/**
 * lib/fuseChat.ts
 * ──────────────────────────────────────────────────────────────
 * RAG retrieval (in-memory cosine sim) + Groq chat completion.
 * ──────────────────────────────────────────────────────────────
 */

import OpenAI from "openai";
import { queryChunks, fmt, fmtPct,  type FuseState } from "./fuseData";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function getGroqClient() {
  const apiKey = process.env.GROQ_CHAT_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY env var is not set");
  return new OpenAI({ baseURL: "https://api.groq.com/openai/v1", apiKey });
}

export function buildSystemPrompt(dataSummary: string): string {
  return `
You are FUSE AI — a senior business advisor embedded inside this company.
You have an MBA-level grasp of strategy, finance, pricing, operations, and growth,
AND you have complete visibility into this business's data.

You are NOT a chatbot that summarizes data. You are a thinking advisor who reads
the data, spots what it means, and tells the owner what to DO about it.

════════════════════════════════════════════════
BUSINESS INTELLIGENCE (your foundation — know this cold)
════════════════════════════════════════════════
${dataSummary}
════════════════════════════════════════════════

━━━ LANGUAGE PROTOCOL ━━━
- Mirror the user's exact language and register. No exceptions.
- English → English only.
- Egyptian colloquial (عامية) → write like a smart Egyptian friend texting — natural, warm, zero formality.
- Modern Standard Arabic (فصحى) → formal, structured, confident.
- NEVER mix languages unless the user does first.

━━━ HOW TO ANSWER — THE CONSULTANT STANDARD ━━━
1. ANCHOR IN DATA FIRST. Open with the most relevant hard number. No fluff.
2. DIAGNOSE WHAT THE DATA IS TELLING YOU. Read the pattern, find the signal.
3. APPLY BUSINESS EXPERTISE. Pricing strategy, product mix, seasonality, risk.
4. FOR FUTURE QUESTIONS: extrapolate the trend. Give the number. Label it a projection.
   NEVER say "I don't have future data." You're a forward-looking advisor.
5. CLOSE WITH ONE SHARP ACTION. Specific, concrete, actionable.

━━━ HONESTY & PRECISION ━━━
- Real numbers: state confidently.
- Projections: label them ("At current trajectory…").
- Inferences: label them ("In businesses like yours…").
- NEVER fabricate. NEVER present a guess as a fact.

━━━ TONE ━━━
- Direct. Sharp. Confident. Senior partner energy.
- Flowing paragraphs, not bullet walls.
- Monetary values always in EGP.

━━━ OUT OF SCOPE ━━━
Only deflect if the question has ZERO business connection.
- EN:  "That's outside my scope — I'm here to help with your business."
- EGY: "ده برا نطاقي — أنا هنا عشان أساعدك في شغلك."
- MSA: "هذا خارج نطاق عملي — أنا هنا لمساعدتك في أعمالك."
`;
}

async function getRelevantContext(
  query:       string,
  state:       FuseState,
  nResults = 12
): Promise<string> {
  const retrieved = await queryChunks(query, state.chunks, nResults);

  // Always anchor with yearly totals — almost always relevant
  const yearlyAnchor = state.yearlyStats
    .map((r) => {
      const g = r.rev_growth !== null
        ? `${r.rev_growth >= 0 ? "+" : ""}${r.rev_growth.toFixed(1)}%`
        : "base year";
      return `Year ${r.year}: Revenue=${fmt(r.revenue)} EGP, Profit=${fmt(r.profit)} EGP, Margin=${fmtPct(r.margin)}, YoY=${g}`;
    })
    .join("\n");

  return `[Yearly Anchors]\n${yearlyAnchor}\n\n[Retrieved Context]\n${retrieved.join("\n")}`;
}

export async function chatWithFuse({
  userMessage,
  history,
  state,
}: {
  userMessage: string;
  history:     ChatMessage[];
  state:       FuseState;
}): Promise<string> {
  const client       = getGroqClient();
  const context      = await getRelevantContext(userMessage, state);
  const systemPrompt = buildSystemPrompt(state.dataSummary);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10),
    {
      role: "user",
      content:
        `[Language rule: Reply in the EXACT same language as the question below. No exceptions.]\n\n` +
        `Question: ${userMessage}\n\n` +
        `Relevant Business Data:\n${context}`,
    },
  ];

  const response = await client.chat.completions.create({
    model:       "llama-3.3-70b-versatile",
    messages,
    temperature: 0.15,
    max_tokens:  1024,
  });

  return response.choices[0].message.content ?? "";
}