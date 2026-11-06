import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { hasDb, checkout, makeCart, makeProduct } from "./helpers";

vi.mock("server-only", () => ({}));

describe.skipIf(!hasDb)("order creation (requires TEST_DATABASE_URL)", () => {
  let db: typeof import("@/lib/db").db;
  let createOrder: typeof import("@/lib/orders/create").createOrder;
  let OrderError: typeof import("@/lib/orders/create").OrderError;
  let admin: typeof import("@/lib/orders/admin");

  beforeAll(async () => {
    ({ db } = await import("@/lib/db"));
    ({ createOrder, OrderError } = await import("@/lib/orders/create"));
    admin = await import("@/lib/orders/admin");
  });
  afterAll(async () => db?.$disconnect());

  it("creates an order with server-side prices and decrements stock (Journey 1)", async () => {
    const p = await makeProduct({ stock: 5, price: 250 });
    const cart = await makeCart([{ productId: p.id, quantity: 2 }]);
    const { publicId } = await createOrder(checkout(), { cartId: cart.id, userId: null });
    const order = await db.order.findUniqueOrThrow({ where: { publicId }, include: { items: true, payments: true } });
    expect(order.subtotal).toBe(500);
    expect(order.paymentStatus).toBe("UNPAID"); // never auto-paid
    expect(order.payments[0].status).toBe("UNPAID");
    expect(order.items[0].unitPrice).toBe(250);
    expect((await db.product.findUniqueOrThrow({ where: { id: p.id } })).stock).toBe(3);
    expect(await db.cartItem.count({ where: { cartId: cart.id } })).toBe(0);
  });

  it("prevents ordering more than the available stock (Journey 6)", async () => {
    const p = await makeProduct({ stock: 1 });
    const cart = await makeCart([{ productId: p.id, quantity: 2 }]);
    await expect(createOrder(checkout(), { cartId: cart.id, userId: null })).rejects.toBeInstanceOf(OrderError);
    expect((await db.product.findUniqueOrThrow({ where: { id: p.id } })).stock).toBe(1);
    expect(await db.order.count({ where: { items: { some: { productId: p.id } } } })).toBe(0);
  });

  it("only one of two concurrent orders wins the last item", async () => {
    const p = await makeProduct({ stock: 1 });
    const [c1, c2] = await Promise.all([makeCart([{ productId: p.id, quantity: 1 }]), makeCart([{ productId: p.id, quantity: 1 }])]);
    const results = await Promise.allSettled([createOrder(checkout(), { cartId: c1.id, userId: null }), createOrder(checkout(), { cartId: c2.id, userId: null })]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await db.product.findUniqueOrThrow({ where: { id: p.id } })).stock).toBe(0);
  });

  it("is idempotent for a repeated submission", async () => {
    const p = await makeProduct({ stock: 5 });
    const cart = await makeCart([{ productId: p.id, quantity: 1 }]);
    const input = checkout();
    const a = await createOrder(input, { cartId: cart.id, userId: null });
    const b = await createOrder(input, { cartId: cart.id, userId: null });
    expect(b.publicId).toBe(a.publicId);
    expect((await db.product.findUniqueOrThrow({ where: { id: p.id } })).stock).toBe(4);
  });

  it("uses variant stock and price", async () => {
    const p = await makeProduct({ price: 100, variants: [{ name: "M", stock: 2, price: 150 }] });
    const v = p.variants[0];
    const cart = await makeCart([{ productId: p.id, variantId: v.id, quantity: 2 }]);
    const { publicId } = await createOrder(checkout("COD"), { cartId: cart.id, userId: null });
    const order = await db.order.findUniqueOrThrow({ where: { publicId } });
    expect(order.subtotal).toBe(300);
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: v.id } })).stock).toBe(0);
  });

  it("cancelling restores stock; paid orders can't be cancelled; payment is recorded explicitly (Journey 3)", async () => {
    const p = await makeProduct({ stock: 4 });
    const cart = await makeCart([{ productId: p.id, quantity: 3 }]);
    const { publicId } = await createOrder(checkout(), { cartId: cart.id, userId: null });
    const order = await db.order.findUniqueOrThrow({ where: { publicId } });
    await expect(admin.changeOrderStatus(order.id, "COMPLETED")).rejects.toBeInstanceOf(OrderError); // can't skip steps
    await admin.changeOrderStatus(order.id, "CANCELLED");
    expect((await db.product.findUniqueOrThrow({ where: { id: p.id } })).stock).toBe(4);
    await expect(admin.recordPaymentReceived(order.id)).rejects.toBeInstanceOf(OrderError);

    const cart2 = await makeCart([{ productId: p.id, quantity: 1 }]);
    const o2 = await db.order.findUniqueOrThrow({ where: { publicId: (await createOrder(checkout(), { cartId: cart2.id, userId: null })).publicId } });
    await admin.recordPaymentReceived(o2.id);
    expect((await db.order.findUniqueOrThrow({ where: { id: o2.id } })).paymentStatus).toBe("PAID");
    await expect(admin.changeOrderStatus(o2.id, "CANCELLED")).rejects.toBeInstanceOf(OrderError);
  });
});
