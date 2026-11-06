"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import clsx from "clsx";

export function SubmitButton({ children, pendingText, className }: { children: React.ReactNode; pendingText?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={clsx("btn", className ?? "btn-primary")}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? (pendingText ?? children) : children}
    </button>
  );
}
