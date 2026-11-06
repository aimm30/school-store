import { requireAdminPage } from "@/lib/auth/session";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getDashboardStats } from "@/lib/admin/stats";
import { formatNpr } from "@/lib/money";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  await requireAdminPage();
  const s = await getDashboardStats();
  const cards = [
    { label: "Total orders", value: s.totalOrders.toLocaleString("en-IN") },
    { label: "Pending orders", value: s.pendingOrders.toLocaleString("en-IN"), href: "/admin/orders?status=PENDING" },
    { label: "Revenue (completed & paid)", value: formatNpr(s.revenue) },
    { label: "Available products", value: s.activeProducts.toLocaleString("en-IN"), href: "/admin/products" },
    { label: "Low-stock items", value: s.lowStock.length.toString() },
    { label: "Customers", value: s.customers.toLocaleString("en-IN"), href: "/admin/customers" },
  ];
  return (
    <div>
      <PageHeader title="Dashboard" />
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <dt className="text-sm text-slate-600">{c.href ? <Link href={c.href} className="hover:underline">{c.label}</Link> : c.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3"><h2 className="font-semibold">Recent orders</h2><Link href="/admin/orders" className="link text-sm">All orders</Link></div>
          {s.recent.length === 0 ? <p className="p-5 text-sm text-slate-600">No orders yet.</p> : (
            <ul className="divide-y divide-slate-100">
              {s.recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-slate-50">
                    <span><span className="font-mono font-medium">{o.orderNumber}</span><span className="block text-xs text-slate-500">{o.customerName}</span></span>
                    <span className="flex items-center gap-3"><OrderStatusBadge status={o.status} /><span className="tabular-nums">{formatNpr(o.total)}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-3"><h2 className="font-semibold">Low stock (≤ {siteConfig.lowStockThreshold})</h2></div>
          {s.lowStock.length === 0 ? <p className="p-5 text-sm text-slate-600">All active products are well stocked.</p> : (
            <ul className="divide-y divide-slate-100">
              {s.lowStock.map((l) => (
                <li key={l.key}>
                  <Link href={`/admin/products/${l.productId}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-slate-50">
                    <span>{l.label}<span className="block text-xs text-slate-500">{l.sku}</span></span>
                    <span className={l.stock === 0 ? "badge bg-red-50 text-red-700" : "badge bg-amber-50 text-amber-800"}><AlertTriangle className="mr-1 h-3 w-3" aria-hidden />{l.stock} left</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
