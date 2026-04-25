import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderItem, customer, product, } from "@/db/schema";
import { eq, and, ilike, desc, count } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";

// ─── GET /api/orders ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const ctx = await getBusinessContext(req);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status     = searchParams.get("status")?.trim();
    const customerId = searchParams.get("customer")?.trim();
    const search     = searchParams.get("search")?.trim();
    const page       = Math.max(parseInt(searchParams.get("page")  ?? "1",  10), 1);
    const limit      = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 500);
    const offset     = (page - 1) * limit;

    const conditions = [eq(order.businessId, ctx.businessId)];
    if (status)     conditions.push(eq(order.status, status));
    if (customerId) conditions.push(eq(order.customerId, customerId));
    if (search)     conditions.push(ilike(order.address, `%${search}%`));

    const where = and(...conditions);

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id:            order.id,
          businessId:    order.businessId,
          status:        order.status,
          total:         order.total,
          createdAt:     order.createdAt,
          customerId:    order.customerId,
          customerName:  customer.fullName,
          customerEmail: customer.email,
          customerPhone: customer.phoneNumber,
        })
        .from(order)
        .leftJoin(customer, eq(order.customerId, customer.id))
        .where(where)
        .orderBy(desc(order.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ n: count() }).from(order).where(where),
    ]);

    const total = Number(countResult[0].n);

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext:    page * limit < total,
        hasPrev:    page > 1,
      },
    });
  } catch (error) {
    console.error("Fetch Orders Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/orders ─────────────────────────────────────────────
// Roles: owner, manager
// Creates a new order with items, validates customer & products
export async function POST(req: NextRequest) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["owner", "manager"];
  if (!allowed.includes(ctx.businessRole)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  let body: Record<string, any>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { customerId, items, address, orderVoucher, orderDiscount } = body;

  if (!customerId || typeof customerId !== "string") {
    return NextResponse.json({ error: "customerId is required" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one order item is required" }, { status: 400 });
  }

  const [cust] = await db.select().from(customer).where(eq(customer.id, customerId)).limit(1);
  if (!cust) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  let total = 0;
  const orderItemsData: Omit<typeof orderItem.$inferInsert, "orderId">[] = [];

  for (const it of items) {
    const { productId, quantity, unitPrice, itemDiscount, attributes } = it;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "Each item must have a productId" }, { status: 400 });
    }
    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
    if (!unitPrice || isNaN(Number(unitPrice))) {
      return NextResponse.json({ error: "Invalid unitPrice" }, { status: 400 });
    }

    const [prod] = await db.select().from(product).where(eq(product.id, productId)).limit(1);
    if (!prod) return NextResponse.json({ error: `Product ${productId} not found` }, { status: 404 });

    const lineTotal = quantity * Number(unitPrice) - Number(itemDiscount || 0);
    total += lineTotal;

    orderItemsData.push({
      productId,
      quantity,
      unitPrice: String(unitPrice),
      itemDiscount: itemDiscount ? String(itemDiscount) : "0",
      attributes: attributes || null,
    });
  }

  total -= Number(orderDiscount || 0);
  if (total < 0) total = 0;

  // Insert order (decimal fields as strings)
  const [createdOrder] = await db.insert(order).values({
    customerId,
    businessId: ctx.businessId,
    total: String(total), 
    status: "pending",
    orderVoucher: orderVoucher || null,
    orderDiscount: orderDiscount ? String(orderDiscount) : "0", 
    address: address || null,
  }).returning();

  for (const oi of orderItemsData) {
    await db.insert(orderItem).values({
      ...oi,
      orderId: createdOrder.id,
    });
  }

  return NextResponse.json(createdOrder, { status: 201 });
}

