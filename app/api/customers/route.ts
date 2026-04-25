import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customer } from "@/db/schema";
import { eq, ilike, and, or, desc, count } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";

// ─── GET /api/customers ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const ctx = await getBusinessContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search  = searchParams.get("search")?.trim()  ?? "";
  const segment = searchParams.get("segment")?.trim() ?? "";
  const page    = Math.max(parseInt(searchParams.get("page")  ?? "1",  10), 1);
  const limit   = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 500);
  const offset  = (page - 1) * limit;

  const conditions = [eq(customer.businessId, ctx.businessId)];

  if (search) {
    conditions.push(
      or(
        ilike(customer.fullName,    `%${search}%`),
        ilike(customer.email,       `%${search}%`),
        ilike(customer.phoneNumber, `%${search}%`),
      )!
    );
  }

  if (segment) conditions.push(eq(customer.segment, segment));

  const where = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db.select().from(customer).where(where).orderBy(desc(customer.id)).limit(limit).offset(offset),
    db.select({ n: count() }).from(customer).where(where),
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
 * POST /api/customers
 * Roles: owner, manager
 * Guards: duplicate email within the same business
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

  const { fullName, email, phoneNumber, segment, clerkId } = body as Record<string, string>;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!fullName?.trim()) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email?.trim() && !emailRegex.test(email.trim())) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const VALID_SEGMENTS = ["VIP", "Regular", "New", "At-risk", "Inactive"];
  if (segment && !VALID_SEGMENTS.includes(segment)) {
    return NextResponse.json({ error: "Invalid segment value" }, { status: 400 });
  }

  // ── Duplicate guard – email must be unique within business ──────────────────
  if (email?.trim()) {
    const [existing] = await db
      .select({ id: customer.id })
      .from(customer)
      .where(
        and(
          eq(customer.businessId, ctx.businessId),
          eq(customer.email, email.trim().toLowerCase()),
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "A customer with this email already exists in your business" },
        { status: 409 }
      );
    }
  }

  // ── Insert ──────────────────────────────────────────────────────────────────
  const [created] = await db
    .insert(customer)
    .values({
      businessId:  ctx.businessId,
      fullName:    fullName.trim(),
      email:       email?.trim().toLowerCase() || null,
      phoneNumber: phoneNumber?.trim() || null,
      segment:     segment?.trim() || null,
      clerkId:     clerkId?.trim() || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}