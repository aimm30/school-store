import { requireAdminPage } from "@/lib/auth/session";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { setCustomerStatus } from "@/lib/admin/actions";
import { formatNpr } from "@/lib/money";
import { ActionForm } from "@/components/ui/ActionForm";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Customer" };

export default async function AdminCustomerPage({ params }: { params: { id: string } }) {
  await requireAdminPage();
  const user = await db.user.findFirst({ where: { id: params.id, role: "CUSTOMER" }, include: { orders: { orderBy: { createdAt: "desc" }, take: 50 } } });
  if (!user) notFound();
  const suspended = user.status === "SUSPENDED";
  return (
    <div className="max-w-3xl">
      <Link href="/admin/customers" className="link mb-4 inline-block text-sm">← All customers</Link>
      <PageHeader title={user.name} description={user.email}>
        <ActionForm
          action={setCustomerStatus}
          fields={{ id: user.id, status: suspended ? "ACTIVE" : "SUSPENDED" }}
          label={suspended ? "Reactivate account" : "Suspend account"}
          className={suspended ? "btn-primary" : "btn-danger"}
          confirm={{ title: suspended ? "Reactivate this account?" : "Suspend this account?", description: suspended ? "The customer will be able to sign in again." : "The customer will be signed out and won't be able to sign in until reactivated.", confirmLabel: suspended ? "Reactivate" : "Suspend" }}
        />
      </PageHeader>
      <dl className="card mb-6 grid gap-3 p-5 text-sm sm:grid-cols-3">
        <div><dt className="text-slate-500">Student ID</dt><dd>{user.studentId ?? "—"}</dd></div>
        <div><dt className="text-slate-500">Phone</dt><dd>{user.phone ?? "—"}</dd></div>
        <div><dt className="text-slate-500">Status</dt><dd>{suspended ? "Suspended" : "Active"}</dd></div>
      </dl>
      <h2 className="mb-3 text-base font-semibold">Order history</h2>
      <div className="card divide-y divide-slate-100">
        {user.orders.map((o) => (
          <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-slate-50">
            <span className="font-mono">{o.orderNumber}</span>
            <span className="flex items-center gap-3"><OrderStatusBadge status={o.status} /><span className="tabular-nums">{formatNpr(o.total)}</span></span>
          </Link>
        ))}
        {user.orders.length === 0 && <p className="p-5 text-sm text-slate-600">No orders yet.</p>}
      </div>
    </div>
  );
}
