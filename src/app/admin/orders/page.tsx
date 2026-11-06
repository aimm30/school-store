import { requireAdminPage } from "@/lib/auth/session";
import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { formatNpr } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/orders/status";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";

export const metadata: Metadata = { title: "Orders" };
const PAGE = 20;
const STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];

export default async function AdminOrders({ searchParams }: { searchParams: { status?: string; q?: string; page?: string } }) {
  await requireAdminPage();
  const status = STATUSES.includes(searchParams.status as OrderStatus) ? (searchParams.status as OrderStatus) : undefined;
  const q = searchParams.q?.trim().slice(0, 60) || undefined;
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const where = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ orderNumber: { contains: q, mode: "insensitive" as const } }, { customerName: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q } }] } : {}),
  };
  const [orders, total] = await db.$transaction([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
    db.order.count({ where }),
  ]);
  const tab = (s?: OrderStatus) => ({ href: s ? `/admin/orders?status=${s}` : "/admin/orders", active: s === status });
  return (
    <div>
      <PageHeader title="Orders" description={`${total} matching`} />
      <div className="mb-4 flex gap-1 overflow-x-auto">
        {[undefined, ...STATUSES].map((s) => {
          const t = tab(s);
          return <Link key={s ?? "all"} href={t.href} className={clsx("whitespace-nowrap rounded-md px-3 py-1.5 text-sm", t.active ? "bg-brand-700 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50")}>{s ? STATUS_LABEL[s] : "All"}</Link>;
        })}
      </div>
      <form className="mb-4 flex max-w-md gap-2" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="oq" className="sr-only">Search orders</label>
        <input id="oq" name="q" defaultValue={q} placeholder="Order number, name or phone" className="input" />
        <button className="btn btn-secondary">Search</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Total</th><th className="th">Status</th><th className="th">Payment</th><th className="th">Placed</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="td"><Link href={`/admin/orders/${o.id}`} className="font-mono font-medium hover:text-brand-700">{o.orderNumber}</Link></td>
                <td className="td">{o.customerName}<span className="block text-xs text-slate-500">{o.phone}</span></td>
                <td className="td tabular-nums">{formatNpr(o.total)}</td>
                <td className="td"><OrderStatusBadge status={o.status} /></td>
                <td className="td"><PaymentStatusBadge status={o.paymentStatus} /></td>
                <td className="td text-slate-600">{o.createdAt.toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "Asia/Kathmandu" })}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td className="td text-slate-600" colSpan={6}>No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.ceil(total / PAGE)} basePath="/admin/orders" params={{ status, q }} />
    </div>
  );
}
