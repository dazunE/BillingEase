"use client";

import { useState } from "react";
import { audienceStyles as a } from "@/components/site/illustrations/audience";
import { cx } from "@/components/ui";
import { COUNTRY_INVOICES } from "@/content/site/countries";
import { COUNTRY_META, type SiteCountry } from "@/content/site/country";

/** Pick a country, see its tax and its invoice (prototype SiteGlobal "Pick your country. See your invoice."). */
export function InvoicePicker({ initial }: { initial: SiteCountry }) {
  const [c, setC] = useState<SiteCountry>(initial);
  const inv = COUNTRY_INVOICES[c];
  const meta = COUNTRY_META[c];
  return (
    <>
      <div role="group" aria-label="Country" className="flex flex-wrap gap-2">
        {(["uk", "lk"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={k === c}
            onClick={() => setC(k)}
            className={cx("inline-flex min-h-11 items-center gap-2 rounded-full border py-1 pl-1 pr-4 text-sm font-bold", k === c ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-input")}
          >
            <span className={cx("flex size-8 items-center justify-center rounded-full text-[11px] font-bold", k === c ? "bg-violet text-ink" : "bg-due-bg")}>{COUNTRY_INVOICES[k].flag}</span>
            {COUNTRY_META[k].name}
          </button>
        ))}
      </div>
      <div key={c} className={cx(a.in, "flex flex-wrap items-stretch gap-4")} aria-live="polite">
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(20px,3vw,28px)]">
          <span className="text-[13px] font-bold text-muted">
            {meta.name} · {meta.currency} · {meta.yearWord} {meta.taxYear}
          </span>
          <span className="font-display text-[clamp(36px,4vw,52px)] font-bold leading-none tracking-[-0.035em]">{inv.tax}</span>
          <span className="text-sm text-ink2">{inv.taxLine}</span>
          <ul className="flex flex-col gap-2">
            {inv.rates.map(([r, l]) => (
              <li key={l} className="flex items-center gap-3 text-sm">
                <span className="min-w-14 rounded-lg bg-due-bg px-2 py-1 text-center text-xs font-bold">{r}</span>
                {l}
              </li>
            ))}
          </ul>
          <p className="mt-auto rounded-2xl bg-bg p-3.5 text-[13px] leading-normal text-ink2">{inv.note}</p>
        </div>
        <div className="box-border flex min-w-0 flex-[1_1_420px] items-center justify-center rounded-3xl bg-tint p-[clamp(16px,4vw,40px)]">
          <div className="box-border flex w-full max-w-[420px] flex-col gap-3 rounded-[18px] bg-white p-[clamp(16px,3vw,24px)] text-[13px] shadow-[0_12px_32px_rgba(24,22,31,0.12)]">
            <span className="flex flex-wrap items-start justify-between gap-2">
              <span className="flex min-w-0 flex-col">
                <span className="font-bold">{inv.doc.from}</span>
                <span className="text-[11px] text-muted">{inv.doc.ids}</span>
              </span>
              <span className="flex flex-col items-end">
                <span className="font-display text-xs font-extrabold tracking-[0.06em]">{inv.doc.kind}</span>
                <span className="text-[11px] text-muted">
                  {inv.doc.no} · {inv.doc.date}
                </span>
              </span>
            </span>
            <span className="flex flex-col rounded-xl bg-bg p-3">
              <span className="text-[10px] font-bold tracking-[0.06em] text-muted">BILL TO</span>
              <span className="font-bold">{inv.doc.to}</span>
            </span>
            {inv.doc.rows.map(([l, v]) => (
              <span key={l} className="flex justify-between gap-3 border-b border-divider pb-2">
                <span className="text-ink2">{l}</span>
                <span className="tabular">{v}</span>
              </span>
            ))}
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-bold">Total</span>
              <span className="tabular font-display text-[22px] font-bold tracking-[-0.02em]">{inv.doc.total}</span>
            </span>
            <span className="text-[11px] text-muted">{inv.doc.pay}</span>
          </div>
        </div>
      </div>
    </>
  );
}
