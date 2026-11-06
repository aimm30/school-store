import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/config";
import { computeTotals, unitPrice, availableStock } from "@/lib/pricing";
import type { CheckoutInput } from "@/lib/validation";
import { generateOrderNumber } from "./number";

/** A problem the customer can understand and act on (out of stock, empty cart, ...). */
export class OrderError extends Error {}

export async function createOrder(
  input: CheckoutInput,
  ctx: { cartId: string; userId: string | null },
): Promise<{ publicId: string }> {
  const existing = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { publicId: true } });
  if (existing) return existing;

  const fulfillment = input.method === "COD" ? "DELIVERY" : "SCHOOL_COLLECTION";

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const items = await tx.cartItem.findMany({
          where: { cartId: ctx.cartId },
          orderBy: { id: "asc" },
          include: { product: { include: { _count: { select: { variants: true } } } }, variant: true },
        });
        if (!items.length) throw new OrderError("Your cart is empty.");

        const lines = items.map((i) => {
          if (!i.product.isActive) throw new OrderError(`"${i.product.name}" is no longer available. Please remove it from your cart.`);
          if (i.product._count.variants > 0 && !i.variant) throw new OrderError(`Please re-add "${i.product.name}" and choose an option.`);
          const price = unitPrice(i.product.priceNpr, i.variant?.priceNpr); // server-side price, never from the client
          return {
            productId: i.productId,
            variantId: i.variantId,
            name: i.product.name,
            variantName: i.variant?.name ?? null,
            sku: i.variant?.sku ?? i.product.sku,
            unitPrice: price,
            quantity: i.quantity,
            lineTotal: price * i.quantity,
            displayAvailable: availableStock(i.product, i.variant),
          };
        });

        const totals = computeTotals(lines, fulfillment === "DELIVERY" ? siteConfig.deliveryFee : 0);

        const order = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(siteConfig.orderPrefix),
            idempotencyKey: input.idempotencyKey,
            userId: ctx.userId,
            fulfillment,
            paymentMethod: input.method,
            customerName: input.name,
            phone: input.phone,
            email: input.email,
            addressLine: fulfillment === "DELIVERY" ? input.address : null,
            city: fulfillment === "DELIVERY" ? input.city : null,
            landmark: fulfillment === "DELIVERY" ? input.landmark : null,
            notes: input.notes,
            subtotal: totals.subtotal,
            deliveryFee: totals.deliveryFee,
            total: totals.total,
            items: {
              create: lines.map(({ displayAvailable: _d, ...l }) => l),
            },
            payments: { create: { method: input.method, status: "UNPAID", amount: totals.total } },
          },
          select: { publicId: true },
        });

        // Atomic, conditional stock decrement: fails if another order took the stock first.
        for (const l of lines) {
          const res = l.variantId
            ? await tx.productVariant.updateMany({ where: { id: l.variantId, stock: { gte: l.quantity } }, data: { stock: { decrement: l.quantity } } })
            : await tx.product.updateMany({ where: { id: l.productId!, stock: { gte: l.quantity } }, data: { stock: { decrement: l.quantity } } });
          if (res.count === 0) {
            const label = l.variantName ? `${l.name} (${l.variantName})` : l.name;
            throw new OrderError(`Sorry, "${label}" doesn't have enough stock for your order (${Math.max(l.displayAvailable, 0)} left). Please update your cart.`);
          }
          await tx.product.update({ where: { id: l.productId! }, data: { soldCount: { increment: l.quantity } } });
        }

        await tx.cartItem.deleteMany({ where: { cartId: ctx.cartId } });
        return order;
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = String(err.meta?.target ?? "");
        if (target.includes("idempotencyKey")) {
          const again = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { publicId: true } });
          if (again) return again;
        }
        if (target.includes("orderNumber")) continue; // extremely unlikely collision: retry with a new number
      }
      throw err;
    }
  }
  throw new Error("Could not allocate an order number.");
}
