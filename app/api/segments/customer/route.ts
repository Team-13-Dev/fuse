// app/api/segments/customer/route.ts
//
// Returns the latest customer segmentation (RFM) results for the current business:
//   - per-segment cluster summaries with RFM stats + marketing actions
//   - whether enough customers exist to run segmentation at all
//
// Consumed by the segments page → Customers tab.

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { customer, customerClusterSummary, business, order } from "@/db/schema"
import { eq, count, sql } from "drizzle-orm"
import { getBusinessContext } from "@/lib/get-business-context"

const MIN_CUSTOMERS_NEEDED = 50

// Shape stored in the top_customers jsonb column (mirrors what the Python script writes)
type StoredTopCustomer = {
  customer_id: string
  name:        string | null
  monetary:    number
  frequency:   number
  recency:     number
}

export async function GET(req: NextRequest) {
  const ctx = await getBusinessContext(req)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ── 1. Customer count (with at least one order) ───────────────────────────
  const [counts] = await db
    .select({ n: count() })
    .from(customer)
    .innerJoin(order, eq(order.customerId, customer.id))
    .where(eq(customer.businessId, ctx.businessId))

  const customerCount = Number(counts?.n ?? 0)

  // ── 2. Last segmentation timestamp ───────────────────────────────────────
  const [biz] = await db
    .select({ lastAt: business.lastCustomerSegmentAt })
    .from(business)
    .where(eq(business.id, ctx.businessId))
    .limit(1)

  // ── 3. Cluster summaries ──────────────────────────────────────────────────
  const clusters = await db
    .select()
    .from(customerClusterSummary)
    .where(eq(customerClusterSummary.businessId, ctx.businessId))
    .orderBy(sql`${customerClusterSummary.monetarySum} DESC`)

  const hasResults = clusters.length > 0

  // ── 4. Shape the response ─────────────────────────────────────────────────
  return NextResponse.json({
    customerCount,
    minCustomersNeeded: MIN_CUSTOMERS_NEEDED,
    hasResults,
    lastJobAt: biz?.lastAt?.toISOString() ?? null,
    clusters: clusters.map(c => {
      // top_customers is jsonb — Drizzle returns it already parsed as unknown
      let topCustomers: StoredTopCustomer[] = []
      try {
        const raw = typeof c.topCustomers === "string"
          ? JSON.parse(c.topCustomers as string)
          : c.topCustomers
        if (Array.isArray(raw)) topCustomers = raw as StoredTopCustomer[]
      } catch {
        // leave as []
      }

      return {
        cluster:         c.cluster,
        segmentName:     c.segmentName,
        numCustomers:    c.numCustomers,
        recencyMedian:   Number(c.recencyMedian),
        frequencyMedian: Number(c.frequencyMedian),
        monetaryMedian:  Number(c.monetaryMedian),
        monetarySum:     Number(c.monetarySum),
        aovMedian:       c.aovMedian    != null ? Number(c.aovMedian)    : null,
        tenureMedian:    c.tenureMedian != null ? Number(c.tenureMedian) : null,
        revenuePct:      Number(c.revenuePct),
        customerPct:     Number(c.customerPct),
        churnRisk:       c.churnRisk,
        priority:        c.priority,
        channel:         c.channel,
        offer:           c.offer,
        upsell:          c.upsell,
        campaignFreq:    c.campaignFreq,
        topCustomers,
      }
    }),
  })
}