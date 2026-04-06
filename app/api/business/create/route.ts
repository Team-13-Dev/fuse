import { db } from "@/db";
import { business } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, tenantSlug, industry, location } = await req.json();

  if (!name || !tenantSlug) {
    return NextResponse.json(
      { error: "Name and tenant slug are required" },
      { status: 400 }
    );
  }

  const newBusiness = await db
    .insert(business)
    .values({
      userId: session.user.id,
      name,
      tenantSlug,
      industry,
      location,
    })
    .returning();

  const response = NextResponse.json({ data: newBusiness[0] }, { status: 201 });

  // Set the new business as the active business
  response.cookies.set(
    "business_ctx",
    JSON.stringify({ businessId: newBusiness[0].id, role: "owner" }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    }
  );

  return response;
}