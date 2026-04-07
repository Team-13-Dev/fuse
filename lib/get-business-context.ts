import { auth } from "./auth";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function getBusinessContext(req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return null;

    let businessId: string | undefined;
    let businessRole: string | undefined;

    const headerId = req.headers.get("x-business-id");
    const headerRole = req.headers.get("x-business-role");

    if (headerId) {
        businessId = headerId;
        businessRole = headerRole || "member";
    } else {
        const cookieStore = await cookies();
        const raw = cookieStore.get("business_ctx")?.value;
        
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                businessId = parsed.businessId;
                businessRole = parsed.role;
            } catch (e) {
                console.error("Failed to parse business_ctx cookie", e);
            }
        }
    }

    if (!businessId) return null;

    return {
        userId: session.user.id,
        businessId: businessId,
        businessRole: businessRole || "member",
        isOwner: businessRole === "owner",
    };
}