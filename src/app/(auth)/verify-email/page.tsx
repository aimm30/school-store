import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

export const metadata: Metadata = { title: "Verify email", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  let ok = false;
  const token = searchParams.token;
  if (token) {
    const row = await db.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (row && !row.usedAt && row.expiresAt > new Date()) {
      await db.$transaction([
        db.emailVerificationToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
        db.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }),
      ]);
      ok = true;
    }
  }
  return (
    <AuthCard title={ok ? "Email verified" : "Verification link invalid"}>
      <p className="text-sm text-slate-600">{ok ? "Thank you — your email address is now confirmed." : "This link is invalid or has expired. Sign in and request a new verification email from your account settings."}</p>
      <Link href={ok ? "/account" : "/login"} className="btn btn-primary mt-6 w-full">
        {ok ? "Go to my account" : "Sign in"}
      </Link>
    </AuthCard>
  );
}
