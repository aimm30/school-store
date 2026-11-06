"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { signup } from "@/lib/auth/actions";
import { Field, FormMessage } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function SignupForm() {
  const [state, action] = useFormState(signup, null);
  const e = state?.fieldErrors;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Full name" name="name" autoComplete="name" required errors={e?.name} />
      <Field label="Email address" name="email" type="email" autoComplete="email" required errors={e?.email} />
      <Field label="Student ID (optional)" name="studentId" autoComplete="off" errors={e?.studentId} hint="Lets you sign in with your student ID too." />
      <PasswordField label="Password" name="password" autoComplete="new-password" showStrength errors={e?.password} hint="At least 8 characters with upper and lower case letters and a number." />
      <PasswordField label="Confirm password" name="confirmPassword" autoComplete="new-password" errors={e?.confirmPassword} />
      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="acceptTerms" className="mt-0.5 h-4 w-4 rounded border-slate-300" aria-describedby={e?.acceptTerms ? "terms-error" : undefined} />
          <span>
            I accept the{" "}
            <Link href="/terms" target="_blank" className="link">
              Terms of Use
            </Link>{" "}
            and acknowledge the{" "}
            <Link href="/privacy" target="_blank" className="link">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {e?.acceptTerms && (
          <p id="terms-error" role="alert" className="mt-1 text-xs font-medium text-red-600">
            {e.acceptTerms[0]}
          </p>
        )}
      </div>
      <SubmitButton className="btn-primary w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="link font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
