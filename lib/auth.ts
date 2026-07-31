import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "candron-dev-secret-key-please-change-in-production-0192837465"
);
export const SESSION_COOKIE = "candron_session";

export interface SessionUser {
  id: string;
  tenantId: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  accessLevel: string;
  email: string;
}

export async function createSession(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  const token = await new SignJWT({ uid: user.id, tid: user.tenantId, lvl: user.accessLevel })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function verifyToken(token: string): Promise<{ uid: string; tid: string; lvl: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as { uid: string; tid: string; lvl: string };
  } catch {
    return null;
  }
}

/** Current signed-in user (cached per request). Null if not authenticated. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user) return null;
  return {
    id: user.id, tenantId: user.tenantId, name: user.name, initials: user.initials,
    role: user.role, department: user.department, accessLevel: user.accessLevel, email: user.email,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) throw new Error("Not authenticated");
  return u;
}

/** Tenant id of the current session (falls back to first tenant for safety). */
export const currentTenantId = cache(async (): Promise<string> => {
  const u = await getCurrentUser();
  if (u) return u.tenantId;
  const t = await prisma.tenant.findFirst({ select: { id: true } });
  return t?.id ?? "T-CANDRON";
});
