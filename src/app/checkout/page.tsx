import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCartView } from "@/lib/cart";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatNpr } from "@/lib/money";
import { siteConfig } from "@/lib/config";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const cart = await getCartView();
  if (!cart.lines.length) redirect("/cart");
  if (cart.hasProblems) redirect("/cart");
  const session = await getSession();
  const address = session ? await db.address.findFirst({ where: { userId: session.user.id, isDefault: true } }) : null;
  const defaults = {
    name: session?.user.name ?? "",
    email: session?.user.email ?? "",
    phone: session?.user.phone ?? address?.phone ?? "",
    address: address?.line1 ?? "",
    city: address?.city ?? "",
    landmark: address?.landmark ?? "",
  };
  return (
    <div className="container-page py-8">
      <PageHeader title="Checkout" />
      {!session && (
        <p className="mb-6 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600">
          Have an account? <Link href="/login?next=/checkout" className="link">Sign in</Link> to prefill your details and track this order. You can also check out as a guest.
        </p>
      )}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CheckoutForm idempotencyKey={randomUUID()} defaults={defaults} />
        </div>
        <aside>
          <div className="card p-5">
            <h2 className="text-base font-semibold">Order summary</h2>
            <ul className="mt-4 divide-y divide-slate-100 text-sm">
              {cart.lines.map((l) => (
                <li key={l.id} className="flex justify-between gap-3 py-2">
                  <span>
                    {l.name}
                    {l.variantName ? ` (${l.variantName})` : ""} <span className="text-slate-500">× {l.quantity}</span>
                  </span>
                  <span className="tabular-nums">{formatNpr(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd className="tabular-nums">{formatNpr(cart.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-600">Delivery (if delivered)</dt><dd className="tabular-nums">{siteConfig.deliveryFee ? formatNpr(siteConfig.deliveryFee) : "Free"}</dd></div>
              <div className="flex justify-between pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatNpr(cart.subtotal + (siteConfig.deliveryFee ? siteConfig.deliveryFee : 0))}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-slate-500">The delivery fee is not applied to school collection orders. The final total is shown on your confirmation.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
