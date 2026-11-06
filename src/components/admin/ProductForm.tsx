"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import type { FormState } from "@/lib/form";
import { Field, FieldShell, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";

type VariantRow = { id?: string; name: string; sku: string; stock: string; priceNpr: string };
export type ProductFormValues = {
  name: string; sku: string; description: string; categoryId: string; priceNpr: string; stock: string; isFeatured: boolean; isActive: boolean;
  variants: VariantRow[]; images: { id: string; url: string }[];
};

export function ProductForm({ action, categories, initial, submitLabel }: { action: (prev: FormState, fd: FormData) => Promise<FormState>; categories: { id: string; name: string }[]; initial: ProductFormValues; submitLabel: string }) {
  const [state, formAction] = useFormState(action, null);
  const [variants, setVariants] = useState<VariantRow[]>(initial.variants);
  const toast = useToast();
  const e = state?.fieldErrors;

  useEffect(() => {
    if (state?.ok && state.message) toast(state.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const setV = (i: number, patch: Partial<VariantRow>) => setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const hasVariants = variants.length > 0;

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <FormMessage state={state} />
      <div className="card space-y-4 p-5">
        <Field label="Product name" name="name" defaultValue={initial.name} required errors={e?.name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SKU" name="sku" defaultValue={initial.sku} required errors={e?.sku} hint="Unique product identifier, e.g. LAB-COAT-01" />
          <FieldShell label="Category" name="categoryId" errors={e?.categoryId}>
            <select id="categoryId" name="categoryId" defaultValue={initial.categoryId} required className="input">
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FieldShell>
        </div>
        <FieldShell label="Description" name="description" errors={e?.description}>
          <textarea id="description" name="description" rows={5} defaultValue={initial.description} maxLength={4000} className="input" />
        </FieldShell>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (NPR)" name="priceNpr" type="number" min={1} step={1} inputMode="numeric" defaultValue={initial.priceNpr} required errors={e?.priceNpr} />
          <Field label={hasVariants ? "Stock (ignored — set per option)" : "Stock quantity"} name="stock" type="number" min={0} step={1} inputMode="numeric" defaultValue={initial.stock} required disabled={false} errors={e?.stock} />
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex min-h-[32px] items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={initial.isActive} className="h-4 w-4" /> Visible in store</label>
          <label className="flex min-h-[32px] items-center gap-2"><input type="checkbox" name="isFeatured" defaultChecked={initial.isFeatured} className="h-4 w-4" /> Featured on homepage</label>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Options (optional)</h2>
            <p className="text-sm text-slate-600">For sizes or types, e.g. lab coat sizes. Each option has its own stock and an optional price.</p>
          </div>
          <button type="button" onClick={() => setVariants((v) => [...v, { name: "", sku: "", stock: "0", priceNpr: "" }])} className="btn btn-secondary btn-sm"><Plus className="h-4 w-4" aria-hidden /> Add option</button>
        </div>
        {e?.variants && <p role="alert" className="mb-2 text-xs font-medium text-red-600">Check each option: name, SKU and stock are required.</p>}
        <ul className="space-y-3">
          {variants.map((v, i) => (
            <li key={v.id ?? i} className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_90px_110px_auto]">
              <input aria-label="Option name" placeholder="Name (e.g. M)" value={v.name} onChange={(ev) => setV(i, { name: ev.target.value })} className="input" />
              <input aria-label="Option SKU" placeholder="SKU" value={v.sku} onChange={(ev) => setV(i, { sku: ev.target.value })} className="input" />
              <input aria-label="Option stock" type="number" min={0} placeholder="Stock" value={v.stock} onChange={(ev) => setV(i, { stock: ev.target.value })} className="input" />
              <input aria-label="Option price override" type="number" min={1} placeholder="Price" value={v.priceNpr} onChange={(ev) => setV(i, { priceNpr: ev.target.value })} className="input" />
              <button type="button" onClick={() => setVariants((vs) => vs.filter((_, idx) => idx !== i))} aria-label={`Remove option ${v.name || i + 1}`} className="flex h-11 w-11 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-red-600"><Trash2 className="h-4 w-4" aria-hidden /></button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold">Images</h2>
        <p className="text-sm text-slate-600">JPEG, PNG or WebP, up to 2 MB each, 5 per product.</p>
        {initial.images.length > 0 && (
          <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {initial.images.map((img) => (
              <li key={img.id} className="text-xs">
                <div className="relative aspect-square overflow-hidden rounded-md bg-slate-100"><Image src={img.url} alt="" fill sizes="120px" className="object-cover" /></div>
                <label className="mt-1 flex items-center gap-1"><input type="checkbox" name="removeImageIds" value={img.id} /> Remove</label>
              </li>
            ))}
          </ul>
        )}
        <label htmlFor="images" className="label mt-4">Add images</label>
        <input id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200" />
      </div>

      <div className="flex gap-3">
        <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
        <Link href="/admin/products" className="btn btn-secondary">Back to products</Link>
      </div>
    </form>
  );
}
