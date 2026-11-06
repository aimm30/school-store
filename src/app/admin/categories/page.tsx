import { requireAdminPage } from "@/lib/auth/session";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { deleteCategory } from "@/lib/admin/actions";
import { NewCategoryForm, RenameCategoryForm } from "@/components/admin/CategoryForms";
import { ActionForm } from "@/components/ui/ActionForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategories() {
  await requireAdminPage();
  const categories = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
  return (
    <div>
      <PageHeader title="Categories" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="space-y-3">
            {categories.map((c) => (
              <li key={c.id} className="card flex flex-wrap items-end gap-3 p-4">
                <RenameCategoryForm id={c.id} name={c.name} description={c.description ?? ""} />
                <span className="pb-2 text-xs text-slate-500">{c._count.products} product{c._count.products === 1 ? "" : "s"}</span>
                <ActionForm action={deleteCategory} fields={{ id: c.id }} label="Delete" className="btn-danger" confirm={{ title: `Delete “${c.name}”?`, description: "Categories that still contain products can't be deleted.", confirmLabel: "Delete category" }} />
              </li>
            ))}
            {categories.length === 0 && <li className="card p-5 text-sm text-slate-600">No categories yet.</li>}
          </ul>
        </div>
        <NewCategoryForm />
      </div>
    </div>
  );
}
