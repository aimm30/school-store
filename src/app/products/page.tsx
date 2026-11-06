import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { getCategories, listProducts, SORTS, SORT_LABEL, type Sort } from "@/lib/catalog";
import { ProductGrid } from "@/components/product/ProductCard";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import clsx from "clsx";

type Props = { searchParams: { q?: string; category?: string; sort?: string; page?: string } };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return { title: searchParams.q ? `Search: ${searchParams.q.slice(0, 40)}` : "All products", description: "Browse school uniforms, notebooks, textbooks and stationery.", robots: searchParams.q ? { index: false } : undefined };
}

export default async function ProductsPage({ searchParams }: Props) {
  const q = searchParams.q?.trim().slice(0, 80) || undefined;
  const sort: Sort = (SORTS as readonly string[]).includes(searchParams.sort ?? "") ? (searchParams.sort as Sort) : "newest";
  const page = Math.max(1, Math.min(500, parseInt(searchParams.page ?? "1", 10) || 1));
  const category = searchParams.category || undefined;

  const [categories, result] = await Promise.all([getCategories(), listProducts({ q, category, sort, page })]);
  const active = categories.find((c) => c.slug === category);
  const params = { q, category, sort: sort === "newest" ? undefined : sort };
  const link = (over: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...over })) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `/products?${s}` : "/products";
  };

  return (
    <div className="container-page py-8">
      <PageHeader title={q ? `Results for “${q}”` : (active?.name ?? "All products")} description={`${result.total} product${result.total === 1 ? "" : "s"}`} />
      <div className="grid gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1" aria-label="Filters">
          <h2 className="mb-2 text-sm font-semibold">Categories</h2>
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {[{ id: "all", name: "All products", slug: undefined as string | undefined }, ...categories].map((c) => (
              <li key={c.id} className="shrink-0">
                <Link href={link({ category: c.slug, page: undefined })} aria-current={c.slug === category ? "page" : undefined} className={clsx("block whitespace-nowrap rounded-md px-3 py-2 text-sm", c.slug === category ? "bg-brand-50 font-medium text-brand-800" : "text-slate-600 hover:bg-slate-100")}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
          <form action="/products" className="mt-4">
            {q && <input type="hidden" name="q" value={q} />}
            {category && <input type="hidden" name="category" value={category} />}
            <label htmlFor="sort" className="label">Sort by</label>
            <div className="flex gap-2">
              <select id="sort" name="sort" defaultValue={sort} className="input">
                {SORTS.map((s) => (
                  <option key={s} value={s}>{SORT_LABEL[s]}</option>
                ))}
              </select>
              <button className="btn btn-secondary btn-sm">Apply</button>
            </div>
          </form>
        </aside>
        <section className="lg:col-span-3" aria-live="polite">
          {result.items.length ? (
            <>
              <ProductGrid items={result.items} />
              <Pagination page={page} pages={result.pages} basePath="/products" params={params} />
            </>
          ) : (
            <EmptyState icon={<SearchX className="h-10 w-10" aria-hidden />} title="No products found" description={q ? "Try a different spelling or fewer words, or browse a category." : "There are no products here yet."}>
              <Link href="/products" className="btn btn-secondary">View all products</Link>
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
