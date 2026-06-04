// app/api/dashboard/metrics/route.ts
//
// One endpoint, one round-trip — feeds the dashboard with everything it needs:
//   - top metric cards (revenue, orders, customers, products) with WoW deltas
//   - 6-month revenue series for the chart
//   - order status breakdown for the donut
//   - 5 most recent orders for the activity card
//
// Multi-tenant: every query is scoped by businessId via getBusinessContext.

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { order, orderItem, customer, product } from "@/db/schema"
import { eq, and, gte, lt, sql, desc } from "drizzle-orm"
import { getBusinessContext } from "@/lib/get-business-context"

export async function GET(req: NextRequest) {
  const ctx = await getBusinessContext(req)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const bid = ctx.businessId

  const now      = new Date()
  const weekAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
  const twoWeeks = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const sixMonths = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  try {
    // ── Counts (orders / customers / products) ─────────────────────────────
    const [
      [{ totalOrders }],
      [{ thisWeekOrders }],
      [{ lastWeekOrders }],
      [{ totalCustomers }],
      [{ totalProducts }],
      [{ revenueThisWeek }],
      [{ revenueLastWeek }],
      [{ revenueAllTime }],
    ] = await Promise.all([
      db.select({ totalOrders: sql<number>`count(*)::int` })
        .from(order).where(eq(order.businessId, bid)),

      db.select({ thisWeekOrders: sql<number>`count(*)::int` })
        .from(order).where(and(eq(order.businessId, bid), gte(order.createdAt, weekAgo))),

      db.select({ lastWeekOrders: sql<number>`count(*)::int` })
        .from(order).where(and(
          eq(order.businessId, bid),
          gte(order.createdAt, twoWeeks),
          lt(order.createdAt, weekAgo),
        )),

      db.select({ totalCustomers: sql<number>`count(*)::int` })
        .from(customer).where(eq(customer.businessId, bid)),

      db.select({ totalProducts: sql<number>`count(*)::int` })
        .from(product).where(eq(product.businessId, bid)),

      db.select({ revenueThisWeek: sql<number>`coalesce(sum(${order.total}), 0)::float` })
        .from(order).where(and(eq(order.businessId, bid), gte(order.createdAt, weekAgo))),

      db.select({ revenueLastWeek: sql<number>`coalesce(sum(${order.total}), 0)::float` })
        .from(order).where(and(
          eq(order.businessId, bid),
          gte(order.createdAt, twoWeeks),
          lt(order.createdAt, weekAgo),
        )),

      db.select({ revenueAllTime: sql<number>`coalesce(sum(${order.total}), 0)::float` })
        .from(order).where(eq(order.businessId, bid)),
    ])

    // ── 6-month revenue series ────────────────────────────────────────────
    const monthly = await db.execute(sql`
      SELECT
        to_char(date_trunc('month', "created_at"), 'Mon') AS label,
        date_trunc('month', "created_at")                  AS bucket,
        coalesce(sum(${order.total}), 0)::float            AS value
      FROM "order"
      WHERE business_id = ${bid}
        AND created_at >= ${sixMonths}
      GROUP BY bucket
      ORDER BY bucket ASC
    `)
    const revenue = (monthly.rows ?? monthly).map((r: any) => ({
      label: r.label,
      value: Number(r.value),
    }))

    // ── Order status mix ──────────────────────────────────────────────────
    const statusRows = await db
      .select({
        status: order.status,
        n:      sql<number>`count(*)::int`,
      })
      .from(order)
      .where(eq(order.businessId, bid))
      .groupBy(order.status)

    const statusTotal = statusRows.reduce((a, r) => a + Number(r.n), 0) || 1
    const orderMix = statusRows.map(r => ({
      status: r.status,
      count:  Number(r.n),
      pct:    (Number(r.n) / statusTotal) * 100,
    }))

    // ── Recent orders ─────────────────────────────────────────────────────
    const recentRows = await db
      .select({
        id:           order.id,
        total:        order.total,
        status:       order.status,
        createdAt:    order.createdAt,
        customerName: customer.fullName,
      })
      .from(order)
      .leftJoin(customer, eq(order.customerId, customer.id))
      .where(eq(order.businessId, bid))
      .orderBy(desc(order.createdAt))
      .limit(5)

    const recent = recentRows.map(r => ({
      orderNumber:  `#${r.id.slice(0, 6).toUpperCase()}`,
      customerName: r.customerName ?? "Walk-in",
      total:        Number(r.total),
      status:       r.status,
    }))

    // ── Inventory health (out-of-stock / low-stock) ───────────────────────
    const [[{ outOfStock }], [{ lowStock }]] = await Promise.all([
      db.select({ outOfStock: sql<number>`count(*)::int` })
        .from(product).where(and(eq(product.businessId, bid), eq(product.stock, 0))),
      db.select({ lowStock: sql<number>`count(*)::int` })
        .from(product).where(and(
          eq(product.businessId, bid),
          gte(product.stock, 1),
          lt(product.stock, 11),
        )),
    ])

    // ── Low-stock product list ────────────────────────────────────────────
    const lowStockRows = await db
      .select({ name: product.name, stock: product.stock })
      .from(product)
      .where(and(eq(product.businessId, bid), lt(product.stock, 11)))
      .orderBy(product.stock)
      .limit(8)
    const lowStockProducts = lowStockRows.map(r => ({ name: r.name, stock: Number(r.stock) }))

    // ── Top products by realized revenue ──────────────────────────────────
    const topRows = await db.execute(sql`
      SELECT p.id, p.name,
             coalesce(sum(${orderItem.unitPrice} * ${orderItem.quantity}), 0)::float AS revenue,
             coalesce(sum(${orderItem.quantity}), 0)::int                            AS units
      FROM ${orderItem}
      JOIN "order" o ON o.id = ${orderItem.orderId} AND o.business_id = ${bid}
      JOIN ${product} p ON p.id = ${orderItem.productId}
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
      LIMIT 5
    `)
    const topProducts = (topRows.rows ?? topRows).map((r: any) => ({
      id:      r.id,
      name:    r.name,
      revenue: Number(r.revenue),
      units:   Number(r.units),
    }))

    // ── Build metric cards with deltas ────────────────────────────────────
    function pctDelta(curr: number, prev: number) {
      if (!prev) return curr > 0 ? { up: true, change: "New" } : { up: true, change: "0%" }
      const d = ((curr - prev) / prev) * 100
      return { up: d >= 0, change: `${d >= 0 ? "+" : ""}${d.toFixed(1)}%` }
    }

    const revDelta   = pctDelta(Number(revenueThisWeek), Number(revenueLastWeek))
    const orderDelta = pctDelta(Number(thisWeekOrders), Number(lastWeekOrders))

    const metrics = [
      {
        type:   "revenue" as const,
        label:  "Total revenue",
        value:  `EGP ${Number(revenueAllTime).toLocaleString("en-EG", { maximumFractionDigits: 0 })}`,
        change: revDelta.change,
        up:     revDelta.up,
        sub:    "all time · gross sales",
      },
      {
        type:   "orders" as const,
        label:  "Orders",
        value:  String(Number(totalOrders)),
        change: orderDelta.change,
        up:     orderDelta.up,
        sub:    `${Number(thisWeekOrders)} this week`,
        href:   "/dashboard/orders",
      },
      {
        type:   "customers" as const,
        label:  "Customers",
        value:  String(Number(totalCustomers)),
        change: "Total",
        up:     true,
        sub:    "in CRM",
        href:   "/dashboard/customers",
      },
      {
        type:   "products" as const,
        label:  "Products",
        value:  String(Number(totalProducts)),
        change: "Active",
        up:     true,
        sub:    "in catalog",
        href:   "/dashboard/products",
      },
    ]

    const totalOrdersN = Number(totalOrders)
    const avgOrderValue = totalOrdersN > 0 ? Number(revenueAllTime) / totalOrdersN : 0

    return NextResponse.json({
      metrics,
      revenue,
      orderMix,
      recent,
      topProducts,
      inventory: { outOfStock: Number(outOfStock), lowStock: Number(lowStock) },
      allTimeRevenue: Number(revenueAllTime),
      avgOrderValue,
      _allTimeRevenue: Number(revenueAllTime),
      lowStockProducts,
    })
  } catch (err) {
    console.error("[dashboard/metrics] error:", err)
    return NextResponse.json(
      {
        error: "Failed to load metrics",
        metrics: [], revenue: [], orderMix: [], recent: [], topProducts: [],
        inventory: { outOfStock: 0, lowStock: 0 }, allTimeRevenue: 0, avgOrderValue: 0,
        lowStockProducts: [],
      },
      { status: 500 },
    )
  }
}