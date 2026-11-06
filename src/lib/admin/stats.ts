import "server-only";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/config";

export async function getDashboardStats() {
  const [totalOrders, pendingOrders, revenue, activeProducts, lowStockProducts, lowStockVariants, recent, customers] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: "PENDING" } }),
    db.order.aggregate({ _sum: { total: true }, where: { status: "COMPLETED", paymentStatus: "PAID" } }),
    db.product.count({ where: { isActive: true } }),
    db.product.findMany({
      where: { isActive: true, variants: { none: {} }, stock: { lte: siteConfig.lowStockThreshold } },
      select: { id: true, name: true, sku: true, stock: true },
      orderBy: { stock: "asc" },
      take: 10,
    }),
    db.productVariant.findMany({
      where: { stock: { lte: siteConfig.lowStockThreshold }, product: { isActive: true } },
      select: { id: true, name: true, sku: true, stock: true, product: { select: { id: true, name: true } } },
      orderBy: { stock: "asc" },
      take: 10,
    }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, orderNumber: true, customerName: true, total: true, status: true, createdAt: true } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
  ]);
  const lowStock = [
    ...lowStockProducts.map((p) => ({ key: p.id, productId: p.id, label: p.name, sku: p.sku, stock: p.stock })),
    ...lowStockVariants.map((v) => ({ key: v.id, productId: v.product.id, label: `${v.product.name} — ${v.name}`, sku: v.sku, stock: v.stock })),
  ].sort((a, b) => a.stock - b.stock);
  return { totalOrders, pendingOrders, revenue: revenue._sum.total ?? 0, activeProducts, lowStock, recent, customers };
}
