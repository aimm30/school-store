"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, succeed, type FormState } from "@/lib/form";
import { findCart, getOrCreateCart, lineKey } from "@/lib/cart";
import { availableStock } from "@/lib/pricing";
import { siteConfig } from "@/lib/config";

const addSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.coerce.number().int().min(1, "Choose at least 1.").max(siteConfig.maxQtyPerLine, `You can order up to ${siteConfig.maxQtyPerLine} of one item.`),
});

export async function addToCart(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = addSchema.safeParse({
    productId: formData.get("productId"),
    variantId: formData.get("variantId") || undefined,
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid selection.");
  const { productId, variantId, quantity } = parsed.data;

  try {
    const product = await db.product.findUnique({ where: { id: productId }, include: { variants: true } });
    if (!product || !product.isActive) return fail("This product is no longer available.");
    if (product.variants.length && !variantId) return fail("Please choose an option (for example a size).");
    const variant = variantId ? product.variants.find((v) => v.id === variantId) : null;
    if (variantId && !variant) return fail("That option is not available.");
    if (!product.variants.length && variantId) return fail("That option is not available.");

    const available = availableStock(product, variant);
    if (available <= 0) return fail("Sorry, this item is out of stock.");

    const cart = await getOrCreateCart();
    const key = lineKey(productId, variant?.id);
    const existing = await db.cartItem.findUnique({ where: { cartId_lineKey: { cartId: cart.id, lineKey: key } } });
    const newQty = (existing?.quantity ?? 0) + quantity;
    if (newQty > available) {
      return fail(existing ? `Only ${available} in stock — you already have ${existing.quantity} in your cart.` : `Only ${available} in stock.`);
    }
    if (newQty > siteConfig.maxQtyPerLine) return fail(`You can order up to ${siteConfig.maxQtyPerLine} of one item.`);

    await db.cartItem.upsert({
      where: { cartId_lineKey: { cartId: cart.id, lineKey: key } },
      create: { cartId: cart.id, productId, variantId: variant?.id ?? null, lineKey: key, quantity: newQty },
      update: { quantity: newQty },
    });
    revalidatePath("/", "layout");
    return succeed("Added to cart.");
  } catch (err) {
    console.error("[cart] add failed", err);
    return fail("We couldn't update your cart. Please try again.");
  }
}

export async function updateCartItem(itemId: string, quantity: number): Promise<FormState> {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > siteConfig.maxQtyPerLine) return fail("Invalid quantity.");
  try {
    const cart = await findCart();
    if (!cart) return fail("Your cart is empty.");
    const item = await db.cartItem.findFirst({ where: { id: itemId, cartId: cart.id }, include: { product: true, variant: true } });
    if (!item) return fail("That item is no longer in your cart.");
    const available = availableStock(item.product, item.variant);
    if (!item.product.isActive || available <= 0) return fail("This item is no longer available.");
    if (quantity > available) return fail(`Only ${available} in stock.`);
    await db.cartItem.update({ where: { id: item.id }, data: { quantity } });
    revalidatePath("/", "layout");
    return succeed();
  } catch (err) {
    console.error("[cart] update failed", err);
    return fail("We couldn't update your cart. Please try again.");
  }
}

export async function removeCartItem(itemId: string): Promise<FormState> {
  try {
    const cart = await findCart();
    if (!cart) return succeed();
    await db.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    revalidatePath("/", "layout");
    return succeed("Removed from cart.");
  } catch (err) {
    console.error("[cart] remove failed", err);
    return fail("We couldn't update your cart. Please try again.");
  }
}
