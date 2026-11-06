import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { formatNpr } from "@/lib/money";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };
const PAGE = 10;

export default async function OrdersPage({ searchParams }: { searchParams: { page?: string } }) {
  const { user } = await requireUser("/account/orders");
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const [orders, total] = await db.$transaction([
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { _count: { select: { items: true } } } }),
    db.order.count({ where: { userId: user.id } }),
  ]);
  return (
    <div className="max-w-3xl">
      <PageHeader title="My orders" />
      {orders.length === 0 ? (
        <EmptyState icon={<Package className="h-10 w-10" aria-hidden />} title="No orders yet" description="When you place an order while signed in, it will appear here.">
          <Link href="/products" className="btn btn-primary">Start shopping</Link>
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.orderNumber}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:border-slate-300 hover:shadow-sm">
                  <div>
                    <p className="font-mono font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-slate-500">
                      {o.createdAt.toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "Asia/Kathmandu" })} · {o._count.items} item{o._count.items === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <OrderStatusBadge status={o.status} />
                    <span className="font-semibold tabular-nums">{formatNpr(o.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} pages={Math.ceil(total / PAGE)} basePath="/account/orders" params={{}} />
        </>
      )}
    </div>
  );
}
