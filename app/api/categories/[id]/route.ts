import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { category, productCategory } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/categories/[id] ─────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing category ID" }, { status: 400 });

  // Scoped to business
  const [row] = await db
    .select()
    .from(category)
    .where(and(eq(category.id, id), eq(category.businessId, ctx.businessId)));

  if (!row) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  // Direct children (also scoped — they must share the same businessId)
  const children = await db
    .select()
    .from(category)
    .where(and(eq(category.parentId, id), eq(category.businessId, ctx.businessId)))
    .orderBy(category.name);

  // Product count for this category
  const [pcStats] = await db
    .select({ productCount: count() })
    .from(productCategory)
    .where(eq(productCategory.categoryId, id));

  return NextResponse.json({
    ...row,
    children,
    productCount: Number(pcStats?.productCount ?? 0),
  });
}

// ─── PATCH /api/categories/[id] ──────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["owner", "manager"].includes(ctx.businessRole)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing category ID" }, { status: 400 });

  const [existing] = await db
    .select({ id: category.id, parentId: category.parentId })
    .from(category)
    .where(and(eq(category.id, id), eq(category.businessId, ctx.businessId)));

  if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { name, parentId, description, imageUrl } = body;

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim())
      return NextResponse.json({ error: "Category name cannot be empty" }, { status: 400 });
    if ((name as string).trim().length > 100)
      return NextResponse.json({ error: "Category name must be 100 characters or fewer" }, { status: 400 });
  }

  // Parent validation — must belong to same business, no cycles
  if (parentId !== undefined && parentId !== null && parentId !== "") {
    if (parentId === id)
      return NextResponse.json({ error: "A category cannot be its own parent" }, { status: 422 });

    // Parent must exist within this business
    const [parent] = await db
      .select({ id: category.id })
      .from(category)
      .where(and(eq(category.id, parentId as string), eq(category.businessId, ctx.businessId)))
      .limit(1);

    if (!parent) return NextResponse.json({ error: "Parent category not found" }, { status: 404 });

    // Cycle guard: walk ancestor chain in memory
    const allCats = await db
      .select({ id: category.id, parentId: category.parentId })
      .from(category)
      .where(eq(category.businessId, ctx.businessId));

    const parentMap = new Map(allCats.map(c => [c.id, c.parentId]));
    let cursor: string | null = parentId as string;
    while (cursor) {
      if (cursor === id)
        return NextResponse.json({ error: "Circular category reference detected" }, { status: 422 });
      cursor = parentMap.get(cursor) ?? null;
    }
  }

  const patch: Record<string, unknown> = {};
  if (name        !== undefined) patch.name        = (name as string).trim();
  if (parentId    !== undefined) patch.parentId    = (parentId as string | null) || null;
  if (description !== undefined) patch.description = description && typeof description === "string" ? description.trim() || null : null;
  if (imageUrl    !== undefined) patch.imageUrl    = imageUrl    && typeof imageUrl    === "string" ? imageUrl.trim()    || null : null;

  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const [updated] = await db
    .update(category)
    .set(patch)
    .where(and(eq(category.id, id), eq(category.businessId, ctx.businessId)))
    .returning();

  return NextResponse.json(updated);
}

// ─── DELETE /api/categories/[id] ──────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!ctx.isOwner)
    return NextResponse.json({ error: "Forbidden: only business owners can delete categories" }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing category ID" }, { status: 400 });

  const [existing] = await db
    .select({ id: category.id, name: category.name })
    .from(category)
    .where(and(eq(category.id, id), eq(category.businessId, ctx.businessId)));

  if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  // Children within this business
  const children = await db
    .select({ id: category.id })
    .from(category)
    .where(and(eq(category.parentId, id), eq(category.businessId, ctx.businessId)));

  const [pcStats] = await db
    .select({ productCount: count() })
    .from(productCategory)
    .where(eq(productCategory.categoryId, id));

  const childCount   = children.length;
  const productCount = Number(pcStats?.productCount ?? 0);
  const force        = new URL(req.url).searchParams.get("force") === "true";

  if ((childCount > 0 || productCount > 0) && !force) {
    return NextResponse.json(
      {
        error:        "Category has dependents",
        detail:       `This category has ${childCount} sub-categor${childCount === 1 ? "y" : "ies"} and is used by ${productCount} product(s). Pass ?force=true to confirm.`,
        childCount,
        productCount,
      },
      { status: 422 }
    );
  }

  await db
    .delete(category)
    .where(and(eq(category.id, id), eq(category.businessId, ctx.businessId)));

  return NextResponse.json({ success: true, id, name: existing.name });
}