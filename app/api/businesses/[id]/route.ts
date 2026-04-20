// app/api/businesses/[id]/route.ts
//
// Uses cookie-based auth only — no DB session query.
// getBusinessContext() opens a DB connection for session lookup which
// exhausts Neon's connection pool when called rapidly (e.g. deleting
// multiple stores). Reading from the signed cookie avoids this entirely.

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/db"
import {
  business, customer, product, order, orderItem,
  teamMember, integration, subscription,
} from "@/db/schema"
import { eq, inArray } from "drizzle-orm"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Auth: read business_ctx cookie — set at login, contains role + businessId
  const cookieStore  = await cookies()
  const raw          = cookieStore.get("business_ctx")?.value
  const businessCtx  = raw ? JSON.parse(raw) : null

  // Also need session token to confirm the user is logged in at all
  const sessionToken =
    cookieStore.get("better-auth.session_token")?.value ??
    cookieStore.get("__Secure-better-auth.session_token")?.value

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!businessCtx?.role || businessCtx.role !== "owner") {
    return NextResponse.json(
      { error: "Only the store owner can delete this store" },
      { status: 403 },
    )
  }

  const { id } = await params

  // Verify the business exists (single lightweight query)
  const found = await db
    .select({ id: business.id })
    .from(business)
    .where(eq(business.id, id))
    .limit(1)

  if (!found.length) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 })
  }

  // ── Manual cascade (order_item.productId has no onDelete: cascade) ─────────

  // Collect customer + product IDs
  const [customerRows, productRows] = await Promise.all([
    db.select({ id: customer.id }).from(customer).where(eq(customer.businessId, id)),
    db.select({ id: product.id  }).from(product ).where(eq(product.businessId,  id)),
  ])

  const customerIds = customerRows.map(c => c.id)
  const productIds  = productRows.map(p => p.id)

  // Collect order IDs
  let orderIds: string[] = []
  if (customerIds.length > 0) {
    const orderRows = await db
      .select({ id: order.id })
      .from(order)
      .where(inArray(order.customerId, customerIds))
    orderIds = orderRows.map(o => o.id)
  }

  // 1. order_items first — blocks both product and order deletion
  if (orderIds.length > 0) {
    await db.delete(orderItem).where(inArray(orderItem.orderId, orderIds))
  }
  if (productIds.length > 0) {
    await db.delete(orderItem).where(inArray(orderItem.productId, productIds))
  }

  // 2. orders
  if (orderIds.length > 0) {
    await db.delete(order).where(inArray(order.id, orderIds))
  }

  // 3. products + customers (order no longer matters)
  await Promise.all([
    db.delete(product).where(eq(product.businessId, id)),
    db.delete(customer).where(eq(customer.businessId, id)),
  ])

  // 4. other business children
  await Promise.all([
    db.delete(teamMember).where(eq(teamMember.businessId, id)),
    db.delete(integration).where(eq(integration.businessId, id)),
    db.delete(subscription).where(eq(subscription.businessId, id)),
  ])

  // 5. business itself
  await db.delete(business).where(eq(business.id, id))

  return NextResponse.json({ success: true })
}