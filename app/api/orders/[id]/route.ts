import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customer, order, orderItem, product } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";

// ─── Helper: full order row + items ──────────────────────────────────────────
async function getFullOrder(id: string) {
  const [row] = await db
    .select({
      id:            order.id,
      businessId:    order.businessId,
      status:        order.status,
      total:         order.total,
      createdAt:     order.createdAt,
      customerId:    order.customerId,
      notes:         order.address,
      customerName:  customer.fullName,
      customerEmail: customer.email,
      customerPhone: customer.phoneNumber,
    })
    .from(order)
    .leftJoin(customer, eq(order.customerId, customer.id))
    .where(eq(order.id, id));

  if (!row) return null;

  const items = await db
    .select({
      productId: orderItem.productId,
      name:      product.name,
      quantity:  orderItem.quantity,
      unitPrice: orderItem.unitPrice,
    })
    .from(orderItem)
    .leftJoin(product, eq(orderItem.productId, product.id))
    .where(eq(orderItem.orderId, id));

  return { ...row, items };
}

// ─── GET /api/orders/[id] — single order with items ──────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getBusinessContext(req);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const fullOrder = await getFullOrder(id);

    if (!fullOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    // Ensure this order belongs to the requester's business
    if (fullOrder.businessId !== ctx.businessId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(fullOrder);
  } catch (error) {
    console.error("GET [id] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ─── PUT /api/orders/[id] — status-only update ───────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    await db.update(order).set({ status }).where(eq(order.id, id));

    const fullOrder = await getFullOrder(id);
    if (!fullOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(fullOrder);
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ─── PATCH /api/orders/[id] — full order edit ────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { customerId, status, notes, items } : {
      customerId?: string;
      status?: string;
      notes?: string;
      items?: { productId: string; name: string; quantity: number; unitPrice: number }[];
    } = body;

    const [existing] = await db.select().from(order).where(eq(order.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (customerId && customerId !== existing.customerId) {
      const [cust] = await db.select().from(customer).where(eq(customer.id, customerId)).limit(1);
      if (!cust) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    let newTotal: number | undefined;
    if (Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        const [prod] = await db.select().from(product).where(eq(product.id, it.productId)).limit(1);
        if (!prod) return NextResponse.json({ error: `Product ${it.productId} not found` }, { status: 404 });
      }
      newTotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    }

    const updatePayload: Partial<typeof order.$inferInsert> = {};
    if (customerId)             updatePayload.customerId = customerId;
    if (status)                 updatePayload.status     = status;
    if (notes !== undefined)    updatePayload.address    = notes;
    if (newTotal !== undefined) updatePayload.total      = String(newTotal);

    if (Object.keys(updatePayload).length > 0) {
      await db.update(order).set(updatePayload).where(eq(order.id, id));
    }

    if (Array.isArray(items) && items.length > 0) {
      await db.delete(orderItem).where(eq(orderItem.orderId, id));
      for (const it of items) {
        await db.insert(orderItem).values({
          orderId:      id,
          productId:    it.productId,
          quantity:     it.quantity,
          unitPrice:    String(it.unitPrice),
          itemDiscount: "0",
          attributes:   null,
        });
      }
    }

    const fullOrder = await getFullOrder(id);
    if (!fullOrder) {
      return NextResponse.json({ error: "Order not found after update" }, { status: 404 });
    }

    return NextResponse.json(fullOrder);
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ─── DELETE /api/orders/[id] ─────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .delete(order)
      .where(eq(order.id, id))
      .returning({ deletedId: order.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Order ${id} deleted` });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}