// lib/llm.ts
// Direct port of the Python _call_llm function

export interface Recommendation {
  priority: number;
  priority_level: "high" | "medium" | "low";
  title: string;
  insight: string;
  action: string;
  impact: string;
}

export interface CombinedContext {
  customer_segmentation: unknown;
  product_segmentation: unknown;
  sales_forecast: unknown;
}

const PROMPT_MASTER = `
You are a business advisor for a busy shop owner. You will receive data from three sources: customer segments, product groups, and sales forecasts.

Your task: Return exactly 8 recommendations as a valid JSON array — nothing else, no preamble, no markdown.

RULES:
- Each recommendation must reference data from at least 2 of the 3 sources
- Priorities: exactly 2 high, 3 medium, 3 low — no exceptions
- Sort by priority level: high first, then medium, then low
- Within each priority level, sort by impact value descending
- Never suggest analyzing data, improving models, or running reports — only concrete actions the owner can take themselves

FIELD RULES:
- title: 3–5 words, action-oriented (e.g. "Win Back At-Risk Customers")
- insight: 1 sentence, states what the data shows + includes exactly 1 specific number
- action: 1 sentence, starts with a verb, describes a single concrete step (e.g. "Send a 15% discount coupon to all lapsed VIP customers this week")
- impact: a label + dollar figure or percentage (e.g. "Recover up to $308K" or "Grow revenue by 12%")
- priority_level: exactly one of "high", "medium", or "low"
- priority: integer 1–8, unique, sequential

OUTPUT FORMAT:
[
  {
    "priority": 1,
    "priority_level": "high",
    "title": "...",
    "insight": "...",
    "action": "...",
    "impact": "..."
  }
]
`.trim();

export async function callLLM(context: CombinedContext): Promise<Recommendation[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set in environment variables");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: PROMPT_MASTER },
        {
          role: "user",
          content: `Analyze this data and return recommendations:\n\n${JSON.stringify(context, null, 2)}`,
        },
      ],
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  let raw: string = data.choices[0].message.content.trim();

  // Strip markdown code fences if present (same logic as Python version)
  if (raw.startsWith("```")) {
    const parts = raw.split("```");
    raw = parts[1] ?? "";
    if (raw.startsWith("json")) raw = raw.slice(4);
    raw = raw.trim();
  }

  return JSON.parse(raw) as Recommendation[];
}
