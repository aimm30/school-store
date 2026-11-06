import type { OrderStatus, PaymentStatus } from "@prisma/client";
import clsx from "clsx";
import { PAYMENT_LABEL, STATUS_LABEL } from "@/lib/orders/status";

const ORDER_STYLE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  CONFIRMED: "bg-blue-50 text-blue-800",
  PROCESSING: "bg-indigo-50 text-indigo-800",
  READY_FOR_COLLECTION: "bg-teal-50 text-teal-800",
  OUT_FOR_DELIVERY: "bg-teal-50 text-teal-800",
  COMPLETED: "bg-green-50 text-green-800",
  CANCELLED: "bg-slate-100 text-slate-600",
};
const PAY_STYLE: Record<PaymentStatus, string> = { UNPAID: "bg-amber-50 text-amber-800", PAID: "bg-green-50 text-green-800", FAILED: "bg-red-50 text-red-800", REFUNDED: "bg-slate-100 text-slate-600" };

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => <span className={clsx("badge", ORDER_STYLE[status])}>{STATUS_LABEL[status]}</span>;
export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => <span className={clsx("badge", PAY_STYLE[status])}>{PAYMENT_LABEL[status]}</span>;
