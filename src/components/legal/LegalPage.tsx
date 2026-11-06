import { AlertTriangle } from "lucide-react";

/** Inline marker for details the school must supply or confirm. Never invent these. */
export function Confirm({ children }: { children: React.ReactNode }) {
  return <mark className="rounded bg-amber-100 px-1 text-amber-900">[School to confirm: {children}]</mark>;
}

export function Detail({ value, label }: { value: string; label: string }) {
  return value ? <>{value}</> : <Confirm>{label}</Confirm>;
}

export function LegalPage({ title, intro, children, template = true }: { title: string; intro?: string; children: React.ReactNode; template?: boolean }) {
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-3xl font-semibold">{title}</h1>
      {intro && <p className="mt-2 text-slate-600">{intro}</p>}
      {template && (
        <div role="note" className="mt-6 flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>This page is an editable template. Highlighted items must be confirmed by the school administration, and the full text should be reviewed by a qualified legal adviser before the store goes live. It does not claim compliance with any specific law.</p>
        </div>
      )}
      <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">{children}</div>
    </div>
  );
}
