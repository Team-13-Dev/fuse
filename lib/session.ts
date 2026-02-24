import { auth } from "@/lib/auth";
import { cache, cacheKeys } from "@/lib/redis";
import { verifyJWT } from "@/lib/jwt";
import { headers, cookies } from "next/headers";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
};

export type AuthSession = {
  user: SessionUser;
  session: {
    token: string;
    expiresAt: Date;
  };
} | null;


export async function getAuthSession(): Promise<AuthSession> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("auth.session_token")?.value;

  if (sessionToken) {
    const cached = await cache.get<AuthSession>(cacheKeys.session(sessionToken));
    if (cached) return cached;
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const authSession: AuthSession = {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      createdAt: new Date(session.user.createdAt),
    },
    session: {
      token: session.session.token,
      expiresAt: new Date(session.session.expiresAt),
    },
  };

  if (sessionToken) {
    const ttl = Math.floor(
      (new Date(session.session.expiresAt).getTime() - Date.now()) / 1000
    );
    if (ttl > 0) {
      await cache.set(cacheKeys.session(sessionToken), authSession, ttl);
    }
  }

  return authSession;
}


export async function getSessionFromJWT(token: string): Promise<AuthSession> {
  const payload = await verifyJWT(token);
  if (!payload) return null;

  const cached = await cache.get<AuthSession>(cacheKeys.session(payload.sessionToken));
  if (cached) return cached;

  const users = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, payload.userId))
    .limit(1);

  if (!users[0]) return null;

  return {
    user: {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email,
      emailVerified: users[0].emailVerified,
      createdAt: users[0].createdAt,
    },
    session: {
      token: payload.sessionToken,
      expiresAt: new Date(payload.exp! * 1000),
    },
  };
}

function assertSession(
  session: AuthSession
): asserts session is NonNullable<AuthSession> {
  if (!session) {
    redirect("/sign-in");
  }
}

export async function requireAuth(): Promise<NonNullable<AuthSession>> {
  const session = await getAuthSession();

  assertSession(session);

  return session;
}