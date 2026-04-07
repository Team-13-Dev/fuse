import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { product } from "@/db/schema";
import { eq, ilike, and, or, lte, gt, desc } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";

/**
 * GET /api/products
 * Query params:
 *   search  – fuzzy match on name OR description
 *   stock   – "out" (qty=0) | "low" (qty 1-10) | "ok" (qty>10)
 *   limit   – default 100, max 500
 *   offset  – default 0
 */
export async function GET(req: NextRequest) {
  const ctx = await getBusinessContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const stock  = searchParams.get("stock")?.trim()  ?? "";
  const limit  = Math.min(parseInt(searchParams.get("limit")  ?? "100", 10), 500);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0",   10), 0);

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

  const rows = await db
    .select()
    .from(product)
    .where(and(...conditions))
    .orderBy(desc(product.id))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(rows);
}

/**
 * POST /api/products
 * Roles: owner, manager
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
  const rawStock = stock !== undefined && stock !== "" && stock !== null ? Number(stock) : 0;
  if (isNaN(rawStock) || !Number.isInteger(rawStock)) {
    return NextResponse.json({ error: "Stock must be a whole number" }, { status: 400 });
  }
  if (rawStock < 0) {
    return NextResponse.json({ error: "Stock cannot be negative" }, { status: 400 });
  }

  // ── Cost ────────────────────────────────────────────────────────────────────
  let costNum: number | null = null;
  if (cost !== undefined && cost !== "" && cost !== null) {
    costNum = Number(cost);
    if (isNaN(costNum)) {
      return NextResponse.json({ error: "Cost must be a valid number" }, { status: 400 });
    }
    if (costNum < 0) {
      return NextResponse.json({ error: "Cost cannot be negative" }, { status: 400 });
    }
  }

  // ── imagesUrl ───────────────────────────────────────────────────────────────
  if (imagesUrl !== undefined && imagesUrl !== null && !Array.isArray(imagesUrl)) {
    return NextResponse.json({ error: "imagesUrl must be an array of URLs" }, { status: 400 });
  }

  const [created] = await db
    .insert(product)
    .values({
      businessId:  ctx.businessId,
      name:        (name as string).trim(),
      price:       String(priceNum.toFixed(2)),
      description: description && typeof description === "string" ? description.trim() || null : null,
      stock:       rawStock,
      cost:        costNum !== null ? String(costNum.toFixed(2)) : null,
      imagesUrl:   (imagesUrl as string[] | null) ?? null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}