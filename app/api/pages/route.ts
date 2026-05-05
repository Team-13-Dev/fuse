import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pages, pageBlocks } from "@/db/schema";
import { eq, and, ilike, count, desc } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";

// ─── GET /api/pages ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const page   = Math.max(parseInt(searchParams.get("page")  ?? "1",  10), 1);
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = (page - 1) * limit;

  const conditions = [eq(pages.businessId, ctx.businessId)];
  if (search) conditions.push(ilike(pages.name, `%${search}%`));

  const where = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db.select().from(pages).where(where).orderBy(desc(pages.updatedAt)).limit(limit).offset(offset),
    db.select({ n: count() }).from(pages).where(where),
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

// ─── POST /api/pages ──────────────────────────────────────────────────────────
// Roles: owner, manager
// Body: { name, blocks? }
// blocks: { type, position, accentColor?, bgColor?, textOverrides? }[]

export async function POST(req: NextRequest) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["owner", "manager"].includes(ctx.businessRole)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { name, blocks } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Page name is required" }, { status: 400 });
  }
  if ((name as string).trim().length > 255) {
    return NextResponse.json({ error: "Page name must be 255 characters or fewer" }, { status: 400 });
  }

  const VALID_TYPES = new Set(["header", "hero", "products", "contact", "footer", "testimonials"]);

  // Validate blocks if provided
  const rawBlocks = Array.isArray(blocks) ? blocks : [];
  for (const b of rawBlocks) {
    if (!b || typeof b !== "object") return NextResponse.json({ error: "Each block must be an object" }, { status: 400 });
    if (!VALID_TYPES.has(b.type)) return NextResponse.json({ error: `Invalid block type: ${b.type}` }, { status: 400 });
    if (typeof b.position !== "number") return NextResponse.json({ error: "Each block requires a numeric position" }, { status: 400 });
  }

  const [created] = await db
    .insert(pages)
    .values({ businessId: ctx.businessId, name: (name as string).trim() })
    .returning();

  if (rawBlocks.length > 0) {
    await db.insert(pageBlocks).values(
      rawBlocks.map((b: any) => ({
        pageId:        created.id,
        type:          b.type,
        position:      b.position,
        accentColor:   b.accentColor   ?? null,
        bgColor:       b.bgColor       ?? null,
        textOverrides: b.textOverrides ?? null,
      }))
    );
  }

  // Return page + blocks in one shot
  const blockRows = rawBlocks.length > 0
    ? await db.select().from(pageBlocks).where(eq(pageBlocks.pageId, created.id)).orderBy(pageBlocks.position)
    : [];

  return NextResponse.json({ ...created, blocks: blockRows }, { status: 201 });
}