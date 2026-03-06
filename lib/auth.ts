import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

interface AuthUser {
  userId: string;
  email: string;
  role: "admin" | "editor" | "subscriber";
}

// ===== New: getAuthUser (for role-based access control) =====
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("agent-token")?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;
    const validRole = role === "admin" ? "admin" : role === "subscriber" ? "subscriber" : "editor";
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: validRole,
    };
  } catch {
    return null;
  }
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === "admin";
}

export function isSubscriber(user: AuthUser | null): boolean {
  return user?.role === "subscriber";
}

// ===== Existing: requireAuth (backward compatible) =====
export async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("agent-token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.userId as string,
      userId: payload.userId as string,
      email: payload.email as string,
      role: (payload.role as string) || "admin",
    };
  } catch {
    throw new Error("Unauthorized");
  }
}

// ===== signToken (used by login API) =====
export async function signToken(payload: Record<string, unknown>): Promise<string> {
  const { SignJWT } = await import("jose");
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}
