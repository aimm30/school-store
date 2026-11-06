import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function SignupPage() {
  if (await getSession()) redirect("/account");
  return (
    <AuthCard title="Create your account" subtitle="Order school supplies in a few taps.">
      <SignupForm />
    </AuthCard>
  );
}
