"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import clsx from "clsx";
import { addToCart } from "@/lib/cart-actions";
import { formatNpr } from "@/lib/money";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";

type Variant = { id: string; name: string; stock: number; price: number };

export function AddToCartForm({ productId, basePrice, baseStock, variants, maxQty }: { productId: string; basePrice: number; baseStock: number; variants: Variant[]; maxQty: number }) {
  const [state, action] = useFormState(addToCart, null);
  const [variantId, setVariantId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const toast = useToast();

  const selected = variants.find((v) => v.id === variantId);
  const price = selected ? selected.price : variants.length ? Math.min(...variants.map((v) => v.price)) : basePrice;
  const stock = variants.length ? (selected ? selected.stock : 0) : baseStock;
  const limit = Math.max(1, Math.min(maxQty, stock || 1));
  const allSoldOut = variants.length ? variants.every((v) => v.stock <= 0) : baseStock <= 0;
  const q = useMemo(() => Math.min(qty, limit), [qty, limit]);

  useEffect(() => {
    if (state?.message) toast(state.message, state.ok ? "success" : "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (allSoldOut) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700" role="status">
        This item is currently out of stock.
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={variantId} />
      <input type="hidden" name="quantity" value={q} />
      <p className="text-2xl font-semibold tabular-nums">
        {variants.length > 0 && !selected && new Set(variants.map((v) => v.price)).size > 1 && <span className="mr-1 text-sm font-normal text-slate-500">From</span>}
        {formatNpr(price)}
      </p>

      {variants.length > 0 && (
        <fieldset>
          <legend className="label">Option</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={v.stock <= 0}
                onClick={() => {
                  setVariantId(v.id);
                  setQty(1);
                }}
                aria-pressed={variantId === v.id}
                className={clsx("min-h-[44px] min-w-[56px] rounded-md border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:line-through", variantId === v.id ? "border-brand-700 bg-brand-50 font-medium text-brand-800" : "border-slate-300 bg-white hover:border-slate-400")}
              >
                {v.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div>
        <span className="label" id="qty-label">
          Quantity
        </span>
        <div className="inline-flex items-center rounded-md border border-slate-300 bg-white" role="group" aria-labelledby="qty-label">
          <button type="button" onClick={() => setQty(Math.max(1, q - 1))} disabled={q <= 1} aria-label="Decrease quantity" className="flex h-11 w-11 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40">
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
            {q}
          </span>
          <button type="button" onClick={() => setQty(Math.min(limit, q + 1))} disabled={q >= limit} aria-label="Increase quantity" className="flex h-11 w-11 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40">
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {(variants.length === 0 || selected) && <p className="mt-1.5 text-xs text-slate-500">{stock <= 5 ? `Only ${stock} left in stock` : "In stock"}</p>}
      </div>

      {state && !state.ok && state.message && (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingText="Adding…">
          <ShoppingCart className="h-4 w-4" aria-hidden /> Add to cart
        </SubmitButton>
        {state?.ok && (
          <Link href="/cart" className="btn btn-secondary">
            View cart
          </Link>
        )}
      </div>
    </form>
  );
}
