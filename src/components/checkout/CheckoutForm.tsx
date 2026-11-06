"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { Banknote, School } from "lucide-react";
import clsx from "clsx";
import { placeOrder } from "@/lib/checkout-actions";
import { Field, FieldShell, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

type Defaults = { name: string; email: string; phone: string; address: string; city: string; landmark: string };

export function CheckoutForm({ idempotencyKey, defaults }: { idempotencyKey: string; defaults: Defaults }) {
  const [state, action] = useFormState(placeOrder, null);
  const [method, setMethod] = useState<"COD" | "PAY_AT_SCHOOL">("COD");
  const e = state?.fieldErrors;
  const options = [
    { value: "COD" as const, title: "Cash on Delivery", desc: "Pay in cash when your order is delivered.", Icon: Banknote },
    { value: "PAY_AT_SCHOOL" as const, title: "Pay at School (collection)", desc: "Collect your order at school and pay there.", Icon: School },
  ];
  return (
    <form action={action} className="space-y-8" noValidate>
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <FormMessage state={state} />

      <fieldset className="space-y-3">
        <legend className="text-base font-semibold">Payment &amp; fulfilment</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map(({ value, title, desc, Icon }) => (
            <label key={value} className={clsx("flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors", method === value ? "border-brand-600 bg-brand-50" : "border-slate-300 bg-white hover:border-slate-400")}>
              <input type="radio" name="method" value={value} checked={method === value} onChange={() => setMethod(value)} className="mt-1 h-4 w-4" />
              <span>
                <span className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4" aria-hidden /> {title}</span>
                <span className="mt-0.5 block text-sm text-slate-600">{desc}</span>
              </span>
            </label>
          ))}
        </div>
        {e?.method && <p role="alert" className="text-xs font-medium text-red-600">{e.method[0]}</p>}
        <p className="text-xs text-slate-500">Your order is not marked as paid until the store receives your payment.</p>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-base font-semibold">Your details</legend>
        <Field label="Full name" name="name" autoComplete="name" required defaultValue={defaults.name} errors={e?.name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mobile number" name="phone" type="tel" autoComplete="tel" inputMode="tel" required defaultValue={defaults.phone} errors={e?.phone} hint="e.g. 98XXXXXXXX" />
          <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={defaults.email} errors={e?.email} />
        </div>
      </fieldset>

      {method === "COD" ? (
        <fieldset className="space-y-4">
          <legend className="mb-1 text-base font-semibold">Delivery address</legend>
          <Field label="Street / tole / house details" name="address" autoComplete="street-address" required defaultValue={defaults.address} errors={e?.address} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" name="city" autoComplete="address-level2" required defaultValue={defaults.city} errors={e?.city} />
            <Field label="Landmark (optional)" name="landmark" defaultValue={defaults.landmark} errors={e?.landmark} />
          </div>
        </fieldset>
      ) : (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">We'll let you know when your order is ready to collect from the school store. No delivery address is needed.</p>
      )}

      <FieldShell label="Order notes (optional)" name="notes" errors={e?.notes}>
        <textarea id="notes" name="notes" rows={3} maxLength={500} className="input" placeholder="Class, section, or anything we should know" />
      </FieldShell>

      <SubmitButton className="btn-primary w-full sm:w-auto" pendingText="Placing order…">
        Place order
      </SubmitButton>
    </form>
  );
}
