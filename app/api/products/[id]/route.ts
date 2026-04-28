import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { product, orderItem, order } from "@/db/schema";
import { eq, and, count, max } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";
import { triggerProductSegmentation } from "@/lib/segmentation/trigger-product";

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
    .select({
      id:    product.id,
      price: product.price,
      cost:  product.cost,
      stock: product.stock,
    })
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

  const patch: Record<string, unknown> = {};
  if (name        !== undefined) patch.name        = String(name).trim();
  if (price       !== undefined) patch.price       = String(Number(price).toFixed(2));
  if (description !== undefined) patch.description = typeof description === "string"
    ? description.trim() || null
    : null;
  if (stock       !== undefined) patch.stock       = stock !== "" && stock !== null ? Number(stock) : 0;
  if (cost        !== undefined) patch.cost        = cost !== "" && cost !== null ? String(Number(cost).toFixed(2)) : null;
  if (imagesUrl   !== undefined) patch.imagesUrl   = imagesUrl;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Always bump updatedAt — this is the signal the segmentation trigger reads.
  patch.updatedAt = new Date();

  const [updated] = await db
    .update(product)
    .set(patch)
    .where(and(eq(product.id, id), eq(product.businessId, ctx.businessId)))
    .returning();

  // Only fire the trigger when a CLUSTER-AFFECTING field actually changed.
  // The ML pipeline uses: price, cost, stock (via absolute_margin and stock_turnover).
  // Skipping name/description/image edits saves a needless pipeline ping.
  const clusterFieldsChanged =
    (price       !== undefined && Number(price)  !== Number(existing.price)) ||
    (cost        !== undefined && String(cost ?? "") !== String(existing.cost ?? "")) ||
    (stock       !== undefined && Number(stock ?? 0) !== Number(existing.stock ?? 0));

  if (clusterFieldsChanged) {
    triggerProductSegmentation(ctx.businessId, "auto:threshold");
  }

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

  // A delete removes a product from the catalog — definitely cluster-affecting.
  triggerProductSegmentation(ctx.businessId, "auto:threshold");

  return NextResponse.json({ success: true, id, name: existing.name });
}