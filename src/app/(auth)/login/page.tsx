import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth/session";
import { safeNext } from "@/lib/form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNext(searchParams.next);
  if (await getSession()) redirect(next);
  return (
    <AuthCard title="Welcome back" subtitle="Sign in to track orders and check out faster.">
      <LoginForm next={next} />
    </AuthCard>
  );
}
