import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { formatNpr } from "@/lib/money";
import { ProductImage } from "./ProductImage";

export function ProductCard({ p }: { p: ProductCardData }) {
  return (
    <Link href={`/products/${p.slug}`} className="card group block overflow-hidden transition duration-200 hover:border-slate-300 hover:shadow-md motion-safe:hover:-translate-y-0.5">
      <ProductImage src={p.imageUrl} alt={p.imageAlt} sizes="(min-width:1024px) 22vw, (min-width:640px) 30vw, 46vw" />
      <div className="p-3 sm:p-4">
        <p className="text-xs text-slate-500">{p.category}</p>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-brand-700">{p.name}</h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold tabular-nums">
            {p.from && <span className="mr-1 text-xs font-normal text-slate-500">From</span>}
            {formatNpr(p.price)}
          </p>
          {!p.inStock ? (
            <span className="badge bg-slate-100 text-slate-600">Out of stock</span>
          ) : p.lowStock ? (
            <span className="badge bg-amber-50 text-amber-800">Low stock</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ items }: { items: ProductCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {items.map((p) => (
        <li key={p.slug}>
          <ProductCard p={p} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton aspect-square rounded-none" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
