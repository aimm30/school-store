import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { OrderSummary } from "@/components/orders/OrderSummary";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default async function OrderDetailPage({ params }: { params: { orderNumber: string } }) {
  const { user } = await requireUser(`/account/orders/${params.orderNumber}`);
  // Scoped to the signed-in user: other customers' orders are indistinguishable from "not found".
  const order = await db.order.findFirst({ where: { orderNumber: params.orderNumber, userId: user.id }, include: { items: { orderBy: { id: "asc" } } } });
  if (!order) notFound();
  return (
    <div className="max-w-3xl">
      <Link href="/account/orders" className="link mb-4 inline-block text-sm">← All orders</Link>
      <OrderSummary order={order} />
    </div>
  );
}
