// lib/segmentation/trigger-product.ts
//
// Fire-and-forget helper called by CRM mutation routes (products, orders)
// to ask the pipeline whether a re-segmentation is warranted.
//
// IMPORTANT:
// - Never `await` this in a route handler — call it as `triggerProductSegmentation(...)`
//   and let it run in the background. The route should return immediately to the user.
// - All errors are caught and logged. This must never throw to the caller.

const PIPELINE_URL = process.env.PIPELINE_URL

export function triggerProductSegmentation(
  businessId: string,
  source:     "auto:threshold" | "auto:clean" | "manual",
): void {
  if (!PIPELINE_URL) {
    console.warn("[trigger-product] PIPELINE_URL not set — skipping segmentation trigger")
    return
  }

  // Fire and forget — never await.
  void fetch(`${PIPELINE_URL}/segment/product/maybe`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ business_id: businessId, triggered_by: source }),
  })
    .then(async res => {
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        console.warn(`[trigger-product] pipeline returned ${res.status}: ${text.slice(0, 200)}`)
        return
      }
      const data = await res.json()
      console.log(`[trigger-product] decision: ${data.reason} — will_run=${data.will_run}`)
    })
    .catch(err => {
      console.warn("[trigger-product] failed to reach pipeline (non-critical):", err.message)
    })
}