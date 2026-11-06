"use client";

import { useTransition } from "react";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { removeCartItem, updateCartItem } from "@/lib/cart-actions";
import { useToast } from "@/components/ui/Toast";

export function CartLineControls({ id, quantity, max, name }: { id: string; quantity: number; max: number; name: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();

  const run = (fn: () => Promise<{ ok: boolean; message?: string } | null>) =>
    start(async () => {
      const res = await fn();
      if (res && !res.ok && res.message) toast(res.message, "error");
    });

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center rounded-md border border-slate-300 bg-white" role="group" aria-label={`Quantity for ${name}`}>
        <button type="button" disabled={pending || quantity <= 1} onClick={() => run(() => updateCartItem(id, quantity - 1))} aria-label={`Decrease quantity of ${name}`} className="flex h-10 w-10 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40">
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <span className="flex w-9 justify-center text-sm tabular-nums" aria-live="polite">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Updating" /> : quantity}
        </span>
        <button type="button" disabled={pending || quantity >= max} onClick={() => run(() => updateCartItem(id, quantity + 1))} aria-label={`Increase quantity of ${name}`} className="flex h-10 w-10 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40">
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <button type="button" disabled={pending} onClick={() => run(() => removeCartItem(id))} className="flex h-10 items-center gap-1 rounded-md px-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-red-600 disabled:opacity-40">
        <Trash2 className="h-4 w-4" aria-hidden /> Remove
      </button>
    </div>
  );
}
