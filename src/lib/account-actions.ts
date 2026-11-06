"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { fail, fromZod, succeed, type FormState } from "@/lib/form";
import { addressSchema, changePasswordSchema, profileSchema } from "@/lib/validation";
import { destroyUserSessions, getSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return fail("Please sign in again.");
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await db.user.update({ where: { id: session.user.id }, data: { name: parsed.data.name, phone: parsed.data.phone ?? null, studentId: parsed.data.studentId ?? null } });
    revalidatePath("/account", "layout");
    return succeed("Profile updated.");
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return fail("Please correct the highlighted fields.", { studentId: ["This student ID is already registered."] });
    console.error("[account] profile failed", err);
    return fail("We couldn't save your profile. Please try again.");
  }
}

export async function saveAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return fail("Please sign in again.");
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const existing = await db.address.findFirst({ where: { userId: session.user.id, isDefault: true } });
    const data = { ...parsed.data, landmark: parsed.data.landmark ?? null };
    if (existing) await db.address.update({ where: { id: existing.id }, data });
    else await db.address.create({ data: { ...data, userId: session.user.id, isDefault: true } });
    revalidatePath("/account", "layout");
    return succeed("Delivery information saved.");
  } catch (err) {
    console.error("[account] address failed", err);
    return fail("We couldn't save your delivery information. Please try again.");
  }
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return fail("Please sign in again.");
  const limit = rateLimit(`chpw:${session.user.id}`, 5, 15 * 60 * 1000);
  if (!limit.ok) return fail("Too many attempts. Please try again later.");
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return fail("Please correct the highlighted fields.", { currentPassword: ["Your current password is incorrect."] });
    }
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
    await destroyUserSessions(user.id, session.sessionId); // sign out other devices
    return succeed("Password changed. Other devices have been signed out.");
  } catch (err) {
    console.error("[account] password failed", err);
    return fail("We couldn't change your password. Please try again.");
  }
}
