import { db } from "@/db";
import { business, teamMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessContext } from "@/lib/get-business-context";

export async function POST(req: NextRequest) {
  const ctx = await getBusinessContext(req);

  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = await req.json();
  const userId = ctx.userId;

  const ownedBusiness = await db
    .select({ id: business.id })
    .from(business)
    .where(and(eq(business.id, businessId), eq(business.userId, userId)))
    .limit(1);

  const memberBusiness = await db
    .select({ role: teamMember.role })
    .from(teamMember)
    .where(
      and(
        eq(teamMember.businessId, businessId),
        eq(teamMember.userId, userId)
      )
    )
    .limit(1);

  if (!ownedBusiness.length && !memberBusiness.length) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const role = ownedBusiness.length ? "owner" : memberBusiness[0].role;

  const response = NextResponse.json({ success: true });

  response.cookies.set("business_ctx", JSON.stringify({ userId, businessId, role }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}