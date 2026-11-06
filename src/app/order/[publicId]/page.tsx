import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { OrderSummary } from "@/components/orders/OrderSummary";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false } };

export default async function OrderConfirmationPage({ params }: { params: { publicId: string } }) {
  // The public id is a long random token known only to the person who placed the order.
  const order = await db.order.findUnique({ where: { publicId: params.publicId }, include: { items: { orderBy: { id: "asc" } } } });
  if (!order) notFound();
  return (
    <div className="container-page max-w-3xl py-8">
      <div className="mb-6 flex items-start gap-3">
        <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-green-600" aria-hidden />
        <div>
          <h1 className="text-2xl font-semibold">Thank you, your order has been placed</h1>
          <p className="mt-1 text-sm text-slate-600">We've saved your order and the school store can now see it. Keep your order number for reference.</p>
        </div>
      </div>
      <OrderSummary order={order} />
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/products" className="btn btn-primary">Continue shopping</Link>
        <Link href="/account/orders" className="btn btn-secondary">My orders</Link>
      </div>
    </div>
  );
}
