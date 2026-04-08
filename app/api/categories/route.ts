import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { category } from "@/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";

function slugify(name: string): string {
  return name
    .toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * GET /api/categories
 * Returns the category tree scoped to the active business.
 * ?search= — fuzzy filter on name / description
 * ?flat=true — flat array instead of nested tree
 */
export async function GET(req: NextRequest) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const flat   = searchParams.get("flat") === "true";

  const conditions = [eq(category.businessId, ctx.businessId)];
  if (search) {
    conditions.push(
      or(
        ilike(category.name,        `%${search}%`),
        ilike(category.description, `%${search}%`),
      )!
    );
  }

  const all = await db
    .select()
    .from(category)
    .where(and(...conditions))
    .orderBy(category.name);

  if (flat) return NextResponse.json(all);

  // Build nested tree in JS
  type CatRow  = typeof all[number];
  type CatNode = CatRow & { children: CatNode[] };

  const map = new Map<string, CatNode>();
  all.forEach(c => map.set(c.id, { ...c, children: [] }));

  const roots: CatNode[] = [];
  map.forEach(node => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return NextResponse.json(roots);
}

/**
 * POST /api/categories
 * Roles: owner, manager
 */
export async function POST(req: NextRequest) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["owner", "manager"].includes(ctx.businessRole)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { name, parentId, description, imageUrl } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }
  if ((name as string).trim().length > 100) {
    return NextResponse.json({ error: "Category name must be 100 characters or fewer" }, { status: 400 });
  }

  // Slug unique within this business only
  let slug = slugify((name as string).trim());
  if (!slug) return NextResponse.json({ error: "Could not generate a valid slug from the name" }, { status: 400 });

  const [slugConflict] = await db
    .select({ id: category.id })
    .from(category)
    .where(and(eq(category.businessId, ctx.businessId), eq(category.slug, slug)))
    .limit(1);

  if (slugConflict) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  // Parent must belong to the same business
  if (parentId !== undefined && parentId !== null && parentId !== "") {
    if (typeof parentId !== "string") {
      return NextResponse.json({ error: "parentId must be a UUID string" }, { status: 400 });
    }
    const [parent] = await db
      .select({ id: category.id })
      .from(category)
      .where(and(eq(category.id, parentId), eq(category.businessId, ctx.businessId)))
      .limit(1);

    if (!parent) return NextResponse.json({ error: "Parent category not found" }, { status: 404 });
  }

  const [created] = await db
    .insert(category)
    .values({
      businessId:  ctx.businessId,
      name:        (name as string).trim(),
      slug,
      parentId:    (parentId as string | null) || null,
      description: description && typeof description === "string" ? description.trim() || null : null,
      imageUrl:    imageUrl    && typeof imageUrl    === "string" ? imageUrl.trim()    || null : null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}