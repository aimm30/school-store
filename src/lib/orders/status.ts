import type { FulfillmentType, OrderStatus, PaymentStatus } from "@prisma/client";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY_FOR_COLLECTION: "Ready for collection",
  OUT_FOR_DELIVERY: "Out for delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const METHOD_LABEL = {
  COD: "Cash on Delivery",
  PAY_AT_SCHOOL: "Pay at School / Collection",
  ESEWA: "eSewa",
  KHALTI: "Khalti",
} as const;

/** The statuses an order may move to from its current status. */
export function nextStatuses(status: OrderStatus, fulfillment: FulfillmentType): OrderStatus[] {
  switch (status) {
    case "PENDING":
      return ["CONFIRMED", "CANCELLED"];
    case "CONFIRMED":
      return ["PROCESSING", "CANCELLED"];
    case "PROCESSING":
      return [fulfillment === "DELIVERY" ? "OUT_FOR_DELIVERY" : "READY_FOR_COLLECTION", "CANCELLED"];
    case "READY_FOR_COLLECTION":
    case "OUT_FOR_DELIVERY":
      return ["COMPLETED", "CANCELLED"];
    default:
      return [];
  }
}

export const canTransition = (from: OrderStatus, to: OrderStatus, f: FulfillmentType) => nextStatuses(from, f).includes(to);

/** Timeline steps shown to customers. */
export function timelineSteps(fulfillment: FulfillmentType): OrderStatus[] {
  return fulfillment === "DELIVERY"
    ? ["PENDING", "CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY", "COMPLETED"]
    : ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_COLLECTION", "COMPLETED"];
}
