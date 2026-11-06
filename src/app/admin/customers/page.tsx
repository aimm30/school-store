import { requireAdminPage } from "@/lib/auth/session";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";

export const metadata: Metadata = { title: "Customers" };
const PAGE = 20;

export default async function AdminCustomers({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  await requireAdminPage();
  const q = searchParams.q?.trim().slice(0, 80) || undefined;
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const where = { role: "CUSTOMER" as const, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }, { studentId: { contains: q, mode: "insensitive" as const } }] } : {}) };
  const [users, total] = await db.$transaction([
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, select: { id: true, name: true, email: true, studentId: true, status: true, createdAt: true, _count: { select: { orders: true } } } }),
    db.user.count({ where }),
  ]);
  return (
    <div>
      <PageHeader title="Customers" description={`${total} registered`} />
      <form className="mb-4 flex max-w-md gap-2" role="search">
        <label htmlFor="cq" className="sr-only">Search customers</label>
        <input id="cq" name="q" defaultValue={q} placeholder="Name, email or student ID" className="input" />
        <button className="btn btn-secondary">Search</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Customer</th><th className="th">Student ID</th><th className="th">Orders</th><th className="th">Joined</th><th className="th">Status</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="td"><Link href={`/admin/customers/${u.id}`} className="font-medium hover:text-brand-700">{u.name}</Link><span className="block text-xs text-slate-500">{u.email}</span></td>
                <td className="td">{u.studentId ?? "—"}</td>
                <td className="td tabular-nums">{u._count.orders}</td>
                <td className="td text-slate-600">{u.createdAt.toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "Asia/Kathmandu" })}</td>
                <td className="td">{u.status === "ACTIVE" ? <span className="badge bg-green-50 text-green-800">Active</span> : <span className="badge bg-red-50 text-red-700">Suspended</span>}</td>
              </tr>
            ))}
            {users.length === 0 && <tr><td className="td text-slate-600" colSpan={5}>No customers found.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.ceil(total / PAGE)} basePath="/admin/customers" params={{ q }} />
    </div>
  );
}
