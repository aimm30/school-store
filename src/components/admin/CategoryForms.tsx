"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { createCategory, renameCategory } from "@/lib/admin/actions";
import { Field, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";

export function NewCategoryForm() {
  const [state, action] = useFormState(createCategory, null);
  const ref = useRef<HTMLFormElement>(null);
  const toast = useToast();
  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      toast(state.message ?? "Saved.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form ref={ref} action={action} className="card space-y-3 p-5" noValidate>
      <h2 className="text-base font-semibold">New category</h2>
      {state && !state.ok && <FormMessage state={state} />}
      <Field label="Name" name="name" required errors={state?.fieldErrors?.name} />
      <Field label="Description (optional)" name="description" errors={state?.fieldErrors?.description} />
      <SubmitButton pendingText="Adding…">Add category</SubmitButton>
    </form>
  );
}

export function RenameCategoryForm({ id, name, description }: { id: string; name: string; description: string }) {
  const [state, action] = useFormState(renameCategory, null);
  const toast = useToast();
  useEffect(() => {
    if (state?.message) toast(state.message, state.ok ? "success" : "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={action} className="flex flex-1 flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="min-w-[10rem] flex-1">
        <label htmlFor={`n-${id}`} className="sr-only">Category name</label>
        <input id={`n-${id}`} name="name" defaultValue={name} required className="input" />
      </div>
      <div className="min-w-[10rem] flex-1">
        <label htmlFor={`d-${id}`} className="sr-only">Description</label>
        <input id={`d-${id}`} name="description" defaultValue={description} placeholder="Description" className="input" />
      </div>
      <SubmitButton className="btn-secondary btn-sm" pendingText="Saving…">Save</SubmitButton>
    </form>
  );
}
