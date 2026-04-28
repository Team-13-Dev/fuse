import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { product } from "@/db/schema";
import { eq, ilike, and, or, lte, gt, desc, count } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";
import { triggerProductSegmentation } from "@/lib/segmentation/trigger-product";

// ─── GET /api/products ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const stock  = searchParams.get("stock")?.trim()  ?? "";
  const page   = Math.max(parseInt(searchParams.get("page")  ?? "1",  10), 1);
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 500);
  const offset = (page - 1) * limit;

  const conditions = [eq(product.businessId, ctx.businessId)];

  if (search) {
    conditions.push(
      or(
        ilike(product.name,        `%${search}%`),
        ilike(product.description, `%${search}%`),
      )!
    );
  }

  if (stock === "out") {
    conditions.push(eq(product.stock, 0));
  } else if (stock === "low") {
    conditions.push(and(gt(product.stock, 0), lte(product.stock, 10))!);
  } else if (stock === "ok") {
    conditions.push(gt(product.stock, 10));
  }

  const where = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db.select().from(product).where(where).orderBy(desc(product.id)).limit(limit).offset(offset),
    db.select({ n: count() }).from(product).where(where),
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
}

/**
 * POST /api/products
 * Roles: owner, manager
 *
 * Side effect: fires `triggerProductSegmentation(businessId, "auto:threshold")`
 * fire-and-forget. The pipeline checks thresholds and only re-runs the model
 * if enough has changed since the last run.
 */
export async function POST(req: NextRequest) {
  const ctx = await getBusinessContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = ["owner", "manager"];
  if (!allowed.includes(ctx.businessRole)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, price, description, stock, cost, imagesUrl } = body;

  // ── Name ────────────────────────────────────────────────────────────────────
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 });
  }
  if ((name as string).trim().length > 255) {
    return NextResponse.json({ error: "Product name must be 255 characters or fewer" }, { status: 400 });
  }

  // ── Price ───────────────────────────────────────────────────────────────────
  const priceNum = Number(price);
  if (price === undefined || price === null || price === "" || isNaN(priceNum)) {
    return NextResponse.json({ error: "A valid price is required" }, { status: 400 });
  }
  if (priceNum < 0) {
    return NextResponse.json({ error: "Price cannot be negative" }, { status: 400 });
  }
  if (priceNum > 999_999_999.99) {
    return NextResponse.json({ error: "Price exceeds maximum allowed value" }, { status: 400 });
  }

  // ── Stock ───────────────────────────────────────────────────────────────────
  const rawStock = stock !== undefined && stock !== "" && stock !== null
    ? Number(stock)
    : 0;
  if (isNaN(rawStock) || !Number.isInteger(rawStock) || rawStock < 0) {
    return NextResponse.json({ error: "Stock must be a non-negative whole number" }, { status: 400 });
  }

  // ── Cost ────────────────────────────────────────────────────────────────────
  let costStr: string | null = null;
  if (cost !== undefined && cost !== null && cost !== "") {
    const costNum = Number(cost);
    if (isNaN(costNum) || costNum < 0) {
      return NextResponse.json({ error: "Cost must be non-negative" }, { status: 400 });
    }
    costStr = costNum.toFixed(2);
  }

  const [created] = await db
    .insert(product)
    .values({
      businessId:  ctx.businessId,
      name:        (name as string).trim(),
      price:       priceNum.toFixed(2),
      description: typeof description === "string" ? description.trim() || null : null,
      stock:       rawStock,
      cost:        costStr,
      imagesUrl:   Array.isArray(imagesUrl) ? imagesUrl : null,
      // createdAt / updatedAt default to NOW() via Drizzle defaultNow()
    })
    .returning();

  // Fire-and-forget — never blocks the response.
  triggerProductSegmentation(ctx.businessId, "auto:threshold");

  return NextResponse.json(created, { status: 201 });
}