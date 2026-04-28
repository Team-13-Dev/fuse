// app/api/segments/product/refresh/route.ts
//
// Server-side proxy for manually forcing a product segmentation run.
// The UI calls this; we forward to the pipeline's /segment/product/force.
//
// We catch the pipeline's `insufficient_products` skip and the rare 5xx
// (e.g. the recent "column created_at does not exist") and surface a

import { NextRequest, NextResponse } from "next/server"
import { getBusinessContext } from "@/lib/get-business-context"

const PIPELINE_URL = process.env.PIPELINE_URL

export async function POST(req: NextRequest) {
  const ctx = await getBusinessContext(req)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!PIPELINE_URL) {
    return NextResponse.json(
      { error: "Segmentation service is not configured." },
      { status: 503 }
    )
  }

  try {
    const res = await fetch(`${PIPELINE_URL}/segment/product/force`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        business_id:  ctx.businessId,
        triggered_by: "manual",
      }),
      // Node fetch timeout-ish — 8s is enough for the trigger eval; the
      // actual job runs in the background on the pipeline.
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.warn(`[segments/refresh] pipeline ${res.status}: ${text.slice(0, 300)}`)
      return NextResponse.json(
        { error: "Refresh failed — the segmentation service is having trouble." },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.warn("[segments/refresh] failed to reach pipeline:", msg)
    return NextResponse.json(
      { error: "Could not reach segmentation service. Try again in a moment." },
      { status: 503 }
    )
  }
}