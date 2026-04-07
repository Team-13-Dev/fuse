import { NextRequest, NextResponse } from "next/server";
import { getBusinessContext } from "@/lib/get-business-context";

export async function GET(req: NextRequest) {
  const ctx = await getBusinessContext(req);
  if (!ctx) {
    return NextResponse.json({ role: null, businessId: null, isOwner: false }, { status: 401 });
  }
  return NextResponse.json({
    role:       ctx.businessRole,
    businessId: ctx.businessId,
    isOwner:    ctx.isOwner,
  });
}