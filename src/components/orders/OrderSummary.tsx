import type { FulfillmentType, OrderStatus } from "@prisma/client";
import { Check } from "lucide-react";
import clsx from "clsx";
import { formatNpr } from "@/lib/money";
import { METHOD_LABEL, STATUS_LABEL, timelineSteps } from "@/lib/orders/status";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/StatusBadge";

export type OrderData = {
  orderNumber: string;
  status: OrderStatus;
  fulfillment: FulfillmentType;
  paymentMethod: keyof typeof METHOD_LABEL;
  paymentStatus: "UNPAID" | "PAID" | "FAILED" | "REFUNDED";
  customerName: string;
  phone: string;
  email: string;
  addressLine: string | null;
  city: string | null;
  landmark: string | null;
  notes: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: Date;
  items: { id: string; name: string; variantName: string | null; sku: string; unitPrice: number; quantity: number; lineTotal: number }[];
};

export function StatusTimeline({ status, fulfillment }: { status: OrderStatus; fulfillment: FulfillmentType }) {
  if (status === "CANCELLED") return <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">This order was cancelled.</p>;
  const steps = timelineSteps(fulfillment);
  const current = steps.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Order progress">
      {steps.map((s, i) => (
        <li key={s} className="text-center" aria-current={i === current ? "step" : undefined}>
          <span className={clsx("mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium", i < current ? "bg-brand-700 text-white" : i === current ? "border-2 border-brand-700 bg-white text-brand-700" : "bg-slate-200 text-slate-500")}>
            {i < current ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
          </span>
          <span className={clsx("mt-1 block text-[11px] leading-tight sm:text-xs", i <= current ? "font-medium text-slate-900" : "text-slate-500")}>{STATUS_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}

export function OrderSummary({ order }: { order: OrderData }) {
  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Order number</p>
            <p className="font-mono text-lg font-semibold">{order.orderNumber}</p>
          </div>
          <div className="flex gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>
        <div className="mt-6">
          <StatusTimeline status={order.status} fulfillment={order.fulfillment} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <h2 className="border-b border-slate-200 px-5 py-3 text-base font-semibold">Items</h2>
        <ul className="divide-y divide-slate-100">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 px-5 py-3 text-sm">
              <span>
                {i.name}
                {i.variantName ? ` (${i.variantName})` : ""} <span className="text-slate-500">× {i.quantity}</span>
                <span className="block text-xs text-slate-500">{formatNpr(i.unitPrice)} each · SKU {i.sku}</span>
              </span>
              <span className="tabular-nums">{formatNpr(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-slate-200 px-5 py-3 text-sm">
          <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd className="tabular-nums">{formatNpr(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-600">Delivery</dt><dd className="tabular-nums">{order.deliveryFee ? formatNpr(order.deliveryFee) : "Free"}</dd></div>
          <div className="flex justify-between pt-1 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatNpr(order.total)}</dd></div>
        </dl>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5 text-sm">
          <h2 className="mb-2 text-base font-semibold">{order.fulfillment === "DELIVERY" ? "Delivery" : "School collection"}</h2>
          <p>{order.customerName}</p>
          <p className="text-slate-600">{order.phone}</p>
          <p className="text-slate-600">{order.email}</p>
          {order.fulfillment === "DELIVERY" && (
            <p className="mt-2 text-slate-600">
              {order.addressLine}, {order.city}
              {order.landmark ? ` (${order.landmark})` : ""}
            </p>
          )}
        </div>
        <div className="card p-5 text-sm">
          <h2 className="mb-2 text-base font-semibold">Payment</h2>
          <p>{METHOD_LABEL[order.paymentMethod]}</p>
          <p className="mt-1 text-slate-600">{order.paymentStatus === "PAID" ? "Payment received." : "Payment is due when you receive or collect your order."}</p>
          {order.notes && <p className="mt-3 text-slate-600"><span className="font-medium text-slate-800">Notes:</span> {order.notes}</p>}
          <p className="mt-3 text-xs text-slate-500">Placed {order.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kathmandu" })}</p>
        </div>
      </div>
    </div>
  );
}
