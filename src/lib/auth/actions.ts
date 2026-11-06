"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { fail, fromZod, safeNext, succeed, withNotice, type FormState } from "@/lib/form";
import { loginSchema, resetPasswordSchema, signupSchema, emailSchema } from "@/lib/validation";
import { burnPasswordCheck, hashPassword, verifyPassword } from "@/lib/password";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createSession, destroySession, destroyUserSessions, getSession } from "@/lib/auth/session";
import { generateToken, hashToken } from "@/lib/tokens";
import { mergeAnonCart } from "@/lib/cart";
import { sendMail } from "@/lib/mail";
import { siteConfig } from "@/lib/config";

const HOUR = 60 * 60 * 1000;

async function sendVerificationEmail(userId: string, email: string, name: string) {
  const token = generateToken();
  await db.emailVerificationToken.create({ data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 24 * HOUR) } });
  await sendMail({
    to: email,
    subject: `Verify your email — ${siteConfig.storeName}`,
    text: `Hello ${name},\n\nPlease confirm your email address by opening this link (valid for 24 hours):\n${siteConfig.siteUrl}/verify-email?token=${token}\n\nIf you did not create an account, you can ignore this message.`,
  });
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const limit = rateLimit(`signup:${clientIp()}`, 5, HOUR);
  if (!limit.ok) return fail(`Too many sign-up attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} minutes.`);

  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { name, email, studentId, password } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    const user = await db.user.create({ data: { name, email, studentId, passwordHash } });
    await sendVerificationEmail(user.id, user.email, user.name);
    await createSession(user.id, false);
    await mergeAnonCart(user.id);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = String(err.meta?.target ?? "");
      return target.includes("studentId")
        ? fail("Please correct the highlighted fields.", { studentId: ["This student ID is already registered."] })
        : fail("Please correct the highlighted fields.", { email: ["An account with this email already exists."] });
    }
    console.error("[auth] signup failed", err);
    return fail("We couldn't create your account. Please try again.");
  }
  redirect(withNotice("/account", "welcome"));
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { identifier, password } = parsed.data;
  const remember = formData.get("remember") === "on";
  const next = safeNext(formData.get("next"));

  const limit = rateLimit(`login:${clientIp()}:${identifier.toLowerCase()}`, 8, 15 * 60 * 1000);
  if (!limit.ok) return fail(`Too many attempts. Please wait ${Math.ceil(limit.retryAfterSec / 60)} minute(s) and try again.`);

  try {
    const isEmail = identifier.includes("@");
    const user = await db.user.findFirst({ where: isEmail ? { email: identifier.toLowerCase() } : { studentId: identifier } });
    if (!user) {
      await burnPasswordCheck(password);
      return fail("Incorrect email/student ID or password.");
    }
    if (!(await verifyPassword(password, user.passwordHash))) return fail("Incorrect email/student ID or password.");
    if (user.status !== "ACTIVE") return fail("This account has been suspended. Please contact the school store.");
    await createSession(user.id, remember);
    await mergeAnonCart(user.id);
    redirect(withNotice(user.role === "ADMIN" && next === "/account" ? "/admin" : next, "signed-in"));
  } catch (err) {
    if (isRedirect(err)) throw err;
    console.error("[auth] login failed", err);
    return fail("We couldn't sign you in right now. Please try again.");
  }
}

function isRedirect(err: unknown): boolean {
  return typeof err === "object" && err !== null && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect(withNotice("/", "signed-out"));
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const limit = rateLimit(`reset:${clientIp()}`, 5, HOUR);
  if (!limit.ok) return fail("Too many requests. Please try again later.");
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return fail("Please correct the highlighted fields.", { email: [parsed.error.issues[0]?.message ?? "Enter a valid email address."] });

  try {
    const user = await db.user.findUnique({ where: { email: parsed.data } });
    if (user && user.status === "ACTIVE") {
      const token = generateToken();
      await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + HOUR) } });
      await sendMail({
        to: user.email,
        subject: `Reset your password — ${siteConfig.storeName}`,
        text: `Hello ${user.name},\n\nUse this link to choose a new password (valid for 1 hour):\n${siteConfig.siteUrl}/reset-password?token=${token}\n\nIf you did not request this, you can ignore this message.`,
      });
    }
  } catch (err) {
    console.error("[auth] reset request failed", err);
    return fail("We couldn't process your request. Please try again.");
  }
  // Same message whether or not the account exists.
  return succeed("If an account exists for that email, we've sent a link to reset the password.");
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { token, password } = parsed.data;
  try {
    const row = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!row || row.usedAt || row.expiresAt < new Date()) return fail("This reset link is invalid or has expired. Please request a new one.");
    const passwordHash = await hashPassword(password);
    const claimed = await db.$transaction(async (tx) => {
      const used = await tx.passwordResetToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
      if (used.count === 0) return false;
      await tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
      return true;
    });
    if (!claimed) return fail("This reset link has already been used.");
    await destroyUserSessions(row.userId);
  } catch (err) {
    console.error("[auth] reset failed", err);
    return fail("We couldn't reset your password. Please try again.");
  }
  redirect(withNotice("/login", "password-reset"));
}

export async function resendVerification(): Promise<FormState> {
  const session = await getSession();
  if (!session) return fail("Please sign in first.");
  if (session.user.emailVerified) return succeed("Your email is already verified.");
  const limit = rateLimit(`verify:${session.user.id}`, 3, HOUR);
  if (!limit.ok) return fail("Please wait before requesting another email.");
  try {
    await sendVerificationEmail(session.user.id, session.user.email, session.user.name);
    return succeed("Verification email sent (check your inbox).");
  } catch (err) {
    console.error("[auth] resend failed", err);
    return fail("We couldn't send the email. Please try again.");
  }
}
