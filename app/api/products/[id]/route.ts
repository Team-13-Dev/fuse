import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { product, orderItem, order, customer } from "@/db/schema";
import { eq, and, count, max } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/products/[id] ──────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing product ID" }, { status: 400 });

  const [row] = await db
    .select()
    .from(product)
    .where(and(eq(product.id, id), eq(product.businessId, ctx.businessId)));

  if (!row) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Enrich with sales stats (units sold + last order date)
  const [stats] = await db
    .select({
      unitsSold:    count(orderItem.id),
      lastSoldDate: max(order.createdAt),
    })
    .from(orderItem)
    .innerJoin(order, eq(orderItem.orderId, order.id))
    .where(eq(orderItem.productId, id));

  return NextResponse.json({
    ...row,
    unitsSold:    Number(stats?.unitsSold ?? 0),
    lastSoldDate: stats?.lastSoldDate ?? null,
  });
}

// ─── PATCH /api/products/[id] ────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["owner", "manager"];
  if (!allowed.includes(ctx.businessRole)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing product ID" }, { status: 400 });

  const [existing] = await db
    .select({ id: product.id })
    .from(product)
    .where(and(eq(product.id, id), eq(product.businessId, ctx.businessId)));

  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, price, description, stock, cost, imagesUrl } = body;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Product name cannot be empty" }, { status: 400 });
    }
    if ((name as string).trim().length > 255) {
      return NextResponse.json({ error: "Product name must be 255 characters or fewer" }, { status: 400 });
    }
  }

  if (price !== undefined) {
    const priceNum = Number(price);
    if (isNaN(priceNum)) {
      return NextResponse.json({ error: "Invalid price value" }, { status: 400 });
    }
    if (priceNum < 0) {
      return NextResponse.json({ error: "Price cannot be negative" }, { status: 400 });
    }
    if (priceNum > 999_999_999.99) {
      return NextResponse.json({ error: "Price exceeds maximum allowed value" }, { status: 400 });
    }
  }

  if (stock !== undefined && stock !== null && stock !== "") {
    const stockNum = Number(stock);
    if (isNaN(stockNum) || !Number.isInteger(stockNum)) {
      return NextResponse.json({ error: "Stock must be a whole number" }, { status: 400 });
    }
    if (stockNum < 0) {
      return NextResponse.json({ error: "Stock cannot be negative" }, { status: 400 });
    }
  }

  if (cost !== undefined && cost !== null && cost !== "") {
    const costNum = Number(cost);
    if (isNaN(costNum)) {
      return NextResponse.json({ error: "Cost must be a valid number" }, { status: 400 });
    }
    if (costNum < 0) {
      return NextResponse.json({ error: "Cost cannot be negative" }, { status: 400 });
    }
  }

  if (imagesUrl !== undefined && imagesUrl !== null && !Array.isArray(imagesUrl)) {
    return NextResponse.json({ error: "imagesUrl must be an array of URLs" }, { status: 400 });
  }

  // ── Build patch (only provided fields) ─────────────────────────────────────
  const patch: Record<string, unknown> = {};
  if (name        !== undefined) patch.name        = (name as string).trim();
  if (price       !== undefined) patch.price       = String(Number(price).toFixed(2));
  if (description !== undefined) patch.description = description && typeof description === "string" ? description.trim() || null : null;
  if (stock       !== undefined) patch.stock       = stock !== "" && stock !== null ? Number(stock) : 0;
  if (cost        !== undefined) patch.cost        = cost !== "" && cost !== null ? String(Number(cost).toFixed(2)) : null;
  if (imagesUrl   !== undefined) patch.imagesUrl   = imagesUrl;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(product)
    .set(patch)
    .where(and(eq(product.id, id), eq(product.businessId, ctx.businessId)))
    .returning();

  return NextResponse.json(updated);
}

// ─── DELETE /api/products/[id] ───────────────────────────────────────────────
/**
 * Products are referenced by order_item rows (no DB cascade — intentional,
 * to preserve order history). We must guard against deleting a product that
 * has order history; require ?force=true to confirm.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!ctx.isOwner) {
    return NextResponse.json(
      { error: "Forbidden: only business owners can delete products" },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing product ID" }, { status: 400 });

  // Confirm product belongs to this business
  const [existing] = await db
    .select({ id: product.id, name: product.name })
    .from(product)
    .where(and(eq(product.id, id), eq(product.businessId, ctx.businessId)));

  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Check referential integrity – how many order_item rows reference this product
  const [refStats] = await db
    .select({ refCount: count() })
    .from(orderItem)
    .where(eq(orderItem.productId, id));

  const refCount = Number(refStats?.refCount ?? 0);
  const force    = new URL(req.url).searchParams.get("force") === "true";

  if (refCount > 0 && !force) {
    return NextResponse.json(
      {
        error:    "Product has order history",
        detail:   `This product appears in ${refCount} order line(s). Deleting it will leave those orders without a product reference. Pass ?force=true to confirm.`,
        refCount,
      },
      { status: 422 }
    );
  }

  await db
    .delete(product)
    .where(and(eq(product.id, id), eq(product.businessId, ctx.businessId)));

  return NextResponse.json({ success: true, id, name: existing.name });
}