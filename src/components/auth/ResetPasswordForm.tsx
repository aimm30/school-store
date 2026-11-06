"use client";

import { useFormState } from "react-dom";
import { resetPassword } from "@/lib/auth/actions";
import { FormMessage } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useFormState(resetPassword, null);
  const e = state?.fieldErrors;
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      <PasswordField label="New password" name="password" autoComplete="new-password" showStrength errors={e?.password} />
      <PasswordField label="Confirm new password" name="confirmPassword" autoComplete="new-password" errors={e?.confirmPassword} />
      <SubmitButton className="btn-primary w-full" pendingText="Saving…">
        Set new password
      </SubmitButton>
    </form>
  );
}
