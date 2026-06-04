// app/api/recommendations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { callLLM, CombinedContext } from "@/lib/llm";

export const maxDuration = 60; // allow up to 60s for Groq call

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_segmentation, product_segmentation, sales_forecast } = body;

    if (!customer_segmentation || !product_segmentation || !sales_forecast) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: customer_segmentation, product_segmentation, and sales_forecast are all required.",
        },
        { status: 400 }
      );
    }

    const context: CombinedContext = {
      customer_segmentation,
      product_segmentation,
      sales_forecast,
    };

    const recommendations = await callLLM(context);

    return NextResponse.json({ recommendations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/recommendations]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
