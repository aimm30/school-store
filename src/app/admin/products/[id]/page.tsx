import { requireAdminPage } from "@/lib/auth/session";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteProduct, updateProduct } from "@/lib/admin/actions";
import { ProductForm } from "@/components/admin/ProductForm";
import { ActionForm } from "@/components/ui/ActionForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: { id: string } }) {
  await requireAdminPage();
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id: params.id }, include: { images: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { name: "asc" } } } }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();
  return (
    <div className="max-w-3xl">
      <PageHeader title={product.name} description={`SKU ${product.sku}`}>
        <ActionForm
          action={deleteProduct}
          fields={{ id: product.id }}
          label="Delete product"
          className="btn-danger"
          confirm={{ title: "Delete this product?", description: "It will be removed from the store. Past orders keep their record of this item. This can't be undone.", confirmLabel: "Delete product" }}
        />
      </PageHeader>
      <ProductForm
        action={updateProduct.bind(null, product.id)}
        categories={categories}
        submitLabel="Save changes"
        initial={{
          name: product.name, sku: product.sku, description: product.description, categoryId: product.categoryId, priceNpr: String(product.priceNpr), stock: String(product.stock),
          isFeatured: product.isFeatured, isActive: product.isActive,
          variants: product.variants.map((v) => ({ id: v.id, name: v.name, sku: v.sku, stock: String(v.stock), priceNpr: v.priceNpr ? String(v.priceNpr) : "" })),
          images: product.images.map((i) => ({ id: i.id, url: i.url })),
        }}
      />
    </div>
  );
}
