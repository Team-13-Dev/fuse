import { auth } from "./auth";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function getBusinessContext(req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) return null;

    const cookieStore = await cookies();
    const raw = cookieStore.get("business_ctx")?.value;
    const businessCtx = raw ? JSON.parse(raw) : null;

    if (!businessCtx?.businessId) return null;

    return {
    userId: session.user.id,
    businessId: businessCtx.businessId,
    businessRole: businessCtx.role,
    isOwner: businessCtx.role === "owner",
    };
}