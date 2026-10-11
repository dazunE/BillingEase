import { ApiFailure } from "./api";

/** What a form's server action returns, for useActionState. */
export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
} | undefined;

export function formValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !k.startsWith("$ACTION")) out[k] = v;
  return out;
}

/** Turns an API refusal into form errors; anything else is rethrown. */
export function failed(err: unknown, values?: Record<string, string>): FormState {
  if (err instanceof ApiFailure) return { message: err.message, errors: err.fields, values };
  throw err;
}

export const checked = (v: string | undefined) => v === "on" || v === "true" || v === "yes";
export const blankToNull = (v: string | undefined) => (v && v.trim() ? v.trim() : null);
