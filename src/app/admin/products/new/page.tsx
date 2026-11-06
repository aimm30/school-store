import { requireAdminPage } from "@/lib/auth/session";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { createProduct } from "@/lib/admin/actions";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdminPage();
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  if (!categories.length) {
    return (
      <div><PageHeader title="New product" /><p className="card p-5 text-sm">Create a category first. <Link href="/admin/categories" className="link">Go to categories</Link></p></div>
    );
  }
  return (
    <div className="max-w-3xl">
      <PageHeader title="New product" />
      <ProductForm action={createProduct} categories={categories} submitLabel="Create product" initial={{ name: "", sku: "", description: "", categoryId: "", priceNpr: "", stock: "0", isFeatured: false, isActive: true, variants: [], images: [] }} />
    </div>
  );
}
