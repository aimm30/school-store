"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { login } from "@/lib/auth/actions";
import { Field, FormMessage } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useFormState(login, null);
  const e = state?.fieldErrors;
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <Field label="Email or student ID" name="identifier" autoComplete="username" required errors={e?.identifier} />
      <PasswordField label="Password" name="password" autoComplete="current-password" errors={e?.password} />
      <div className="flex items-center justify-between text-sm">
        <label className="flex min-h-[32px] items-center gap-2">
          <input type="checkbox" name="remember" className="h-4 w-4 rounded border-slate-300" /> Remember me
        </label>
        <Link href="/forgot-password" className="link">
          Forgot password?
        </Link>
      </div>
      <SubmitButton className="btn-primary w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
      <p className="text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/signup" className="link font-medium">
          Create an account
        </Link>
      </p>
    </form>
  );
}
