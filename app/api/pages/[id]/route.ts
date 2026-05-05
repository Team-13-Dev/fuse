import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pages, pageBlocks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";

type Params = { params: Promise<{ id: string }> };


const VALID_TYPES = new Set(["header", "hero", "products", "contact", "footer", "testimonials"]);

async function getOwnedPage(pageId: string, businessId: string) {
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.businessId, businessId)))
    .limit(1);
  return page ?? null;
}

// ─── GET /api/pages/[pageId] ──────────────────────────────────────────────────
// Returns page + ordered blocks

export async function GET(req: NextRequest, { params }: Params) {
  console.log("Test");
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  console.log(id);

  const page = await getOwnedPage(id, ctx.businessId);
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const blocks = await db
    .select()
    .from(pageBlocks)
    .where(eq(pageBlocks.pageId, page.id))
    .orderBy(pageBlocks.position);

  return NextResponse.json({ ...page, blocks });
}

// ─── PUT /api/pages/[pageId] ──────────────────────────────────────────────────
// Full replace: wipes existing blocks and inserts the new set.
// Body: { name?, blocks }

export async function PUT(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["owner", "manager"].includes(ctx.businessRole)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  const { id } = await params;
  const page = await getOwnedPage(id, ctx.businessId);
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { name, blocks } = body;

  if (!Array.isArray(blocks)) {
    return NextResponse.json({ error: "blocks array is required" }, { status: 400 });
  }

  for (const b of blocks) {
    if (!b || typeof b !== "object") return NextResponse.json({ error: "Each block must be an object" }, { status: 400 });
    if (!VALID_TYPES.has(b.type)) return NextResponse.json({ error: `Invalid block type: ${b.type}` }, { status: 400 });
    if (typeof b.position !== "number") return NextResponse.json({ error: "Each block requires a numeric position" }, { status: 400 });
  }

  // Atomic: delete old blocks + insert new + optionally rename
  await db.transaction(async (tx) => {
    await tx.delete(pageBlocks).where(eq(pageBlocks.pageId, page.id));

    if (blocks.length > 0) {
      await tx.insert(pageBlocks).values(
        blocks.map((b: any) => ({
          pageId:        page.id,
          type:          b.type,
          position:      b.position,
          accentColor:   b.accentColor   ?? null,
          bgColor:       b.bgColor       ?? null,
          textOverrides: b.textOverrides ?? null,
        }))
      );
    }

    if (name && typeof name === "string" && name.trim()) {
      await tx
        .update(pages)
        .set({ name: (name as string).trim(), updatedAt: new Date() })
        .where(eq(pages.id, page.id));
    } else {
      await tx.update(pages).set({ updatedAt: new Date() }).where(eq(pages.id, page.id));
    }
  });

  const [updated, newBlocks] = await Promise.all([
    db.select().from(pages).where(eq(pages.id, page.id)).limit(1),
    db.select().from(pageBlocks).where(eq(pageBlocks.pageId, page.id)).orderBy(pageBlocks.position),
  ]);

  return NextResponse.json({ ...updated[0], blocks: newBlocks });
}

// ─── PATCH /api/pages/[pageId] ────────────────────────────────────────────────
// Lightweight rename only — no block changes.
// Body: { name }

export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["owner", "manager"].includes(ctx.businessRole)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  const { id } = await params;

  const page = await getOwnedPage(id, ctx.businessId);
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { name } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if ((name as string).trim().length > 255) {
    return NextResponse.json({ error: "Page name must be 255 characters or fewer" }, { status: 400 });
  }

  const [updated] = await db
    .update(pages)
    .set({ name: (name as string).trim(), updatedAt: new Date() })
    .where(eq(pages.id, page.id))
    .returning();

  return NextResponse.json(updated);
}

// ─── DELETE /api/pages/[pageId] ───────────────────────────────────────────────
// Cascade on page_blocks handled by DB foreign key.

export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["owner", "manager"].includes(ctx.businessRole)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  const { id } = await params;

  const page = await getOwnedPage(id, ctx.businessId);
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  await db.delete(pages).where(eq(pages.id, page.id));

  return new NextResponse(null, { status: 204 });
}