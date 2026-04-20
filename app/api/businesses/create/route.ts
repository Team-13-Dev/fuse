import { db } from "@/db";
import { business } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessContext } from "@/lib/get-business-context";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  // Read userId from the existing business_ctx cookie — no DB session query
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("better-auth.session_token")?.value ??
    cookieStore.get("__Secure-better-auth.session_token")?.value;
  const rawCtx = cookieStore.get("business_ctx")?.value;

  if (!sessionToken || !rawCtx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: string;
  try {
    const ctx = JSON.parse(rawCtx) as { userId?: string };
    if (!ctx.userId) throw new Error("no userId");
    userId = ctx.userId;
  } catch {
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
    .values({ userId, name, tenantSlug, industry, location })
    .returning();

  const response = NextResponse.json({ data: newBusiness[0] }, { status: 201 });

  response.cookies.set(
    "business_ctx",
    JSON.stringify({ userId, businessId: newBusiness[0].id, role: "owner" }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    }
  );

  return response;
}