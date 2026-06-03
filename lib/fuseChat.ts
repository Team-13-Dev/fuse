/**
 * lib/fuseChat.ts
 * ──────────────────────────────────────────────────────────────
 * RAG retrieval + Groq chat completion.
 * Stateless: conversation history is passed in by the caller.
 * ──────────────────────────────────────────────────────────────
 */

import OpenAI from "openai";
import { Collection } from "chromadb";
import type { YearlyStats } from "./fuseData"; // re-export type from fuseData if needed

// Re-export the interface so callers can import it from here
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Groq client (OpenAI-compatible) ───────────────────────────

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY env var is not set");
  return new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey,
  });
}

// ── System prompt factory ──────────────────────────────────────

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
- Egyptian colloquial (عامية) → write like a smart Egyptian friend texting — natural, warm, zero formality. Think IN the dialect.
- Modern Standard Arabic (فصحى) → formal, structured, confident.
- NEVER mix languages unless the user does first.

━━━ HOW TO ANSWER — THE CONSULTANT STANDARD ━━━

1. ANCHOR IN DATA FIRST.
   Open with the most relevant hard number from the data. No fluff opener.
   Example: "Your revenue grew 34% from 2023 to 2024 — the business has real momentum."

2. DIAGNOSE WHAT THE DATA IS TELLING YOU.
   Don't just state figures. Read them. What's the pattern? What's the signal?
   Example: P007 leads revenue but lags on margin — that tells you something about pricing power.

3. APPLY BUSINESS EXPERTISE.
   Layer in the "so what" — pricing strategy, product mix, seasonality plays, customer concentration risk, etc.
   Speak with authority. You've advised businesses before. This isn't your first rodeo.

4. FOR FUTURE QUESTIONS (2027, next year, etc.):
   You MUST extrapolate from the trend. Calculate or estimate the trajectory.
   If revenue grew 20% YoY on average → project that forward. Say so explicitly.
   Give the number. Then say what they need to do to hit it or beat it.
   NEVER say "I don't have 2027 data." You're a forward-looking advisor.

5. CLOSE WITH ONE SHARP ACTION.
   One concrete, specific next step. Not "improve marketing."
   Something like: "Double down on P007's volume in Q3 — that's your highest-revenue window."

━━━ HONESTY & PRECISION RULES ━━━
- Real numbers from the data: state them confidently.
- Projections: label them as projections ("At current trajectory...", "If growth holds at X%...").
- Inferences from business logic: label them ("In businesses like yours, this typically means...").
- NEVER fabricate a figure. NEVER present a guess as a fact.
- If the data has a gap, say so briefly — then advise anyway.

━━━ TONE ━━━
- Direct. Sharp. Confident. Like a senior partner, not an intern summarizing a spreadsheet.
- No walls of bullets. Flowing, punchy paragraphs.
- Monetary values always in EGP.
- Conversational length: enough to actually help, not padded.

━━━ OUT OF SCOPE ━━━
Only deflect if the question has ZERO business connection (weather, recipes, personal life).
- EN:  "That's outside my scope — I'm here to help with your business."
- EGY: "ده برا نطاقي — أنا هنا عشان أساعدك في شغلك."
- MSA: "هذا خارج نطاق عملي — أنا هنا لمساعدتك في أعمالك."
Everything else — engage.
`;
}

// ── RAG retrieval ──────────────────────────────────────────────

export interface YearlyAnchor {
  year: number;
  revenue: number;
  profit: number;
  margin: number;
  rev_growth: number | null;
}

export async function getRelevantContext(
  query: string,
  collection: Collection,
  yearlyStats: YearlyAnchor[],
  nResults = 12
): Promise<string> {
  const results = await collection.query({
    queryTexts: [query],
    nResults,
  });

  const retrieved = (results.documents[0] ?? []).join("\n");

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  const yearlyAnchor = yearlyStats
    .map((r) => {
      const growth =
        r.rev_growth !== null
          ? `${r.rev_growth >= 0 ? "+" : ""}${r.rev_growth.toFixed(1)}%`
          : "base year";
      return (
        `Year ${r.year}: Revenue=${fmt(r.revenue)} EGP, ` +
        `Profit=${fmt(r.profit)} EGP, Margin=${(r.margin * 100).toFixed(1)}%, ` +
        `YoY Rev Growth=${growth}`
      );
    })
    .join("\n");

  return `[Yearly Anchors]\n${yearlyAnchor}\n\n[Retrieved Context]\n${retrieved}`;
}

// ── Main chat function ─────────────────────────────────────────

export async function chatWithFuse({
  userMessage,
  history,
  collection,
  yearlyStats,
  dataSummary,
}: {
  userMessage: string;
  history: ChatMessage[];
  collection: Collection;
  yearlyStats: YearlyAnchor[];
  dataSummary: string;
}): Promise<string> {
  const client = getGroqClient();
  const context = await getRelevantContext(userMessage, collection, yearlyStats);
  const systemPrompt = buildSystemPrompt(dataSummary);

  // Keep last 10 turns for context window
  const recentHistory = history.slice(-10);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...recentHistory,
    {
      role: "user",
      content:
        `[Language rule: Reply in the EXACT same language as the question below. ` +
        `English → English. Arabic → Arabic. Dialect → same dialect. No exceptions.]\n\n` +
        `Question: ${userMessage}\n\n` +
        `Relevant Business Data:\n${context}`,
    },
  ];

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.15,
    max_tokens: 1024,
  });

  return response.choices[0].message.content ?? "";
}