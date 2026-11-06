import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token ?? "";
  const row = token ? await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } }) : null;
  const valid = row && !row.usedAt && row.expiresAt > new Date();
  return (
    <AuthCard title="Choose a new password">
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4 text-sm">
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800">
            This reset link is invalid or has expired.
          </p>
          <Link href="/forgot-password" className="btn btn-primary w-full">
            Request a new link
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
