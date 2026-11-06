import type { ZodError } from "zod";

export type FieldErrors = Record<string, string[] | undefined>;
export type FormState = { ok: boolean; message?: string; fieldErrors?: FieldErrors } | null;

export const fail = (message: string, fieldErrors?: FieldErrors): FormState => ({ ok: false, message, fieldErrors });
export const succeed = (message?: string): FormState => ({ ok: true, message });

export function fromZod(error: ZodError): FormState {
  return fail("Please correct the highlighted fields.", error.flatten().fieldErrors as FieldErrors);
}

/** Only allow same-site relative redirects. */
export function safeNext(next: unknown, fallback = "/account"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

export function withNotice(path: string, notice: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}notice=${notice}`;
}
