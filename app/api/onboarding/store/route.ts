// app/api/onboarding/store/route.ts  — v4
//
// Changes from v3:
// - Cookie-based auth (reads business_ctx cookie) instead of getBusinessContext()
//   which exhausts the Neon connection pool and causes ETIMEDOUT under load.
// - Added orderDiscount field to order insert (required by schema).
// - Same batch logic otherwise unchanged.

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { customer, product, order, orderItem } from "@/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import type {
  CleanedCustomer,
  CleanedProduct,
  CleanedOrder,
  CleanedOrderItem,
} from "@/lib/pipeline/types"

const BATCH = 500

interface StoreRequest {
  customers:   CleanedCustomer[]
  products:    CleanedProduct[]
  orders:      CleanedOrder[]
  order_items: CleanedOrderItem[]
}

function getBusinessId(req: NextRequest): string | null {
  const ctxCookie = req.cookies.get("business_ctx")?.value
  if (ctxCookie) {
    try {
      const ctx = JSON.parse(ctxCookie)
      if (ctx?.businessId) return ctx.businessId as string
    } catch { /* fall through */ }
  }
  return null
}

export async function POST(req: NextRequest) {
  const businessId = getBusinessId(req)
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: StoreRequest
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) }

  const { customers, products, orders, order_items } = body

  const stats = {
    customers_inserted:   0,
    customers_skipped:    0,
    products_inserted:    0,
    products_skipped:     0,
    orders_inserted:      0,
    order_items_inserted: 0,
  }

  // ── 1. Customers ──────────────────────────────────────────────────────────
  // Dedup by clerkId within this business
  const clerkIdMap = new Map<string, string>()  // clerkId → DB uuid
  const emailMap   = new Map<string, string>()  // email   → DB uuid
  const nameMap    = new Map<string, string>()  // fullName→ DB uuid

  const incomingClerkIds = customers
    .map(c => c.clerkId).filter((id): id is string => !!id)

  if (incomingClerkIds.length > 0) {
    const existing = await db
      .select({ id: customer.id, clerkId: customer.clerkId,
                email: customer.email, fullName: customer.fullName })
      .from(customer)
      .where(and(eq(customer.businessId, businessId), inArray(customer.clerkId, incomingClerkIds)))
    for (const r of existing) {
      if (r.clerkId) clerkIdMap.set(r.clerkId, r.id)
      if (r.email)   emailMap.set(r.email, r.id)
      if (r.fullName) nameMap.set(r.fullName, r.id)
      stats.customers_skipped++
    }
  }

  const newCustomers = customers.filter(c => {
    const key = c.clerkId ?? c.email ?? c.fullName
    if (!key) return false
    return !clerkIdMap.has(c.clerkId ?? "") && !emailMap.has(c.email ?? "")
  })

  for (let i = 0; i < newCustomers.length; i += BATCH) {
    const batch = newCustomers.slice(i, i + BATCH)
    const inserted = await db
      .insert(customer)
      .values(batch.map(c => ({
        businessId,
        clerkId:     c.clerkId     ?? null,
        fullName:    c.fullName    ?? (c.clerkId ? `Customer ${c.clerkId}` : "Unknown"),
        email:       c.email       ?? null,
        phoneNumber: c.phoneNumber ?? null,
        segment:     c.segment     ?? null,
      })))
      .onConflictDoNothing()
      .returning({ id: customer.id, clerkId: customer.clerkId,
                   email: customer.email, fullName: customer.fullName })

    for (const r of inserted) {
      if (r.clerkId)  clerkIdMap.set(r.clerkId,  r.id)
      if (r.email)    emailMap.set(r.email,    r.id)
      if (r.fullName) nameMap.set(r.fullName,  r.id)
      stats.customers_inserted++
    }
  }

  // Build complete lookup from DB for linking orders
  const allCustomers = await db
    .select({ id: customer.id, clerkId: customer.clerkId,
              email: customer.email, fullName: customer.fullName })
    .from(customer)
    .where(eq(customer.businessId, businessId))
  for (const r of allCustomers) {
    if (r.clerkId)  clerkIdMap.set(r.clerkId,  r.id)
    if (r.email)    emailMap.set(r.email,    r.id)
    if (r.fullName) nameMap.set(r.fullName,  r.id)
  }

  // ── 2. Products ───────────────────────────────────────────────────────────
  const accIdMap = new Map<string, string>()  // externalAccId → DB uuid
  const prodNameMap = new Map<string, string>() // name → DB uuid

  const incomingAccIds = products
    .map(p => p.externalAccId).filter((id): id is string => !!id)

  if (incomingAccIds.length > 0) {
    const existing = await db
      .select({ id: product.id, externalAccId: product.externalAccId, name: product.name })
      .from(product)
      .where(and(eq(product.businessId, businessId), inArray(product.externalAccId, incomingAccIds)))
    for (const r of existing) {
      if (r.externalAccId) accIdMap.set(r.externalAccId, r.id)
      prodNameMap.set(r.name, r.id)
      stats.products_skipped++
    }
  }

  const newProducts = products.filter(p => {
    if (!p.name) return false
    return !accIdMap.has(p.externalAccId ?? "") && !prodNameMap.has(p.name)
  })

  for (let i = 0; i < newProducts.length; i += BATCH) {
    const batch = newProducts.slice(i, i + BATCH)
    const inserted = await db
      .insert(product)
      .values(batch.map(p => ({
        businessId,
        name:          p.name,
        price:         String(p.price ?? "0"),
        cost:          p.cost  != null ? String(p.cost)  : null,
        stock:         p.stock ?? 0,
        description:   p.description   ?? null,
        externalAccId: p.externalAccId ?? null,
      })))
      .onConflictDoNothing()
      .returning({ id: product.id, externalAccId: product.externalAccId, name: product.name })

    for (const r of inserted) {
      if (r.externalAccId) accIdMap.set(r.externalAccId, r.id)
      prodNameMap.set(r.name, r.id)
      stats.products_inserted++
    }
  }

  // ── 3. Orders ─────────────────────────────────────────────────────────────
  // Schema: id, businessId, customerId, total, status, orderVoucher, orderDiscount, address, createdAt
  const orderIdMap = new Map<string, string>()  // externalOrderId → DB uuid

  const validOrders = orders.filter(o => {
    const custId =
      clerkIdMap.get(o.customerExternalId ?? "") ??
      emailMap.get(o.customerExternalId   ?? "") ??
      nameMap.get(o.customerExternalId    ?? "")
    return !!custId
  })

  for (let i = 0; i < validOrders.length; i += BATCH) {
    const batch = validOrders.slice(i, i + BATCH)

    const rows = batch.map(o => {
      const custId =
        clerkIdMap.get(o.customerExternalId ?? "") ??
        emailMap.get(o.customerExternalId   ?? "") ??
        nameMap.get(o.customerExternalId    ?? "")!
      return {
        businessId:    businessId,
        customerId:    custId,
        total:         String(o.total ?? o.revenue ?? "0"),
        status:        o.status ?? "completed",
        orderVoucher:  o.orderVoucher  ?? null,
        orderDiscount: "0",
        address:       o.address       ?? null,
        createdAt:     o.createdAt ? new Date(o.createdAt) : new Date(),
      }
    })

    const inserted = await db
      .insert(order)
      .values(rows)
      .returning({ id: order.id })

    batch.forEach((o, idx) => {
      const key = o.externalOrderId ?? inserted[idx]?.id
      if (key && inserted[idx]) {
        orderIdMap.set(key, inserted[idx].id)
        stats.orders_inserted++
      }
    })
  }

  // ── 4. Order items ────────────────────────────────────────────────────────
  const validItems = order_items.filter(item => {
    const orderId = item.orderExternalId ? orderIdMap.get(item.orderExternalId) : undefined
    const productId =
      (item.productAccId  ? accIdMap.get(item.productAccId)       : undefined) ??
      (item.productName   ? prodNameMap.get(item.productName)     : undefined)
    return !!orderId && !!productId
  })

  for (let i = 0; i < validItems.length; i += BATCH) {
    const batch = validItems.slice(i, i + BATCH)
    await db.insert(orderItem).values(
      batch.map(item => ({
        orderId:      orderIdMap.get(item.orderExternalId!)!,
        productId:    (item.productAccId ? accIdMap.get(item.productAccId) : prodNameMap.get(item.productName!))!,
        quantity:     item.quantity    ?? 1,
        unitPrice:    String(item.unitPrice    ?? "0"),
        itemDiscount: String(item.itemDiscount ?? "0"),
        attributes:   item.attributes && Object.keys(item.attributes).length > 0
          ? item.attributes : null,
      }))
    )
    stats.order_items_inserted += batch.length
  }

  return NextResponse.json({ success: true, stats })
}