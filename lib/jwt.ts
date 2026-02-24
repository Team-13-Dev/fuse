import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "47d4827f3391fa9453df5ebb98894fd2"
);

const JWT_EXPIRY = process.env.JWT_EXPIRY ?? "7d";

export interface JWTUserPayload extends JWTPayload {
  userId: string;
  email: string;
  name: string;
  sessionToken: string;
}

export async function signJWT(payload: Omit<JWTUserPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .setIssuer("nextjs-auth-system")
    .setAudience("nextjs-auth-system")
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "nextjs-auth-system",
      audience: "nextjs-auth-system",
    });
    return payload as JWTUserPayload;
  } catch {
    return null;
  }
}

export function extractJWTFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}