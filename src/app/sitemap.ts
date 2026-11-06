import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.siteUrl;
  const pages = ["", "/products", "/about", "/contact", "/faq", "/shipping", "/returns", "/privacy", "/terms"].map((p) => ({ url: `${base}${p}` }));
  try {
    const [products, categories] = await Promise.all([db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }), db.category.findMany({ select: { slug: true } })]);
    return [...pages, ...categories.map((c) => ({ url: `${base}/products?category=${c.slug}` })), ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt }))];
  } catch {
    return pages;
  }
}
