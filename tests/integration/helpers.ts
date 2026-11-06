import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

export const hasDb = Boolean(process.env.TEST_DATABASE_URL);

export async function makeProduct(opts: { stock?: number; price?: number; variants?: { name: string; stock: number; price?: number }[] } = {}) {
  const cat = await db.category.upsert({ where: { slug: "test-cat" }, update: {}, create: { name: "Test Category", slug: "test-cat" } });
  const id = randomUUID().slice(0, 8);
  return db.product.create({
    data: {
      sku: `T-${id}`, slug: `t-${id}`, name: `Test ${id}`, priceNpr: opts.price ?? 100, stock: opts.stock ?? 0, categoryId: cat.id,
      variants: opts.variants ? { create: opts.variants.map((v, i) => ({ name: v.name, sku: `T-${id}-${i}`, stock: v.stock, priceNpr: v.price ?? null })) } : undefined,
    },
    include: { variants: true },
  });
}

export async function makeCart(items: { productId: string; variantId?: string; quantity: number }[]) {
  return db.cart.create({
    data: { anonToken: randomUUID(), items: { create: items.map((i) => ({ productId: i.productId, variantId: i.variantId ?? null, lineKey: `${i.productId}:${i.variantId ?? "-"}`, quantity: i.quantity })) } },
  });
}

export const checkout = (method: "COD" | "PAY_AT_SCHOOL" = "PAY_AT_SCHOOL") => ({
  name: "Test Student", phone: "9841234567", email: "student@example.com", method,
  address: method === "COD" ? "Tole 1" : undefined, city: method === "COD" ? "Kathmandu" : undefined,
  idempotencyKey: randomUUID(),
});
