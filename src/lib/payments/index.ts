import type { PaymentMethod } from "@prisma/client";

/**
 * Payment provider abstraction.
 *
 * Offline methods (COD, Pay at School) never auto-confirm: an administrator records the payment
 * after cash is actually received (see recordPaymentReceived).
 *
 * To add eSewa or Khalti later:
 *  1. Obtain merchant credentials from the provider and put them in environment variables.
 *  2. Implement an `OnlinePaymentProvider` that creates a payment session in `initiate` and
 *     verifies the provider's signed callback / server-to-server lookup in `verify`.
 *  3. Register it in `onlineProviders`, add the method to the checkout form, and mark an order PAID
 *     only inside `verify` after the provider confirms the transaction.
 */
export type OfflinePaymentMethod = Extract<PaymentMethod, "COD" | "PAY_AT_SCHOOL">;

export interface OnlinePaymentProvider {
  method: Extract<PaymentMethod, "ESEWA" | "KHALTI">;
  initiate(order: { id: string; orderNumber: string; total: number }): Promise<{ redirectUrl: string }>;
  verify(payload: unknown): Promise<{ orderId: string; paid: boolean; providerRef: string }>;
}

export const offlineMethods: OfflinePaymentMethod[] = ["COD", "PAY_AT_SCHOOL"];
export const onlineProviders: OnlinePaymentProvider[] = []; // intentionally empty until real credentials are configured
