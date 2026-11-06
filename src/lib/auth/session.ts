import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/tokens";

const COOKIE = "kns_session";
const DAY = 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  studentId: string | null;
  role: Role;
  emailVerified: boolean;
};
export type Session = { sessionId: string; user: SessionUser };

export async function createSession(userId: string, remember: boolean): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + (remember ? 30 : 1) * DAY);
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember ? { expires: expiresAt } : {}),
  });
}

export const getSession = cache(async (): Promise<Session | null> => {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const row = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!row || row.expiresAt < new Date() || row.user.status !== "ACTIVE") return null;
  const u = row.user;
  return {
    sessionId: row.id,
    user: { id: u.id, name: u.name, email: u.email, phone: u.phone, studentId: u.studentId, role: u.role, emailVerified: Boolean(u.emailVerifiedAt) },
  };
});

export async function destroySession(): Promise<void> {
  const token = cookies().get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookies().delete(COOKIE);
}

export async function destroyUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
  await db.session.deleteMany({ where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) } });
}

/** For pages: redirects anonymous visitors to the login screen. */
export async function requireUser(nextPath: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return session;
}

/** For server actions: returns the session only for an authorised administrator, otherwise null. Never trust client checks. */
export async function getAdminSession(): Promise<Session | null> {
  const session = await getSession();
  return session && session.user.role === "ADMIN" ? session : null;
}

/**
 * Call at the top of every admin page. Layout checks alone are not enough because Next renders pages
 * independently of their layout, so each page verifies the role itself before querying data.
 */
export async function requireAdminPage(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login?next=%2Fadmin");
  if (session.user.role !== "ADMIN") notFound();
  return session;
}
