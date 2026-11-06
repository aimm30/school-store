import "server-only";
import { cookies } from "next/headers";
import type { Cart } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { generateToken } from "@/lib/tokens";
import { availableStock, lineProblem, computeTotals, unitPrice, type LineProblem } from "@/lib/pricing";
import { siteConfig } from "@/lib/config";

const CART_COOKIE = "kns_cart";
const THIRTY_DAYS = 30 * 24 * 60 * 60;

export const lineKey = (productId: string, variantId?: string | null) => `${productId}:${variantId ?? "-"}`;

/** Read-only lookup. Safe to call while rendering. */
export async function findCart(): Promise<Cart | null> {
  const session = await getSession();
  if (session) return db.cart.findFirst({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" } });
  const token = cookies().get(CART_COOKIE)?.value;
  return token ? db.cart.findUnique({ where: { anonToken: token } }) : null;
}

/** Creates the cart if needed (and sets the cookie for visitors). Only call from server actions. */
export async function getOrCreateCart(): Promise<Cart> {
  const existing = await findCart();
  if (existing) return existing;
  const session = await getSession();
  if (session) return db.cart.create({ data: { userId: session.user.id } });
  const token = generateToken();
  const cart = await db.cart.create({ data: { anonToken: token } });
  cookies().set(CART_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: THIRTY_DAYS });
  return cart;
}

/** Called after login/signup: moves a visitor's cart into the account cart. */
export async function mergeAnonCart(userId: string): Promise<void> {
  const token = cookies().get(CART_COOKIE)?.value;
  if (!token) return;
  const anon = await db.cart.findUnique({ where: { anonToken: token }, include: { items: true } });
  if (anon) {
    await db.$transaction(async (tx) => {
      let target = await tx.cart.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
      target ??= await tx.cart.create({ data: { userId } });
      for (const item of anon.items) {
        const existing = await tx.cartItem.findUnique({ where: { cartId_lineKey: { cartId: target.id, lineKey: item.lineKey } } });
        if (existing) {
          await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: Math.min(existing.quantity + item.quantity, siteConfig.maxQtyPerLine) } });
        } else {
          await tx.cartItem.create({ data: { cartId: target.id, productId: item.productId, variantId: item.variantId, lineKey: item.lineKey, quantity: item.quantity } });
        }
      }
      await tx.cart.delete({ where: { id: anon.id } });
    });
  }
  cookies().delete(CART_COOKIE);
}

export type CartLine = {
  id: string;
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  variantName: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  available: number;
  lineTotal: number;
  problem: LineProblem;
};
export type CartView = { cartId: string | null; lines: CartLine[]; itemCount: number; subtotal: number; deliveryFee: number; total: number; hasProblems: boolean };

const EMPTY: CartView = { cartId: null, lines: [], itemCount: 0, subtotal: 0, deliveryFee: 0, total: 0, hasProblems: false };

export async function getCartView(): Promise<CartView> {
  const cart = await findCart();
  if (!cart) return EMPTY;
  const items = await db.cartItem.findMany({
    where: { cartId: cart.id },
    orderBy: { id: "asc" },
    include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } }, variant: true },
  });
  if (!items.length) return { ...EMPTY, cartId: cart.id };
  const lines: CartLine[] = items.map((i) => {
    const price = unitPrice(i.product.priceNpr, i.variant?.priceNpr);
    const available = availableStock(i.product, i.variant);
    return {
      id: i.id,
      productId: i.productId,
      variantId: i.variantId,
      slug: i.product.slug,
      name: i.product.name,
      variantName: i.variant?.name ?? null,
      imageUrl: i.product.images[0]?.url ?? null,
      unitPrice: price,
      quantity: i.quantity,
      available,
      lineTotal: price * i.quantity,
      problem: lineProblem(i.product.isActive, available, i.quantity),
    };
  });
  const totals = computeTotals(lines, siteConfig.deliveryFee);
  return { cartId: cart.id, lines, itemCount: lines.reduce((s, l) => s + l.quantity, 0), ...totals, hasProblems: lines.some((l) => l.problem) };
}

export async function getCartCount(): Promise<number> {
  const cart = await findCart();
  if (!cart) return 0;
  const agg = await db.cartItem.aggregate({ where: { cartId: cart.id }, _sum: { quantity: true } });
  return agg._sum.quantity ?? 0;
}
