import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user:         schema.user,
      session:      schema.session,
      account:      schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  user: {
    deleteUser:  { enabled: true },
    changeEmail: { enabled: true },
  },

  // ── Trusted origins ─────────────────────────────────────────────────────────
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    // Keep localhost always trusted for local dev
    "http://localhost:3000",
  ].filter((v, i, a) => a.indexOf(v) === i),

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (
        !ctx.path.startsWith("/sign-in/email") &&
        !ctx.path.startsWith("/get-session")
      ) {
        return;
      }

      const userId = ctx.context.newSession?.user?.id;
      if (!userId) return;

      // 1. Check if user owns any business
      const ownedBusiness = await db
        .select({ id: schema.business.id })
        .from(schema.business)
        .where(eq(schema.business.userId, userId))
        .limit(1);

      if (ownedBusiness.length > 0) {
        ctx.setCookie(
          "business_ctx",
          JSON.stringify({ businessId: ownedBusiness[0].id, role: "owner" }),
          {
            httpOnly: true,
            secure:   process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge:   60 * 60 * 24 * 7,
            path:     "/",
          }
        );
        return;
      }

      // 2. Fallback: check team membership
      const memberBusiness = await db
        .select({
          businessId: schema.teamMember.businessId,
          role:       schema.teamMember.role,
        })
        .from(schema.teamMember)
        .where(eq(schema.teamMember.userId, userId))
        .limit(1);

      if (memberBusiness.length > 0) {
        ctx.setCookie(
          "business_ctx",
          JSON.stringify({
            businessId: memberBusiness[0].businessId,
            role:       memberBusiness[0].role,
          }),
          {
            httpOnly: true,
            secure:   process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge:   60 * 60 * 24 * 7,
            path:     "/",
          }
        );
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
export type User    = typeof auth.$Infer.Session.user;