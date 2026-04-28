// Returns active (queued or running) jobs for the current business.
// Used by the dashboard notification bar (polls every 5s).

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { analysisJob } from "@/db/schema"
import { and, eq, inArray } from "drizzle-orm"
import { getBusinessContext } from "@/lib/get-business-context"

export async function GET(req: NextRequest) {
  const ctx = await getBusinessContext(req)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await db
    .select({
      id:          analysisJob.id,
      type:        analysisJob.type,
      status:      analysisJob.status,
      progress:    analysisJob.progress,
      detail:      analysisJob.detail,
      startedAt:   analysisJob.startedAt,
      createdAt:   analysisJob.createdAt,
    })
    .from(analysisJob)
    .where(and(
      eq(analysisJob.businessId, ctx.businessId),
      inArray(analysisJob.status, ["queued", "running"]),
    ))
    .orderBy(analysisJob.createdAt)

  return NextResponse.json({
    jobs: rows.map(r => ({
      id:        r.id,
      type:      r.type,
      status:    r.status,
      progress:  r.progress,
      detail:    r.detail,
      startedAt: r.startedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  })
}