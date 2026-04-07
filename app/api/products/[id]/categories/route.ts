import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { product, productCategory, category } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/products/[id]/categories
 * Returns all categories currently assigned to this product (with full category data).
 */
export async function GET(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify product belongs to this business
  const [prod] = await db
    .select({ id: product.id })
    .from(product)
    .where(and(eq(product.id, id), eq(product.businessId, ctx.businessId)));

  if (!prod) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Join product_category with category to get full category rows
  const assignments = await db
    .select({
      assignmentId: productCategory.id,
      assignedAt:   productCategory.assignedAt,
      category: {
        id:          category.id,
        name:        category.name,
        slug:        category.slug,
        description: category.description,
        imageUrl:    category.imageUrl,
        parentId:    category.parentId,
      },
    })
    .from(productCategory)
    .innerJoin(category, eq(productCategory.categoryId, category.id))
    .where(eq(productCategory.productId, id))
    .orderBy(category.name);

  return NextResponse.json(assignments);
}

/**
 * PUT /api/products/[id]/categories
 * Full replace: sets the product's categories to exactly the provided array.
 * Body: { categoryIds: string[] }
 * Roles: owner, manager
 */
export async function PUT(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["owner", "manager"];
  if (!allowed.includes(ctx.businessRole)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  const { id } = await params;

  const [prod] = await db
    .select({ id: product.id })
    .from(product)
    .where(and(eq(product.id, id), eq(product.businessId, ctx.businessId)));

  if (!prod) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { categoryIds } = body;

  if (!Array.isArray(categoryIds)) {
    return NextResponse.json({ error: "categoryIds must be an array" }, { status: 400 });
  }

  const ids = [...new Set((categoryIds as unknown[]).filter(x => typeof x === "string"))] as string[];

  // Validate all provided IDs actually exist in the category table
  if (ids.length > 0) {
    const found = await db
      .select({ id: category.id })
      .from(category)
      .where(inArray(category.id, ids));

    if (found.length !== ids.length) {
      const foundIds = new Set(found.map(r => r.id));
      const missing  = ids.filter(cid => !foundIds.has(cid));
      return NextResponse.json(
        { error: "Some category IDs do not exist", missing },
        { status: 422 }
      );
    }
  }

  // Atomic replace: delete all existing assignments, then insert new ones
  await db.delete(productCategory).where(eq(productCategory.productId, id));

  if (ids.length > 0) {
    await db.insert(productCategory).values(
      ids.map(categoryId => ({ productId: id, categoryId }))
    );
  }

  // Return the new assignment state
  const assignments = await db
    .select({
      assignmentId: productCategory.id,
      assignedAt:   productCategory.assignedAt,
      category: {
        id:          category.id,
        name:        category.name,
        slug:        category.slug,
        description: category.description,
        imageUrl:    category.imageUrl,
        parentId:    category.parentId,
      },
    })
    .from(productCategory)
    .innerJoin(category, eq(productCategory.categoryId, category.id))
    .where(eq(productCategory.productId, id))
    .orderBy(category.name);

  return NextResponse.json(assignments);
}

/**
 * POST /api/products/[id]/categories
 * Additive: append one or more categories without touching existing ones.
 * Body: { categoryIds: string[] }
 * Roles: owner, manager
 */
export async function POST(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["owner", "manager"];
  if (!allowed.includes(ctx.businessRole)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  const { id } = await params;

  const [prod] = await db
    .select({ id: product.id })
    .from(product)
    .where(and(eq(product.id, id), eq(product.businessId, ctx.businessId)));

  if (!prod) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { categoryIds } = body;
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    return NextResponse.json({ error: "categoryIds must be a non-empty array" }, { status: 400 });
  }

  const ids = [...new Set((categoryIds as unknown[]).filter(x => typeof x === "string"))] as string[];

  // Validate existence
  const found = await db
    .select({ id: category.id })
    .from(category)
    .where(inArray(category.id, ids));

  if (found.length !== ids.length) {
    const foundIds = new Set(found.map(r => r.id));
    const missing  = ids.filter(cid => !foundIds.has(cid));
    return NextResponse.json({ error: "Some category IDs do not exist", missing }, { status: 422 });
  }

  // Find which are already assigned (avoid duplicate key violations)
  const existing = await db
    .select({ categoryId: productCategory.categoryId })
    .from(productCategory)
    .where(and(eq(productCategory.productId, id), inArray(productCategory.categoryId, ids)));

  const existingIds = new Set(existing.map(r => r.categoryId));
  const toInsert    = ids.filter(cid => !existingIds.has(cid));

  if (toInsert.length > 0) {
    await db.insert(productCategory).values(
      toInsert.map(categoryId => ({ productId: id, categoryId }))
    );
  }

  return NextResponse.json({
    added:    toInsert.length,
    skipped:  ids.length - toInsert.length,
    message:  `${toInsert.length} categor${toInsert.length === 1 ? "y" : "ies"} assigned`,
  }, { status: 201 });
}

/**
 * DELETE /api/products/[id]/categories
 * Remove specific categories from a product.
 * Body: { categoryIds: string[] }
 * Roles: owner, manager
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["owner", "manager"];
  if (!allowed.includes(ctx.businessRole)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  const { id } = await params;

  const [prod] = await db
    .select({ id: product.id })
    .from(product)
    .where(and(eq(product.id, id), eq(product.businessId, ctx.businessId)));

  if (!prod) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { categoryIds } = body;
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    return NextResponse.json({ error: "categoryIds must be a non-empty array" }, { status: 400 });
  }

  const ids = [...new Set((categoryIds as unknown[]).filter(x => typeof x === "string"))] as string[];

  await db
    .delete(productCategory)
    .where(
      and(
        eq(productCategory.productId, id),
        inArray(productCategory.categoryId, ids)
      )
    );

  return NextResponse.json({ success: true, removed: ids.length });
}