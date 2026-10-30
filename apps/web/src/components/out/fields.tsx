"use client";

import type { OutCategory } from "@billingease/contracts";
import { useState, type ReactNode } from "react";
import { currencySymbol } from "@billingease/core";
import { Field, Input, cx } from "@/components/ui";

/** A row of pill-shaped radio buttons. */
export function Chips({ name, legend, options, value, onChange, error, hint, className }: {
  name: string; legend: string; options: { id: string; label: ReactNode }[]; value: string; onChange: (v: string) => void; error?: string; hint?: string; className?: string;
}) {
  return (
    <fieldset className={cx("flex flex-col gap-2", className)}>
      <legend className="mb-1.5 text-[13px] font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.id} className={cx("inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-coming",
            value === o.id ? "border-going bg-going-tint" : "border-line bg-white hover:border-input")}>
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
      {error && <span className="text-xs font-semibold text-late">{error}</span>}
    </fieldset>
  );
}


export function MoneyInput({ currency, className, ...props }: React.ComponentProps<"input"> & { currency: "GBP" | "LKR" | "USD" }) {
  return (
    <span className={cx("relative flex", className)}>
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted">{currencySymbol(currency)}</span>
      <Input inputMode="decimal" autoComplete="off" placeholder="0.00" {...props} className={cx(currency === "LKR" ? "pl-10" : "pl-7", "tabular")} />
    </span>
  );
}

/** Number, date and bank for a cheque. Shown only when the method is Cheque. */
export function ChequeFields({ errors, values, date }: { errors: Record<string, string>; values: Record<string, string>; date?: string }) {
  return (
    <div className="grid gap-3 rounded-2xl bg-surface p-4 sm:grid-cols-3">
      <Field label="Cheque number" error={errors.chequeNumber}>
        <Input name="chequeNumber" defaultValue={values.chequeNumber} inputMode="numeric" />
      </Field>
      <Field label="Date on the cheque" error={errors.chequeDate}>
        <Input type="date" name="chequeDate" defaultValue={values.chequeDate ?? date} />
      </Field>
      <Field label="Bank" hint="Optional" error={errors.chequeBank}>
        <Input name="chequeBank" defaultValue={values.chequeBank} />
      </Field>
    </div>
  );
}

/** Category cards: plain name first, the official name small, and the not-allowable and capital badges. */
export function CategoryPicker({ categories, value, onChange, allowLater, error, source, name = "categoryId" }: {
  categories: OutCategory[]; value: string; onChange: (v: string) => void; allowLater?: boolean; error?: string; source?: string; name?: string;
}) {
  const card = (id: string, title: string, sub: string, badge?: ReactNode) => (
    <label key={id} className={cx("be-cat flex min-w-0 cursor-pointer flex-col gap-0.5 rounded-xl border p-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-coming",
      value === id ? "border-going bg-going-tint ring-1 ring-going" : "border-line bg-white hover:border-ink2")}>
      <input type="radio" name={name} value={id} checked={value === id} onChange={() => onChange(id)} className="sr-only" />
      <span className="text-sm font-bold leading-snug">{title}</span>
      <span className="text-xs leading-snug text-muted [overflow-wrap:anywhere]">{sub}</span>
      {badge}
    </label>
  );
  return (
    <fieldset className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <legend className="text-[13px] font-semibold">Category</legend>
        {source && <span className="text-xs text-muted">{source}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
        {categories.map((c) => card(c.id, c.name, c.official,
          c.capital ? <span className="mt-1 self-start rounded bg-due-bg px-1.5 py-0.5 text-[11px] font-bold text-due">Capital: allowances instead</span>
            : !c.allowable ? <span className="mt-1 self-start rounded bg-due-bg px-1.5 py-0.5 text-[11px] font-bold text-due">Not allowable</span> : null))}
        {allowLater && card("later", "Sort it later", "It waits in Needs you until you pick")}
      </div>
      {error && <span className="text-xs font-semibold text-late">{error}</span>}
    </fieldset>
  );
}

/** Photo or PDF picker. The file is uploaded after the record is saved. */
export function FilePicker({ file, onFile, hint, error }: { file: File | null; onFile: (f: File | null) => void; hint: string; error?: string }) {
  const [key, setKey] = useState(0);
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-input p-4">
      <span className="text-[13px] font-semibold">Receipt or invoice <span className="font-normal text-muted">(optional)</span></span>
      <span className="text-xs text-muted">{hint}</span>
      {file ? (
        <span className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-md bg-info-bg px-2 py-1 text-[11px] font-bold text-info">{file.type === "application/pdf" ? "PDF" : "IMG"}</span>
          <span className="min-w-0 truncate font-semibold">{file.name}</span>
          <button type="button" className="min-h-11 underline underline-offset-4" onClick={() => { onFile(null); setKey((k) => k + 1); }}>Remove</button>
        </span>
      ) : (
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 self-start rounded-full bg-ink/[0.07] px-4 text-sm font-semibold hover:bg-ink/[0.11] has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-coming">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7" /></svg>
          Attach a photo or PDF
          <input key={key} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,application/pdf" className="sr-only" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        </label>
      )}
      {error && <span className="text-xs font-semibold text-late">{error}</span>}
    </div>
  );
}

/** Sends a file to the upload route handler; returns an error message or null. */
export async function uploadFile(ownerType: "expense" | "bill", ownerId: string, file: File): Promise<string | null> {
  if (file.size > 10 * 1024 * 1024) return "That file is over 10 MB. Try a smaller photo or PDF.";
  const fd = new FormData();
  fd.append("ownerType", ownerType);
  fd.append("ownerId", ownerId);
  fd.append("file", file);
  const res = await fetch("/app/out/attachments", { method: "POST", body: fd });
  if (res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.error?.message ?? "The file didn't upload. Try again.";
}

/** VAT inside a VAT-inclusive amount, at a rate in basis points. */
export function vatInside(gross: number, bps: number) {
  return Math.round(gross - (gross * 10000) / (10000 + bps));
}

/** Parses a typed amount for live previews (the server checks it properly). */
export function previewMinor(v: string) {
  const cleaned = v.replace(/[,\s£]|rs\.?/gi, "");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return 0;
  const [w, f = ""] = cleaned.split(".");
  return Number(w) * 100 + Number(f.padEnd(2, "0"));
}

export function Alert({ state }: { state: { ok?: boolean; message?: string } | undefined }) {
  if (!state?.message) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={cx("rounded-xl px-4 py-3 text-sm font-semibold", state.ok ? "bg-pos-bg text-pos" : "bg-late-bg text-late")}>
      {state.message}
    </p>
  );
}
