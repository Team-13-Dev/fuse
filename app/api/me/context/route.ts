import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { business, teamMember } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";
import { auth } from "@/lib/auth";

/**
 * GET /api/me/context
 *
 * Single endpoint.
 * Uses getBusinessContext to read the active business from the business_ctx
 * cookie, then fetches the full user profile and all accessible businesses
 * in one round-trip.
 *
 * Returns:
 * {
 *   user:             { id, name, email }
 *   activeBusinessId: string
 *   role:             string
 *   isOwner:          boolean
 *   businesses:       { id, name, tenantSlug, industry, role }[]
 * }
 */
export async function GET(req: NextRequest) {
  // 1. Read the active business context from the httpOnly cookie
  const ctx = await getBusinessContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Get the full session to read user profile
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = ctx.userId;

  // 3. Fetch all businesses owned by the user
  const owned = await db
    .select({
      id:         business.id,
      name:       business.name,
      tenantSlug: business.tenantSlug,
      industry:   business.industry,
    })
    .from(business)
    .where(eq(business.userId, userId));

  const ownedWithRole = owned.map(b => ({ ...b, role: "owner" }));

  // 4. Fetch businesses where user is a team member
  const memberships = await db
    .select({
      id:         business.id,
      name:       business.name,
      tenantSlug: business.tenantSlug,
      industry:   business.industry,
      role:       teamMember.role,
    })
    .from(teamMember)
    .innerJoin(business, eq(teamMember.businessId, business.id))
    .where(eq(teamMember.userId, userId));

  // 5. Deduplicate — owned takes priority over membership
  const ownedIds  = new Set(ownedWithRole.map(b => b.id));
  const memberOnly = memberships.filter(b => !ownedIds.has(b.id));

  const allBusinesses = [...ownedWithRole, ...memberOnly];

  return NextResponse.json({
    user: {
      id:    session.user.id,
      name:  session.user.name,
      email: session.user.email,
    },
    activeBusinessId: ctx.businessId,
    role:             ctx.businessRole,
    isOwner:          ctx.isOwner,
    businesses:       allBusinesses,
  });
}