import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { AddressForm, ProfileForm } from "@/components/account/AccountForms";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "My profile", robots: { index: false } };

export default async function AccountPage() {
  const { user } = await requireUser("/account");
  const address = await db.address.findFirst({ where: { userId: user.id, isDefault: true } });
  return (
    <div className="max-w-2xl space-y-10">
      <PageHeader title="My profile" />
      <section aria-labelledby="profile-h">
        <h2 id="profile-h" className="mb-4 text-lg font-semibold">Personal information</h2>
        <div className="card p-5">
          <ProfileForm user={{ name: user.name, email: user.email, phone: user.phone ?? "", studentId: user.studentId ?? "" }} />
        </div>
      </section>
      <section aria-labelledby="address-h">
        <h2 id="address-h" className="mb-4 text-lg font-semibold">Saved delivery information</h2>
        <div className="card p-5">
          <AddressForm address={{ recipient: address?.recipient ?? user.name, phone: address?.phone ?? user.phone ?? "", line1: address?.line1 ?? "", city: address?.city ?? "", landmark: address?.landmark ?? "" }} />
        </div>
      </section>
    </div>
  );
}
