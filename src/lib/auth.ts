import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cache } from "react";
import type { Role } from "@prisma/client";
import { db } from "./db";

export const SESSION_COOKIE = "gym_session";
const SESSION_DAYS = 7;

export type Session = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET must be set (16+ chars)");
  return new TextEncoder().encode(s);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: Session) {
  const token = await new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function readSessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: (payload.role as Role) ?? "MEMBER",
    };
  } catch {
    return null;
  }
}

/** Session from the cookie (JWT only; no DB hit). */
export const getSession = cache(async (): Promise<Session | null> => {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
});

/** Session verified against the database (user still exists and is active). */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.id },
    include: { trainerProfile: true },
  });
  if (!user || !user.active) return null;
  return user;
});

export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    // A valid cookie whose user was deleted/deactivated would otherwise loop between /login and the app.
    const session = await getSession();
    redirect(session ? "/api/auth/signout" : "/login");
  }
  if (roles && !roles.includes(user.role) && user.role !== "SUPERADMIN") redirect("/dashboard");
  return user;
}

export function isAdminRole(role: Role) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export function isStaff(role: Role) {
  return role === "ADMIN" || role === "SUPERADMIN" || role === "TRAINER";
}

export function generateMemberCode() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `IP-${n}`;
}
