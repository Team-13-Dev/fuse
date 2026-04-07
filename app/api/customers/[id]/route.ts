import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customer, order } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/customers/[id] ─────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });

  const [row] = await db
    .select()
    .from(customer)
    .where(and(eq(customer.id, id), eq(customer.businessId, ctx.businessId)));

  if (!row) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  // Enrich with order summary
  const [orderStats] = await db
    .select({ orderCount: count() })
    .from(order)
    .where(eq(order.customerId, id));

  return NextResponse.json({ ...row, orderCount: orderStats?.orderCount ?? 0 });
}

// ─── PATCH /api/customers/[id] ───────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["owner", "manager"];
  if (!allowed.includes(ctx.businessRole)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });

  // Confirm ownership scoping
  const [existing] = await db
    .select({ id: customer.id, email: customer.email })
    .from(customer)
    .where(and(eq(customer.id, id), eq(customer.businessId, ctx.businessId)));

  if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { fullName, email, phoneNumber, segment, clerkId } = body as Record<string, string>;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (fullName !== undefined && !fullName?.trim()) {
    return NextResponse.json({ error: "Full name cannot be empty" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email?.trim() && !emailRegex.test(email.trim())) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const VALID_SEGMENTS = ["VIP", "Regular", "New", "At-risk", "Inactive"];
  if (segment !== undefined && segment !== null && segment !== "" && !VALID_SEGMENTS.includes(segment)) {
    return NextResponse.json({ error: "Invalid segment value" }, { status: 400 });
  }

  // ── Duplicate email guard (skip if email unchanged) ─────────────────────────
  const newEmail = email?.trim().toLowerCase();
  if (newEmail && newEmail !== existing.email) {
    const [duplicate] = await db
      .select({ id: customer.id })
      .from(customer)
      .where(
        and(
          eq(customer.businessId, ctx.businessId),
          eq(customer.email, newEmail),
        )
      )
      .limit(1);

    if (duplicate) {
      return NextResponse.json(
        { error: "Another customer with this email already exists" },
        { status: 409 }
      );
    }
  }

  // ── Build update payload (only fields that were sent) ───────────────────────
  const patch: Record<string, unknown> = {};
  if (fullName    !== undefined) patch.fullName    = fullName.trim();
  if (email       !== undefined) patch.email       = newEmail || null;
  if (phoneNumber !== undefined) patch.phoneNumber = phoneNumber?.trim() || null;
  if (segment     !== undefined) patch.segment     = segment?.trim() || null;
  if (clerkId     !== undefined) patch.clerkId     = clerkId?.trim() || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(customer)
    .set(patch)
    .where(and(eq(customer.id, id), eq(customer.businessId, ctx.businessId)))
    .returning();

  return NextResponse.json(updated);
}

// ─── DELETE /api/customers/[id] ─────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only owners can hard-delete customers
  if (!ctx.isOwner) {
    return NextResponse.json(
      { error: "Forbidden: only business owners can delete customers" },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });

  // Check if customer belongs to business
  const [existing] = await db
    .select({ id: customer.id, fullName: customer.fullName })
    .from(customer)
    .where(and(eq(customer.id, id), eq(customer.businessId, ctx.businessId)));

  if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  // Warn: orders are cascade-deleted by the DB. Surface this info.
  const [orderStats] = await db
    .select({ orderCount: count() })
    .from(order)
    .where(eq(order.customerId, id));

  const orderCount = Number(orderStats?.orderCount ?? 0);

  // If ?force=true is not passed and there are orders, reject with a warning
  const force = new URL(req.url).searchParams.get("force") === "true";
  if (orderCount > 0 && !force) {
    return NextResponse.json(
      {
        error: "Customer has associated orders",
        detail: `This customer has ${orderCount} order(s). Pass ?force=true to confirm deletion and cascade-remove all related orders.`,
        orderCount,
      },
      { status: 422 }
    );
  }

  await db
    .delete(customer)
    .where(and(eq(customer.id, id), eq(customer.businessId, ctx.businessId)));

  return NextResponse.json({ success: true, id, name: existing.fullName });
}