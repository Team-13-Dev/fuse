import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const result = await auth.api.signInEmail({
      body: { email, password },
    });

    const userId = result.user.id;

    let business = await db
      .select({ id: schema.business.id })
      .from(schema.business)
      .where(eq(schema.business.userId, userId))
      .limit(1);

    let businessData = null;

    if (business.length > 0) {
      businessData = { businessId: business[0].id, role: "owner" };
    } else {
      const member = await db
        .select({
          businessId: schema.teamMember.businessId,
          role: schema.teamMember.role,
        })
        .from(schema.teamMember)
        .where(eq(schema.teamMember.userId, userId))
        .limit(1);

      if (member.length > 0) {
        businessData = { 
          businessId: member[0].businessId, 
          role: member[0].role 
        };
      }
    }

    return NextResponse.json({
      user: result.user,
      token: result.token,
      business: businessData,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Invalid credentials" },
      { status: 401 }
    );
  }
}