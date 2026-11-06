import "server-only";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/config";
import { displayPrice, isInStock, totalStock } from "@/lib/pricing";

export type ProductCardData = {
  slug: string;
  name: string;
  price: number;
  from: boolean;
  inStock: boolean;
  lowStock: boolean;
  imageUrl: string | null;
  imageAlt: string;
  category: string;
};

export const SORTS = ["newest", "popular", "price-asc", "price-desc"] as const;
export type Sort = (typeof SORTS)[number];
export const SORT_LABEL: Record<Sort, string> = { newest: "Newest", popular: "Most popular", "price-asc": "Price: low to high", "price-desc": "Price: high to low" };

const cardInclude = {
  images: { orderBy: { sortOrder: "asc" }, take: 1 },
  variants: { select: { priceNpr: true, stock: true } },
  category: { select: { name: true } },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export function toCard(p: CardRow): ProductCardData {
  const { price, from } = displayPrice(p);
  const inStock = isInStock(p);
  return {
    slug: p.slug,
    name: p.name,
    price,
    from,
    inStock,
    lowStock: inStock && totalStock(p) <= siteConfig.lowStockThreshold,
    imageUrl: p.images[0]?.url ?? null,
    imageAlt: p.images[0]?.alt || p.name,
    category: p.category.name,
  };
}

const orderBy: Record<Sort, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  popular: [{ soldCount: "desc" }, { createdAt: "desc" }],
  "price-asc": [{ priceNpr: "asc" }, { createdAt: "desc" }],
  "price-desc": [{ priceNpr: "desc" }, { createdAt: "desc" }],
};

export async function listProducts(opts: { q?: string; category?: string; sort: Sort; page: number }) {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(opts.category ? { category: { slug: opts.category } } : {}),
    ...(opts.q
      ? { OR: [{ name: { contains: opts.q, mode: "insensitive" } }, { description: { contains: opts.q, mode: "insensitive" } }, { sku: { contains: opts.q, mode: "insensitive" } }] }
      : {}),
  };
  const [rows, total] = await db.$transaction([
    db.product.findMany({ where, orderBy: orderBy[opts.sort], skip: (opts.page - 1) * siteConfig.pageSize, take: siteConfig.pageSize, include: cardInclude }),
    db.product.count({ where }),
  ]);
  return { items: rows.map(toCard), total, pages: Math.max(1, Math.ceil(total / siteConfig.pageSize)) };
}

export const getCategories = unstable_cache(
  async () => db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true, description: true } }),
  ["categories"],
  { revalidate: 300, tags: ["categories"] },
);

export const getHomeData = unstable_cache(
  async () => {
    const [featured, newest, best] = await Promise.all([
      db.product.findMany({ where: { isActive: true, isFeatured: true }, orderBy: { updatedAt: "desc" }, take: 4, include: cardInclude }),
      db.product.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 4, include: cardInclude }),
      db.product.findMany({ where: { isActive: true, soldCount: { gt: 0 } }, orderBy: { soldCount: "desc" }, take: 4, include: cardInclude }),
    ]);
    return { featured: featured.map(toCard), newest: newest.map(toCard), best: best.map(toCard) };
  },
  ["home"],
  { revalidate: 60, tags: ["products"] },
);

export async function getProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { slug, isActive: true },
    include: { images: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { name: "asc" } }, category: true },
  });
}

export async function getRelated(categoryId: string, excludeId: string) {
  const rows = await db.product.findMany({ where: { categoryId, isActive: true, id: { not: excludeId } }, orderBy: { soldCount: "desc" }, take: 4, include: cardInclude });
  return rows.map(toCard);
}
