import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getProductBySlug, getRelated } from "@/lib/catalog";
import { siteConfig } from "@/lib/config";
import { unitPrice } from "@/lib/pricing";
import { ImageGallery } from "@/components/product/ImageGallery";
import { AddToCartForm } from "@/components/product/AddToCartForm";
import { ProductGrid } from "@/components/product/ProductCard";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug(params.slug);
  if (!p) return { title: "Product not found" };
  const desc = (p.description || `Buy ${p.name} from ${siteConfig.storeName}.`).slice(0, 155);
  return { title: p.name, description: desc, alternates: { canonical: `/products/${p.slug}` }, openGraph: { title: p.name, description: desc, images: p.images[0] ? [p.images[0].url] : undefined } };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProductBySlug(params.slug);
  if (!p) notFound();
  const related = await getRelated(p.categoryId, p.id);
  const variants = p.variants.map((v) => ({ id: v.id, name: v.name, stock: v.stock, price: unitPrice(p.priceNpr, v.priceNpr) }));
  return (
    <div className="container-page py-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/products" className="hover:text-slate-900">Products</Link>
        <ChevronRight className="h-4 w-4" aria-hidden />
        <Link href={`/products?category=${p.category.slug}`} className="hover:text-slate-900">{p.category.name}</Link>
      </nav>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ImageGallery images={p.images.map((i) => ({ url: i.url, alt: i.alt }))} name={p.name} />
        <div>
          <p className="text-sm text-slate-500">{p.category.name}</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{p.name}</h1>
          <p className="mt-1 text-xs text-slate-500">SKU: {p.sku}</p>
          <div className="mt-6">
            <AddToCartForm productId={p.id} basePrice={p.priceNpr} baseStock={p.stock} variants={variants} maxQty={siteConfig.maxQtyPerLine} />
          </div>
          {p.description && (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="text-base font-semibold">Description</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{p.description}</p>
            </div>
          )}
          <p className="mt-6 text-sm text-slate-600">
            Pay on delivery or at school. See <Link href="/shipping" className="link">delivery</Link> and <Link href="/returns" className="link">returns</Link>.
          </p>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-semibold">Related products</h2>
          <ProductGrid items={related} />
        </section>
      )}
    </div>
  );
}
