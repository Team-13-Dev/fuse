import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { business, teamMember } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

/**
 * GET /api/business
 * Returns all businesses the authenticated user owns or is a team member of,
 * each with their effective role attached.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // 1. Businesses the user owns
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

  // 2. Businesses where the user is a team member
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

  // 3. Deduplicate — owned takes priority
  const ownedIds = new Set(ownedWithRole.map(b => b.id));
  const memberOnly = memberships.filter(b => !ownedIds.has(b.id));

  return NextResponse.json([...ownedWithRole, ...memberOnly]);
}