"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { fail, fromZod, type FormState } from "@/lib/form";
import { checkoutSchema } from "@/lib/validation";
import { findCart } from "@/lib/cart";
import { getSession } from "@/lib/auth/session";
import { createOrder, OrderError } from "@/lib/orders/create";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const limit = rateLimit(`checkout:${clientIp()}`, 10, 10 * 60 * 1000);
  if (!limit.ok) return fail("Too many order attempts. Please wait a few minutes and try again.");

  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);

  let publicId: string;
  try {
    const cart = await findCart();
    if (!cart) return fail("Your cart is empty.");
    const session = await getSession();
    const order = await createOrder(parsed.data, { cartId: cart.id, userId: session?.user.id ?? null });
    publicId = order.publicId;
  } catch (err) {
    if (err instanceof OrderError) return fail(err.message);
    console.error("[checkout] failed", err);
    return fail("We couldn't place your order, and you have not been charged. Please try again.");
  }
  revalidatePath("/", "layout");
  redirect(`/order/${publicId}`);
}
