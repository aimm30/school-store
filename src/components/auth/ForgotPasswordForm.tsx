"use client";

import { useFormState } from "react-dom";
import { requestPasswordReset } from "@/lib/auth/actions";
import { Field, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ForgotPasswordForm() {
  const [state, action] = useFormState(requestPasswordReset, null);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Email address" name="email" type="email" autoComplete="email" required errors={state?.fieldErrors?.email} />
      <SubmitButton className="btn-primary w-full" pendingText="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}
