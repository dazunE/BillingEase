"use client";

import { useState } from "react";
import { audienceStyles as a } from "@/components/site/illustrations/audience";
import { cx } from "@/components/ui";
import { money } from "@/content/site/country";
import { LANDLORD_QUARTERS } from "@/content/site/landlords";

/** Pick a quarter to see Tom's property income under HMRC's headings (prototype SiteShops "sales tax by state", reworked). */
export function QuarterPicker({ label }: { label: string }) {
  const [i, setI] = useState(1);
  const q = LANDLORD_QUARTERS[i];
  const costs = q.rows.reduce((t, [, v]) => t + v, 0);
  return (
    <>
      <div className="flex flex-col gap-2.5">
        <span className="text-[13px] font-bold" id="qp-l">
          {label}
        </span>
        <div role="group" aria-labelledby="qp-l" className="flex flex-wrap gap-2">
          {LANDLORD_QUARTERS.map((x, n) => (
            <button
              key={x.q}
              type="button"
              aria-pressed={n === i}
              onClick={() => setI(n)}
              className={cx("min-h-11 rounded-full border px-4 text-[13px] font-bold", n === i ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-input")}
            >
              {x.q} · {x.span}
            </button>
          ))}
        </div>
      </div>
      <div key={i} aria-live="polite" className={cx(a.in, "box-border flex min-w-0 flex-col gap-4 rounded-[24px] bg-bg p-[clamp(18px,2.6vw,28px)]")}>
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-ink font-display text-xs font-bold text-violet">{q.q}</span>
            <span className="font-bold">UK property · {q.span}</span>
          </span>
          <span className={cx("rounded-full px-2.5 py-1 text-xs font-bold", i === 0 ? "bg-surface text-ink2" : i === 1 ? "bg-pos-bg text-pos" : "bg-due-bg text-due")}>{q.state}</span>
        </span>
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="tabular font-display text-[40px] font-bold leading-none tracking-[-0.035em]">{money(q.rent, "uk")}</span>
          <span className="text-sm text-ink2">rent this quarter · update due {q.due}</span>
        </span>
        <dl className="flex flex-col gap-1 rounded-2xl bg-white p-3.5 text-[13px]">
          {q.rows.map(([l, v]) => (
            <div key={l} className="flex justify-between gap-3 py-0.5">
              <dt className="text-ink2">{l}</dt>
              <dd className="tabular font-bold">{money(v, "uk")}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-line pt-1.5 font-bold">
            <dt>Costs</dt>
            <dd className="tabular">{money(costs, "uk")}</dd>
          </div>
          <div className="flex justify-between gap-3 pt-1 text-coming">
            <dt>Residential finance costs (kept apart)</dt>
            <dd className="tabular font-bold">{money(q.interest, "uk")}</dd>
          </div>
        </dl>
        <span className="text-xs text-muted">Pickering Lets is invented; figures are illustrative.</span>
      </div>
    </>
  );
}
