import { requireAdminPage } from "@/lib/auth/session";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { markPaymentReceived, updateOrderStatus } from "@/lib/admin/actions";
import { nextStatuses, STATUS_LABEL } from "@/lib/orders/status";
import { OrderSummary } from "@/components/orders/OrderSummary";
import { ActionForm } from "@/components/ui/ActionForm";

export const metadata: Metadata = { title: "Order details" };

export default async function AdminOrderPage({ params }: { params: { id: string } }) {
  await requireAdminPage();
  const order = await db.order.findUnique({ where: { id: params.id }, include: { items: { orderBy: { id: "asc" } }, user: { select: { id: true, name: true } } } });
  if (!order) notFound();
  const next = nextStatuses(order.status, order.fulfillment);
  return (
    <div className="max-w-3xl">
      <Link href="/admin/orders" className="link mb-4 inline-block text-sm">← All orders</Link>
      <div className="card mb-6 p-5">
        <h2 className="text-base font-semibold">Manage order</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {next.length === 0 && <p className="text-sm text-slate-600">This order is {STATUS_LABEL[order.status].toLowerCase()} and can't be changed further.</p>}
          {next.map((s) =>
            s === "CANCELLED" ? (
              <ActionForm key={s} action={updateOrderStatus} fields={{ orderId: order.id, status: s }} label="Cancel order" className="btn-danger" confirm={{ title: "Cancel this order?", description: "Reserved stock will be returned to the shop. The customer will see the order as cancelled.", confirmLabel: "Cancel order" }} />
            ) : (
              <ActionForm key={s} action={updateOrderStatus} fields={{ orderId: order.id, status: s }} label={`Mark ${STATUS_LABEL[s].toLowerCase()}`} className="btn-primary" />
            ),
          )}
          {order.paymentStatus === "UNPAID" && order.status !== "CANCELLED" && (
            <ActionForm action={markPaymentReceived} fields={{ orderId: order.id }} label="Record payment received" confirm={{ title: "Record payment?", description: `Only do this after the full amount has actually been received (${order.paymentMethod === "COD" ? "cash on delivery" : "paid at school"}).`, confirmLabel: "Yes, payment received" }} />
          )}
        </div>
        {order.user && <p className="mt-3 text-sm text-slate-600">Registered customer: <Link href={`/admin/customers/${order.user.id}`} className="link">{order.user.name}</Link></p>}
      </div>
      <OrderSummary order={order} />
    </div>
  );
}
