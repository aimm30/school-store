import "server-only";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { canTransition, STATUS_LABEL } from "./status";
import { OrderError } from "./create";

export async function changeOrderStatus(orderId: string, to: OrderStatus): Promise<void> {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new OrderError("Order not found.");
    if (!canTransition(order.status, to, order.fulfillment)) {
      throw new OrderError(`An order that is "${STATUS_LABEL[order.status]}" can't be moved to "${STATUS_LABEL[to]}".`);
    }
    if (to === "CANCELLED" && order.paymentStatus === "PAID") {
      throw new OrderError("This order is already paid. Resolve the refund with the customer before cancelling.");
    }
    // Optimistic concurrency: only update if nobody changed the status meanwhile.
    const res = await tx.order.updateMany({ where: { id: order.id, status: order.status }, data: { status: to } });
    if (res.count === 0) throw new OrderError("This order was just updated by someone else. Reload and try again.");

    if (to === "CANCELLED") {
      for (const item of order.items) {
        if (item.variantId) await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        else if (item.productId) await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        if (item.productId) await tx.product.updateMany({ where: { id: item.productId }, data: { soldCount: { decrement: item.quantity } } });
      }
    }
  });
}

/** Records that money was actually received (e.g. cash collected). Never called automatically. */
export async function recordPaymentReceived(orderId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new OrderError("Order not found.");
    if (order.status === "CANCELLED") throw new OrderError("A cancelled order can't be marked as paid.");
    if (order.paymentStatus !== "UNPAID") throw new OrderError("This order's payment has already been recorded.");
    const res = await tx.order.updateMany({ where: { id: order.id, paymentStatus: "UNPAID" }, data: { paymentStatus: "PAID" } });
    if (res.count === 0) throw new OrderError("Payment was just recorded by someone else.");
    await tx.payment.updateMany({ where: { orderId: order.id }, data: { status: "PAID", paidAt: new Date() } });
  });
}
