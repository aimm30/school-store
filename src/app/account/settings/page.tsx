import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { PasswordForm, ResendVerification } from "@/components/account/AccountForms";
import { PageHeader } from "@/components/ui/PageHeader";
import { logout } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Account settings", robots: { index: false } };

export default async function SettingsPage() {
  const { user } = await requireUser("/account/settings");
  return (
    <div className="max-w-2xl space-y-10">
      <PageHeader title="Account settings" />
      <section>
        <h2 className="mb-4 text-lg font-semibold">Email verification</h2>
        <div className="card flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
          <p>{user.emailVerified ? `${user.email} is verified.` : `${user.email} has not been verified yet.`}</p>
          {!user.emailVerified && <ResendVerification />}
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold">Change password</h2>
        <div className="card p-5"><PasswordForm /></div>
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold">Sign out</h2>
        <form action={logout}>
          <button className="btn btn-secondary">Sign out on this device</button>
        </form>
      </section>
    </div>
  );
}
