import { requireAdminPage } from "@/lib/auth/session";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { formatNpr } from "@/lib/money";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { totalStock } from "@/lib/pricing";

export const metadata: Metadata = { title: "Products" };
const PAGE = 20;

export default async function AdminProducts({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  await requireAdminPage();
  const q = searchParams.q?.trim().slice(0, 80) || undefined;
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const where = q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { sku: { contains: q, mode: "insensitive" as const } }] } : {};
  const [products, total] = await db.$transaction([
    db.product.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { category: true, variants: { select: { stock: true } } } }),
    db.product.count({ where }),
  ]);
  return (
    <div>
      <PageHeader title="Products" description={`${total} total`}>
        <Link href="/admin/products/new" className="btn btn-primary"><Plus className="h-4 w-4" aria-hidden /> New product</Link>
      </PageHeader>
      <form className="mb-4 flex max-w-md gap-2" role="search">
        <label htmlFor="pq" className="sr-only">Search products</label>
        <input id="pq" name="q" defaultValue={q} placeholder="Search by name or SKU" className="input" />
        <button className="btn btn-secondary">Search</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Product</th><th className="th">Category</th><th className="th">Price</th><th className="th">Stock</th><th className="th">Status</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="td"><Link href={`/admin/products/${p.id}`} className="font-medium hover:text-brand-700">{p.name}</Link><span className="block text-xs text-slate-500">{p.sku}</span></td>
                <td className="td">{p.category.name}</td>
                <td className="td tabular-nums">{formatNpr(p.priceNpr)}</td>
                <td className="td tabular-nums">{totalStock(p)}</td>
                <td className="td">{p.isActive ? <span className="badge bg-green-50 text-green-800">Visible</span> : <span className="badge bg-slate-100 text-slate-600">Hidden</span>}{p.isFeatured && <span className="badge ml-1 bg-brand-50 text-brand-800">Featured</span>}</td>
              </tr>
            ))}
            {products.length === 0 && <tr><td className="td text-slate-600" colSpan={5}>No products found.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.ceil(total / PAGE)} basePath="/admin/products" params={{ q }} />
    </div>
  );
}
