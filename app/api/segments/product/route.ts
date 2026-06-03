// Returns the latest product segmentation results for the current business:
//   - per-product cluster assignments
//   - cluster summary stats
//   - whether enough products exist to run segmentation at all
//
// Consumed by the products page to display cluster chips + the segments view.

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { product, productSegment, productClusterSummary, business } from "@/db/schema"
import { eq, count, inArray, and } from "drizzle-orm"
import { getBusinessContext } from "@/lib/get-business-context"

// The pipeline stores top/bottom products keyed only by UUID. Resolve names so
// the UI can show something readable instead of a truncated id.
type RankedProduct = {
  product_id:     string
  profit?:        number
  revenue?:       number
  profit_margin?: number
}

const MIN_PRODUCTS_NEEDED = 15

export async function GET(req: NextRequest) {
  const ctx = await getBusinessContext(req)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // 1. Product count + last segmentation timestamp
  const [counts] = await db
    .select({ n: count() })
    .from(product)
    .where(eq(product.businessId, ctx.businessId))

  const [biz] = await db
    .select({ lastAt: business.lastProductSegmentAt })
    .from(business)
    .where(eq(business.id, ctx.businessId))
    .limit(1)

  const productCount = Number(counts?.n ?? 0)

  // 2. Per-product assignments
  const segments = await db
    .select({
      productId:   productSegment.productId,
      cluster:     productSegment.cluster,
      clusterName: productSegment.clusterName,
      updatedAt:   productSegment.updatedAt,
    })
    .from(productSegment)
    .where(eq(productSegment.businessId, ctx.businessId))

  // 3. Cluster summaries
  const clusters = await db
    .select()
    .from(productClusterSummary)
    .where(eq(productClusterSummary.businessId, ctx.businessId))
    .orderBy(productClusterSummary.cluster)

  // 3a. Resolve product names for the top/bottom lists (one batched query).
  const rankedIds = new Set<string>()
  for (const c of clusters) {
    for (const p of (c.topProducts    as RankedProduct[] | null) ?? []) rankedIds.add(p.product_id)
    for (const p of (c.bottomProducts as RankedProduct[] | null) ?? []) rankedIds.add(p.product_id)
  }
  const nameById = new Map<string, string>()
  if (rankedIds.size > 0) {
    const named = await db
      .select({ id: product.id, name: product.name })
      .from(product)
      .where(and(
        eq(product.businessId, ctx.businessId),
        inArray(product.id, [...rankedIds]),
      ))
    for (const p of named) nameById.set(p.id, p.name)
  }
  const withNames = (list: RankedProduct[] | null) =>
    (list ?? []).map(p => ({ ...p, name: nameById.get(p.product_id) ?? null }))

  return NextResponse.json({
    hasResults:        segments.length > 0,
    productCount,
    minProductsNeeded: MIN_PRODUCTS_NEEDED,
    lastJobAt:         biz?.lastAt?.toISOString() ?? null,
    segments: segments.map(s => ({
      productId:   s.productId,
      cluster:     s.cluster,
      clusterName: s.clusterName,
      updatedAt:   s.updatedAt.toISOString(),
    })),
    clusters: clusters.map(c => ({
      id:               c.id,
      cluster:          c.cluster,
      clusterName:      c.clusterName,
      numProducts:      c.numProducts,
      avgProfit:        c.avgProfit       ? Number(c.avgProfit)       : null,
      totalProfit:      c.totalProfit     ? Number(c.totalProfit)     : null,
      avgRevenue:       c.avgRevenue      ? Number(c.avgRevenue)      : null,
      totalRevenue:     c.totalRevenue    ? Number(c.totalRevenue)    : null,
      avgPrice:         c.avgPrice        ? Number(c.avgPrice)        : null,
      avgCost:          c.avgCost         ? Number(c.avgCost)         : null,
      avgMargin:        c.avgMargin       ? Number(c.avgMargin)       : null,
      avgStock:         c.avgStock        ? Number(c.avgStock)        : null,
      avgQuantity:      c.avgQuantity     ? Number(c.avgQuantity)     : null,
      revenueSharePct:  c.revenueSharePct ? Number(c.revenueSharePct) : null,
      profitSharePct:   c.profitSharePct  ? Number(c.profitSharePct)  : null,
      topProducts:      withNames(c.topProducts    as RankedProduct[] | null),
      bottomProducts:   withNames(c.bottomProducts as RankedProduct[] | null),
    })),
  })
}