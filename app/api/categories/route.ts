import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { category, productCategory } from "@/db/schema";
import { eq, isNull, ilike, and, or } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";

// ─── Slug helper ──────────────────────────────────────────────────────────────
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * GET /api/categories
 * Returns the full category tree (roots + their children + grandchildren).
 * Query params:
 *   search  – fuzzy filter on name
 *   flat    – "true" returns a flat array instead of a nested tree
 */
export async function GET(req: NextRequest) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const flat   = searchParams.get("flat") === "true";

  // Fetch all categories in one query, build tree in JS
  const conditions = search
    ? [or(ilike(category.name, `%${search}%`), ilike(category.description, `%${search}%`))!]
    : [];

  const all = await db
    .select()
    .from(category)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(category.name);

  if (flat) return NextResponse.json(all);

  // Build nested tree: root nodes first, then attach children recursively
  type CatRow = typeof all[number];
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
 * Creates a new category. If parentId is provided, validates it exists and
 * that it won't exceed 3 levels of nesting (grandparent → parent → child).
 */
export async function POST(req: NextRequest) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["owner", "manager"];
  if (!allowed.includes(ctx.businessRole)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { name, parentId, description, imageUrl } = body;

  // ── Validation ───────────────────────────────────────────────────────────
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }
  if ((name as string).trim().length > 100) {
    return NextResponse.json({ error: "Category name must be 100 characters or fewer" }, { status: 400 });
  }

  // Generate slug and ensure uniqueness
  let slug = slugify((name as string).trim());
  if (!slug) return NextResponse.json({ error: "Could not generate a valid slug from the name" }, { status: 400 });

  const [slugConflict] = await db
    .select({ id: category.id })
    .from(category)
    .where(eq(category.slug, slug))
    .limit(1);

  if (slugConflict) {
    // Append a short random suffix to keep slug unique
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  // ── Parent validation & depth check ──────────────────────────────────────
  if (parentId !== undefined && parentId !== null && parentId !== "") {
    if (typeof parentId !== "string") {
      return NextResponse.json({ error: "parentId must be a UUID string" }, { status: 400 });
    }

    const [parent] = await db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.id, parentId as string))
      .limit(1);

    if (!parent) {
      return NextResponse.json({ error: "Parent category not found" }, { status: 404 });
    }
    // No depth limit — sub-categories are unbounded (Shopify-style).
    // Circular reference cannot happen on create because the new record
    // doesn't exist yet.
  }

  const [created] = await db
    .insert(category)
    .values({
      name:        (name as string).trim(),
      slug,
      parentId:    (parentId as string | null) || null,
      description: description && typeof description === "string" ? description.trim() || null : null,
      imageUrl:    imageUrl && typeof imageUrl === "string"    ? imageUrl.trim()  || null : null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}