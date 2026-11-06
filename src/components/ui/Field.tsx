import clsx from "clsx";

type Errors = string[] | undefined;

export function FieldShell({ label, name, errors, hint, children }: { label: string; name: string; errors?: Errors; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      {children}
      {hint && !errors?.length && (
        <p id={`${name}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {errors?.length ? (
        <p id={`${name}-error`} role="alert" className="mt-1 text-xs font-medium text-red-600">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; errors?: Errors; hint?: string };

export function Field({ label, name, errors, hint, className, ...rest }: FieldProps) {
  return (
    <FieldShell label={label} name={name} errors={errors} hint={hint}>
      <input
        id={name}
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={clsx("input", errors?.length && "input-error", className)}
        {...rest}
      />
    </FieldShell>
  );
}

export function FormMessage({ state }: { state: { ok: boolean; message?: string } | null }) {
  if (!state?.message) return null;
  return (
    <div role={state.ok ? "status" : "alert"} className={clsx("rounded-md border px-3 py-2 text-sm", state.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800")}>
      {state.message}
    </div>
  );
}
