// Manual "Refresh insights" trigger. Calls pipeline /segment/product/force.
// Rate-limited: one manual refresh per 5 minutes per business. << only for development

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { analysisJob } from "@/db/schema"
import { and, desc, eq, gt } from "drizzle-orm"
import { getBusinessContext } from "@/lib/get-business-context"

const PIPELINE_URL = process.env.PIPELINE_URL
const COOLDOWN_MS = 5 * 60 * 1000  // 5 minutes

export async function POST(req: NextRequest) {
  const ctx = await getBusinessContext(req)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!PIPELINE_URL) {
    return NextResponse.json({ error: "Pipeline not configured" }, { status: 503 })
  }

  // Rate-limit: reject if there's a recent manual job
  const cutoff = new Date(Date.now() - COOLDOWN_MS)
  const [recent] = await db
    .select({ id: analysisJob.id, status: analysisJob.status, createdAt: analysisJob.createdAt })
    .from(analysisJob)
    .where(and(
      eq(analysisJob.businessId, ctx.businessId),
      eq(analysisJob.type, "product_segmentation"),
      eq(analysisJob.triggeredBy, "manual"),
      gt(analysisJob.createdAt, cutoff),
    ))
    .orderBy(desc(analysisJob.createdAt))
    .limit(1)

  if (recent) {
    const remaining = Math.ceil(
      (COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000
    )
    return NextResponse.json(
      { error: `Please wait ${remaining}s before refreshing again.` },
      { status: 429 },
    )
  }

  const upstream = await fetch(`${PIPELINE_URL}/segment/product/force`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ business_id: ctx.businessId, triggered_by: "manual" }),
  })

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "")
    return NextResponse.json(
      { error: `Pipeline error: ${text.slice(0, 300)}` },
      { status: upstream.status },
    )
  }

  const data = await upstream.json()
  return NextResponse.json(data)
}