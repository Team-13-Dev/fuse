import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db"; // Path to your drizzle db instance
import { customer, order } from "@/db/schema"; // Path to your schema file
import { eq } from "drizzle-orm";

interface RouteParams {
  params: { id: string };
}

// ─── UPDATE ORDER STATUS (PATCH) ─────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Update the order and return the updated record
    const [updated] = await db.update(order).set({ status }).where(eq(order.id, id)).returning();

        // Re-run the join query for just this ID
        const [fullOrder] = await db
        .select({
            id: order.id,
            businessId: order.businessId,
            status: order.status,
            total: order.total,
            createdAt: order.createdAt,
            customerId: order.customerId,
            // Joined Customer fields
            customerName: customer.fullName,
            customerEmail: customer.email,
            customerPhone: customer.phoneNumber,
        })
        .from(order)
        .leftJoin(customer, eq(order.customerId, customer.id))
        .where(eq(order.id, id));

    if (!fullOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(fullOrder);
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ─── DELETE ORDER (DELETE) ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Delete the order
    // Note: orderItem has onDelete: "cascade", so items will be removed automatically
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