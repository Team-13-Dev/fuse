import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { order } from "@/db/schema"
import { eq, and, gte, sql } from "drizzle-orm"
import { getBusinessContext } from "@/lib/get-business-context"

export async function GET(req: NextRequest) {
  const ctx = await getBusinessContext(req)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const bid    = ctx.businessId
  const period = req.nextUrl.searchParams.get("period") ?? "year"

  try {
    let rows: { label: string; value: number }[]

    if (period === "week") {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const result = await db.execute(sql`
        SELECT
          to_char(date_trunc('day', created_at), 'Mon DD') AS label,
          date_trunc('day', created_at)                     AS bucket,
          coalesce(sum(total), 0)::float                    AS value
        FROM "order"
        WHERE business_id = ${bid}
          AND created_at >= ${since}
        GROUP BY bucket
        ORDER BY bucket ASC
      `)
      rows = (result.rows ?? result).map((r: any) => ({ label: r.label, value: Number(r.value) }))
    } else if (period === "month") {
      const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      const result = await db.execute(sql`
        SELECT
          to_char(date_trunc('week', created_at), 'DD Mon') AS label,
          date_trunc('week', created_at)                     AS bucket,
          coalesce(sum(total), 0)::float                     AS value
        FROM "order"
        WHERE business_id = ${bid}
          AND created_at >= ${since}
        GROUP BY bucket
        ORDER BY bucket ASC
      `)
      rows = (result.rows ?? result).map((r: any) => ({ label: r.label, value: Number(r.value) }))
    } else {
      const since = new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1)
      const result = await db.execute(sql`
        SELECT
          to_char(date_trunc('month', created_at), 'Mon YY') AS label,
          date_trunc('month', created_at)                      AS bucket,
          coalesce(sum(total), 0)::float                       AS value
        FROM "order"
        WHERE business_id = ${bid}
          AND created_at >= ${since}
        GROUP BY bucket
        ORDER BY bucket ASC
      `)
      rows = (result.rows ?? result).map((r: any) => ({ label: r.label, value: Number(r.value) }))
    }

    return NextResponse.json({ points: rows })
  } catch (err) {
    console.error("[metrics/revenue]", err)
    return NextResponse.json({ points: [] }, { status: 500 })
  }
}
