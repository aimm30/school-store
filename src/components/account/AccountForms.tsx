"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { changePassword, saveAddress, updateProfile } from "@/lib/account-actions";
import { resendVerification } from "@/lib/auth/actions";
import { Field, FormMessage } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { useToast } from "@/components/ui/Toast";

function useSuccessToast(state: { ok: boolean; message?: string } | null) {
  const toast = useToast();
  useEffect(() => {
    if (state?.ok && state.message) toast(state.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

export function ProfileForm({ user }: { user: { name: string; email: string; phone: string; studentId: string } }) {
  const [state, action] = useFormState(updateProfile, null);
  useSuccessToast(state);
  const e = state?.fieldErrors;
  return (
    <form action={action} className="space-y-4" noValidate>
      {state && !state.ok && <FormMessage state={state} />}
      <Field label="Full name" name="name" defaultValue={user.name} required errors={e?.name} />
      <Field label="Email" name="email" value={user.email} readOnly disabled hint="To change your email, contact the school store." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mobile number" name="phone" type="tel" defaultValue={user.phone} errors={e?.phone} />
        <Field label="Student ID" name="studentId" defaultValue={user.studentId} errors={e?.studentId} />
      </div>
      <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
    </form>
  );
}

export function AddressForm({ address }: { address: { recipient: string; phone: string; line1: string; city: string; landmark: string } }) {
  const [state, action] = useFormState(saveAddress, null);
  useSuccessToast(state);
  const e = state?.fieldErrors;
  return (
    <form action={action} className="space-y-4" noValidate>
      {state && !state.ok && <FormMessage state={state} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Recipient name" name="recipient" defaultValue={address.recipient} required errors={e?.recipient} />
        <Field label="Mobile number" name="phone" type="tel" defaultValue={address.phone} required errors={e?.phone} />
      </div>
      <Field label="Street / tole / house details" name="line1" defaultValue={address.line1} required errors={e?.line1} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" name="city" defaultValue={address.city} required errors={e?.city} />
        <Field label="Landmark (optional)" name="landmark" defaultValue={address.landmark} errors={e?.landmark} />
      </div>
      <SubmitButton pendingText="Saving…">Save delivery information</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useFormState(changePassword, null);
  useSuccessToast(state);
  const e = state?.fieldErrors;
  return (
    <form action={action} className="space-y-4" noValidate key={state?.ok ? "done" : "form"}>
      {state && !state.ok && <FormMessage state={state} />}
      <PasswordField label="Current password" name="currentPassword" autoComplete="current-password" errors={e?.currentPassword} />
      <PasswordField label="New password" name="password" autoComplete="new-password" showStrength errors={e?.password} />
      <PasswordField label="Confirm new password" name="confirmPassword" autoComplete="new-password" errors={e?.confirmPassword} />
      <SubmitButton pendingText="Updating…">Change password</SubmitButton>
    </form>
  );
}

export function ResendVerification() {
  return <ActionForm action={async () => resendVerification()} fields={{}} label="Send verification email" />;
}
