import { auth } from "./auth";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { session, user, teamMember, business } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getBusinessContext(req: NextRequest) {
    let sessionData = await auth.api.getSession({ headers: req.headers });

    if (!sessionData) {
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.startsWith("Bearer ") 
            ? authHeader.substring(7) 
            : authHeader;        

        if (token) {
            const cleanToken = token.substring(7).trim()
            const dbSession = await db.query.session.findFirst({
                where: eq(session.token, cleanToken),
                with: { user: true },
            });

            if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
                sessionData = { user: dbSession.user, session: dbSession } as any;
            }
        }
    }

    if (!sessionData) return null;

    const userId = sessionData.user.id;

    // 2. Resolve Business ID (Header for Flutter, Cookie for Web)
    const headerId = req.headers.get("x-business-id");
    let businessId: string | null = headerId;

    if (!businessId) {
        const cookieStore = await cookies();
        const raw = cookieStore.get("business_ctx")?.value;
        businessId = raw ? JSON.parse(raw).businessId : null;
    }

    if (!businessId) return null;

    // 3. SECURE VALIDATION: Ensure user actually belongs to this business
    // Check if owner
    const isOwner = await db.query.business.findFirst({
        where: and(eq(business.id, businessId), eq(business.userId, userId))
    });

    // Check if team member
    const membership = !isOwner ? await db.query.teamMember.findFirst({
        where: and(eq(teamMember.businessId, businessId), eq(teamMember.userId, userId))
    }) : null;

    if (!isOwner && !membership) return null;

    return {
        userId,
        businessId,
        businessRole: isOwner ? "owner" : (membership?.role || "member"),
        isOwner: !!isOwner,
    };
}