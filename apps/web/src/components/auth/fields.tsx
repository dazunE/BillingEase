"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cx } from "@/components/ui";
import { COUNTRY_CODES } from "@billingease/core";
import { SYMBOL, type Cty } from "./country";

/** Form pieces in the signed-out pages' style: a label, the control, then a hint or an error. */

const inputBase =
  "min-h-11 w-full rounded-[10px] border bg-white px-3.5 text-[15px] text-ink focus:outline-2 focus:outline-offset-1 focus:outline-coming";

export function AuthField({
  label,
  hint,
  error,
  aside,
  className,
  ...input
}: ComponentProps<"input"> & { label: string; hint?: ReactNode; error?: string; aside?: ReactNode }) {
  const id = useId();
  const note = `${id}-note`;
  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <label htmlFor={id} className="text-[13px] font-semibold">{label}</label>
        {aside}
      </span>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error || hint ? note : undefined}
        className={cx(inputBase, error ? "border-late" : "border-input")} {...input} />
      {error ? <FieldError id={note}>{error}</FieldError> : hint && <span id={note} className="text-[13px] leading-[1.45] text-muted">{hint}</span>}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return <span id={id} className="flex items-center gap-1.5 text-[13px] font-semibold text-late">{children}</span>;
}

/** 0 to 4. Below the minimum it's always 0. */
export function strength(p: string, min = 10) {
  if (p.length < min) return 0;
  let n = 1;
  if (p.length >= 14) n++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) n++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) n++;
  else if (/[\d\W_]/.test(p)) n = Math.max(n, 2);
  return Math.min(n, 4);
}

const LBL = ["Too short", "Weak", "Okay", "Strong", "Very strong"];
const COL = ["#A8200D", "#E0752D", "#C9A100", "#7A5AF8", "#2F5711"];

/** Password with a Show toggle, and (for new passwords) a strength meter. */
export function PasswordField({
  label,
  name,
  autoComplete,
  error,
  meter = false,
  min = 10,
  aside,
  value: controlled,
  onValue,
  shown: shownProp,
  onShown,
}: {
  label: string;
  name: string;
  autoComplete: string;
  error?: string;
  meter?: boolean;
  min?: number;
  aside?: ReactNode;
  value?: string;
  onValue?: (v: string) => void;
  shown?: boolean;
  onShown?: (v: boolean) => void;
}) {
  const id = useId();
  const [own, setOwn] = useState("");
  const [ownShown, setOwnShown] = useState(false);
  const value = controlled ?? own;
  const shown = shownProp ?? ownShown;
  const sc = strength(value, min);
  const left = min - value.length;
  const tip = !value ? `at least ${min} characters` : left > 0 ? `${left} more character${left === 1 ? "" : "s"}` : sc < 3 ? "add length, a capital, a number or a symbol" : "good to go";
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <label htmlFor={id} className="text-[13px] font-semibold">{label}</label>
        {aside}
      </span>
      <span className={cx("flex min-h-11 items-center rounded-[10px] border bg-white pl-3.5 pr-1 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-coming", error ? "border-late" : "border-input")}>
        <input
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => (onValue ? onValue(e.target.value) : setOwn(e.target.value))}
          aria-invalid={error ? true : undefined}
          aria-describedby={meter || error ? `${id}-note` : undefined}
          className="min-h-10 min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none"
          required
        />
        <button
          type="button"
          aria-pressed={shown}
          aria-controls={id}
          onClick={() => (onShown ? onShown(!shown) : setOwnShown(!shown))}
          className="min-h-9 min-w-11 px-2.5 text-[13px] font-semibold underline underline-offset-[3px]"
        >
          {shown ? "Hide" : "Show"}
        </button>
      </span>
      {meter && (
        <>
          <span className="flex gap-1" aria-hidden>
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: !value ? "#E2DFE8" : sc === 0 ? (i === 1 ? COL[0] : "#E2DFE8") : sc >= i ? COL[sc] : "#E2DFE8" }} />
            ))}
          </span>
          <span id={`${id}-note`} className="text-[13px] leading-[1.45] text-muted" aria-live="polite">
            Strength: <strong className="text-ink">{value ? LBL[sc] : "—"}</strong> · {tip}
          </span>
        </>
      )}
      {error && <FieldError id={meter ? undefined : `${id}-note`}>{error}</FieldError>}
    </div>
  );
}

/**
 * Where the business is, as a dropdown. A real select, so the form posts `country`. The picked
 * country's currency and tax office show underneath.
 */
export function CountrySelect({
  value,
  onChange,
  label,
  hint,
  error,
  names,
}: {
  value: Cty | "";
  onChange: (c: Cty | "") => void;
  label: string;
  hint?: ReactNode;
  error?: string;
  names: Record<Cty, { name: string; currency: string; line: string }>;
}) {
  const id = useId();
  const note = `${id}-note`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold">{label}</label>
      <span className="relative flex items-center">
        {value && (
          <span aria-hidden className={cx("pointer-events-none absolute left-2 flex size-7 items-center justify-center rounded-lg font-display text-xs font-bold", value === "lk" ? "bg-going-tint" : "bg-tint")}>
            {SYMBOL[value]}
          </span>
        )}
        <select
          id={id}
          name="country"
          value={value}
          onChange={(e) => onChange(e.target.value as Cty | "")}
          aria-invalid={error ? true : undefined}
          aria-describedby={note}
          required
          className={cx(inputBase, "cursor-pointer appearance-none pr-10", value ? "pl-11" : "text-muted", error ? "border-late" : "border-input")}
        >
          <option value="" disabled>Choose a country</option>
          {COUNTRY_CODES.map((c) => (
            <option key={c} value={c} className="text-ink">{names[c].name} · {names[c].currency}</option>
          ))}
        </select>
        <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute right-3.5 size-4 text-ink2"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      {error ? (
        <FieldError id={note}>{error}</FieldError>
      ) : (
        <span id={note} className="text-[13px] leading-[1.45] text-muted">
          {value && <strong className="font-semibold text-ink2">{names[value].line}. </strong>}
          {hint}
        </span>
      )}
    </div>
  );
}
