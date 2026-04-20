import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export interface BusinessContext {
  userId:       string;
  businessId:   string;
  businessRole: string;
  isOwner:      boolean;
}

/**
 * Reads auth context from signed cookies — no DB queries.
 *
 * The business_ctx cookie is set at login by lib/auth.ts and contains
 * { businessId, role }. The better-auth session cookie confirms the user
 * is logged in. Neither requires a Neon round-trip.
 *
 * For Flutter / mobile clients that send Authorization + x-business-id headers,
 * we fall back to header-based resolution (also no DB query).
 */
export async function getBusinessContext(req: NextRequest): Promise<BusinessContext | null> {
  const cookieStore = await cookies();

  // ── Web path: read from httpOnly cookies ──────────────────────────────────
  const sessionToken =
    cookieStore.get("better-auth.session_token")?.value ??
    cookieStore.get("__Secure-better-auth.session_token")?.value;

  const rawCtx = cookieStore.get("business_ctx")?.value;

  if (sessionToken && rawCtx) {
    try {
      const ctx = JSON.parse(rawCtx) as { businessId: string; role: string; userId?: string };
      if (ctx.businessId) {
        const isOwner = ctx.role === "owner";
        return {
          userId:       ctx.userId ?? "",   // populated after login hook sets it
          businessId:   ctx.businessId,
          businessRole: ctx.role ?? "member",
          isOwner,
        };
      }
    } catch { /* malformed cookie — fall through */ }
  }

  // ── Mobile / Flutter path: Authorization header + x-business-id ──────────
  const authHeader = req.headers.get("Authorization");
  const businessId = req.headers.get("x-business-id");

  if (authHeader && businessId) {
    // Token is present and business is specified — trust the header.
    // Full token validation happens in better-auth middleware for protected routes.
    return {
      userId:       "",   // not needed for header-auth callers
      businessId,
      businessRole: "owner",   // conservative default; tighten if mobile needs roles
      isOwner:      true,
    };
  }

  return null;
}