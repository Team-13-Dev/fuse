// Forwards the SSE stream from the pipeline directly to the browser.
// No buffering — the stream passes through as-is.

import { NextRequest } from "next/server"
import { getBusinessContext } from "@/lib/get-business-context"
import type { ConfirmedMapping } from "@/lib/pipeline/types"

const PIPELINE_URL = process.env.PIPELINE_URL

export async function POST(req: NextRequest) {
  const ctx = await getBusinessContext(req)
  if (!ctx) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  if (!PIPELINE_URL) {
    return new Response(JSON.stringify({ error: "PIPELINE_URL not configured" }), { status: 503 })
  }

  let body: { file_id: string; mapping: ConfirmedMapping }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 })
  }

  if (!body.file_id || !body.mapping) {
    return new Response(JSON.stringify({ error: "Missing file_id or mapping" }), { status: 400 })
  }

  // Forward to pipeline and stream the response straight back
  const upstream = await fetch(`${PIPELINE_URL}/clean`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: body.file_id, mapping: body.mapping, business_id: ctx.businessId }),
  })

  if (!upstream.ok || !upstream.body) {
    const err = await upstream.text()
    return new Response(
      JSON.stringify({ error: `Pipeline error: ${err}` }),
      { status: upstream.status },
    )
  }

  // Pass the SSE stream directly to the browser
  return new Response(upstream.body, {
    headers: {
      "Content-Type":                "text/event-stream",
      "Cache-Control":               "no-cache",
      "X-Accel-Buffering":           "no",
      "Access-Control-Allow-Origin": "*",
    },
  })
}