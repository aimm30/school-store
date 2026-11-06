import Link from "next/link";
import { GraduationCap, Search } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { getSession } from "@/lib/auth/session";
import { getCartCount } from "@/lib/cart";
import { getCategories } from "@/lib/catalog";
import { UserMenu } from "./UserMenu";
import { CartLink } from "./CartLink";

function SearchForm({ className }: { className?: string }) {
  return (
    <form action="/products" role="search" className={className}>
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input id="site-search" name="q" type="search" maxLength={80} placeholder="Search lab coats, notebooks, pens…" className="input pl-9" />
      </div>
    </form>
  );
}

export async function Header() {
  const [session, count, categories] = await Promise.all([getSession(), getCartCount(), getCategories().catch(() => [])]);
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="container-page flex h-16 items-center gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-brand-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-700 text-white">
            <GraduationCap className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden leading-tight sm:block">
            {siteConfig.storeName}
            <span className="block text-[11px] font-normal text-slate-500">{siteConfig.schoolName}</span>
          </span>
        </Link>
        <SearchForm className="mx-2 hidden flex-1 md:block md:max-w-lg" />
        <div className="ml-auto flex items-center gap-1">
          {session ? (
            <UserMenu name={session.user.name} isAdmin={session.user.role === "ADMIN"} />
          ) : (
            <Link href="/login" className="btn btn-ghost px-3">
              Sign in
            </Link>
          )}
          <CartLink count={count} />
        </div>
      </div>
      <div className="container-page pb-3 md:hidden">
        <SearchForm />
      </div>
      <nav aria-label="Product categories" className="border-t border-slate-100 bg-white">
        <ul className="container-page flex gap-1 overflow-x-auto py-1 text-sm">
          <li>
            <Link href="/products" className="block whitespace-nowrap rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
              All products
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/products?category=${c.slug}`} className="block whitespace-nowrap rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
