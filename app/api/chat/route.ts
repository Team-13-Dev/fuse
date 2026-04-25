import { NextRequest, NextResponse } from "next/server";
import { documents, embeddings } from "@/lib/store";
import { embed } from "@/lib/embed";
import { OpenAI } from "openai";

const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY!,
});

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const queryEmbedding = await embed(message);

  const scored = documents.map((doc, i) => ({
    doc,
    score: cosineSimilarity(queryEmbedding, embeddings[i]),
  }));

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const context = top.map((t) => t.doc).join("\n");

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "You are a business assistant. Answer using only provided data. Use EGP.",
      },
      {
        role: "user",
        content: `Question: ${message}\n\nData:\n${context}`,
      },
    ],
  });

  return NextResponse.json({
    reply: completion.choices[0].message.content,
  });
}