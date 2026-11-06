"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import type { FormState } from "@/lib/form";
import { useToast } from "./Toast";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  fields: Record<string, string>;
  label: string;
  className?: string;
  /** When provided, a confirmation dialog is shown before the action runs. */
  confirm?: { title: string; description: string; confirmLabel: string };
};

function Confirm({ confirm, danger }: { confirm: NonNullable<Props["confirm"]>; danger: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={clsx("btn", danger ? "btn-danger" : "btn-primary")}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {confirm.confirmLabel}
    </button>
  );
}

function Direct({ label, className }: { label: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={clsx("btn btn-sm", className ?? "btn-secondary")}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {label}
    </button>
  );
}

/** A button that runs a server action with hidden fields, shows feedback as a toast, and optionally asks for confirmation first. */
export function ActionForm({ action, fields, label, className, confirm }: Props) {
  const [state, formAction] = useFormState(action, null);
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const danger = Boolean(className?.includes("danger"));

  useEffect(() => {
    if (state?.message) toast(state.message, state.ok ? "success" : "error");
    if (state) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <form action={formAction} className="inline">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {confirm ? (
        <>
          <button type="button" onClick={() => setOpen(true)} className={clsx("btn btn-sm", className ?? "btn-secondary")}>
            {label}
          </button>
          <AnimatePresence>
            {open && (
              <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => setOpen(false)}>
                <motion.div
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="confirm-title"
                  aria-describedby="confirm-desc"
                  className="w-full max-w-md rounded-lg bg-white p-6 text-left shadow-xl"
                  initial={{ opacity: 0, scale: 0.97, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 id="confirm-title" className="text-lg font-semibold">
                    {confirm.title}
                  </h2>
                  <p id="confirm-desc" className="mt-2 text-sm text-slate-600">
                    {confirm.description}
                  </p>
                  <div className="mt-6 flex justify-end gap-3">
                    <button type="button" autoFocus onClick={() => setOpen(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <Confirm confirm={confirm} danger={danger} />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <Direct label={label} className={className} />
      )}
    </form>
  );
}
