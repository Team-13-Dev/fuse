import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { business, teamMember } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";
import { user } from "@/db/schema";

export async function GET(req: NextRequest) {
  // 1. Read the active business context from the httpOnly cookie
  const ctx = await getBusinessContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Get user profile from DB (one query, no better-auth overhead)
  const [userRow] = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, ctx.userId))
    .limit(1);

  if (!userRow) {
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
      id:    userRow.id,
      name:  userRow.name,
      email: userRow.email,
    },
    activeBusinessId: ctx.businessId,
    role:             ctx.businessRole,
    isOwner:          ctx.isOwner,
    businesses:       allBusinesses,
  });
}