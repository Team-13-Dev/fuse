import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { customer, product, order, orderItem } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { getBusinessContext } from "@/lib/get-business-context"
import type {
  CleanedCustomer,
  CleanedProduct,
  CleanedOrder,
  CleanedOrderItem,
} from "@/lib/pipeline/types"

interface StoreRequest {
  customers: CleanedCustomer[]
  products: CleanedProduct[]
  orders: CleanedOrder[]
  order_items: CleanedOrderItem[]
}

export async function POST(req: NextRequest) {
  const ctx = await getBusinessContext(req)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { businessId } = ctx

  let body: StoreRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { customers, products, orders, order_items } = body

  const stats = {
    customers_inserted: 0,
    customers_skipped: 0,
    products_inserted: 0,
    products_skipped: 0,
    orders_inserted: 0,
    order_items_inserted: 0,
  }

  // ── 1. Upsert customers ───────────────────────────────────────────────────
  // key: clerkId → email → fullName (in that priority)
  const customerIdMap = new Map<string, string>() // externalKey → DB uuid

  for (const c of customers) {
    if (!c.fullName) continue

    const externalKey = c.clerkId ?? c.email ?? c.fullName

    // Check duplicate within this business
    const existing = await db
      .select({ id: customer.id })
      .from(customer)
      .where(
        and(
          eq(customer.businessId, businessId),
          c.email ? eq(customer.email, c.email) : eq(customer.fullName, c.fullName),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      customerIdMap.set(externalKey, existing[0].id)
      stats.customers_skipped++
      continue
    }

    const [inserted] = await db
      .insert(customer)
      .values({
        businessId,
        clerkId:     c.clerkId ?? null,
        fullName:    c.fullName,
        email:       c.email ?? null,
        phoneNumber: c.phoneNumber ?? null,
        segment:     c.segment ?? null,
      })
      .returning({ id: customer.id })

    customerIdMap.set(externalKey, inserted.id)
    stats.customers_inserted++
  }

  // ── 2. Upsert products ────────────────────────────────────────────────────
  const productIdMap = new Map<string, string>() // name → DB uuid

  for (const p of products) {
    if (!p.name) continue

    const existing = await db
      .select({ id: product.id })
      .from(product)
      .where(and(eq(product.businessId, businessId), eq(product.name, p.name)))
      .limit(1)

    if (existing.length > 0) {
      productIdMap.set(p.name, existing[0].id)
      stats.products_skipped++
      continue
    }

    const [inserted] = await db
      .insert(product)
      .values({
        businessId,
        name:          p.name,
        price:         String(p.price ?? "0"),
        cost:          p.cost !== null ? String(p.cost) : null,
        stock:         p.stock ?? 0,
        description:   p.description ?? null,
        externalAccId: p.externalAccId ?? null,
      })
      .returning({ id: product.id })

    productIdMap.set(p.name, inserted.id)
    stats.products_inserted++
  }

  // ── 3. Insert orders ──────────────────────────────────────────────────────
  const orderIdMap = new Map<string, string>() // externalOrderId → DB uuid

  for (const o of orders) {
    const customerExternalKey = o.customerExternalId ?? ""
    const customerId = customerIdMap.get(customerExternalKey)

    // Orders require a customer link
    if (!customerId) continue

    const [inserted] = await db
      .insert(order)
      .values({
        businessId,
        customerId,
        total:         String(o.total ?? o.revenue ?? "0"),
        status:        o.status ?? "pending",
        orderVoucher:  o.orderVoucher ?? null,
        address:       o.address ?? null,
        orderDiscount: "0",
        createdAt:     o.createdAt ? new Date(o.createdAt) : new Date(),
      })
      .returning({ id: order.id })

    const key = o.externalOrderId ?? inserted.id
    orderIdMap.set(key, inserted.id)
    stats.orders_inserted++
  }

  // ── 4. Insert order items ─────────────────────────────────────────────────
  for (const item of order_items) {
    const orderId   = item.orderExternalId ? orderIdMap.get(item.orderExternalId) : undefined
    const productId = item.productName     ? productIdMap.get(item.productName)   : undefined

    if (!orderId || !productId) continue

    await db.insert(orderItem).values({
      orderId,
      productId,
      quantity:     item.quantity ?? 1,
      unitPrice:    String(item.unitPrice ?? "0"),
      itemDiscount: String(item.itemDiscount ?? "0"),
      attributes:   Object.keys(item.attributes).length > 0 ? item.attributes : null,
    })

    stats.order_items_inserted++
  }

  return NextResponse.json({ success: true, stats })
}