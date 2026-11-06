import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ShoppingBag } from "lucide-react";
import { getCartView } from "@/lib/cart";
import { formatNpr } from "@/lib/money";
import { siteConfig } from "@/lib/config";
import { CartLineControls } from "@/components/cart/CartLineControls";
import { ProductImage } from "@/components/product/ProductImage";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

const PROBLEM: Record<string, string> = {
  UNAVAILABLE: "No longer available — remove it to continue.",
  OUT_OF_STOCK: "Out of stock — remove it to continue.",
  INSUFFICIENT: "Not enough stock for this quantity — reduce it to continue.",
};

export default async function CartPage() {
  const cart = await getCartView();
  if (!cart.lines.length) {
    return (
      <div className="container-page py-10">
        <PageHeader title="Your cart" />
        <EmptyState icon={<ShoppingBag className="h-10 w-10" aria-hidden />} title="Your cart is empty" description="Browse the store and add what you need for school.">
          <Link href="/products" className="btn btn-primary">Continue shopping</Link>
        </EmptyState>
      </div>
    );
  }
  return (
    <div className="container-page py-8">
      <PageHeader title="Your cart" description={`${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}`} />
      <div className="grid gap-8 lg:grid-cols-3">
        <ul className="space-y-3 lg:col-span-2">
          {cart.lines.map((l) => (
            <li key={l.id} className="card flex gap-4 p-4">
              <Link href={`/products/${l.slug}`} className="block w-20 shrink-0 overflow-hidden rounded-md sm:w-24">
                <ProductImage src={l.imageUrl} alt={l.name} sizes="96px" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/products/${l.slug}`} className="line-clamp-2 font-medium hover:text-brand-700">{l.name}</Link>
                    {l.variantName && <p className="text-sm text-slate-500">{l.variantName}</p>}
                    <p className="mt-0.5 text-sm text-slate-600 tabular-nums">{formatNpr(l.unitPrice)} each</p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">{formatNpr(l.lineTotal)}</p>
                </div>
                {l.problem && (
                  <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {PROBLEM[l.problem]}
                  </p>
                )}
                <div className="mt-3">
                  <CartLineControls id={l.id} quantity={l.quantity} max={Math.max(1, Math.min(siteConfig.maxQtyPerLine, l.available))} name={l.name} />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="lg:col-span-1">
          <div className="card sticky top-36 p-5">
            <h2 className="text-base font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd className="tabular-nums">{formatNpr(cart.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-600">Delivery</dt><dd className="tabular-nums">{siteConfig.deliveryFee ? formatNpr(siteConfig.deliveryFee) : "Free"}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatNpr(cart.total)}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-slate-500">Final prices are confirmed by the store when you place the order. Delivery is not charged for school collection.</p>
            {cart.hasProblems ? (
              <p role="alert" className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">Fix the highlighted items to continue.</p>
            ) : (
              <Link href="/checkout" className="btn btn-primary mt-4 w-full">Proceed to checkout</Link>
            )}
            <Link href="/products" className="btn btn-secondary mt-2 w-full">Continue shopping</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
