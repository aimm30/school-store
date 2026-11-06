"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import clsx from "clsx";
import { FieldShell } from "./Field";
import { passwordStrength } from "@/lib/password-strength";

const BAR = ["bg-slate-200", "bg-red-500", "bg-amber-500", "bg-lime-500", "bg-green-600"];

export function PasswordField({ label, name, errors, autoComplete, showStrength, hint }: { label: string; name: string; errors?: string[]; autoComplete: string; showStrength?: boolean; hint?: string }) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const strength = passwordStrength(value);
  return (
    <FieldShell label={label} name={name} errors={errors} hint={hint}>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={errors?.length ? true : undefined}
          aria-describedby={errors?.length ? `${name}-error` : undefined}
          className={clsx("input pr-11", errors?.length && "input-error")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-800"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
      {showStrength && value && (
        <div className="mt-2" aria-live="polite">
          <div className="flex gap-1" aria-hidden>
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={clsx("h-1 flex-1 rounded-full transition-colors duration-300", i <= strength.score ? BAR[strength.score] : "bg-slate-200")} />
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">Strength: {strength.label}</p>
        </div>
      )}
    </FieldShell>
  );
}
