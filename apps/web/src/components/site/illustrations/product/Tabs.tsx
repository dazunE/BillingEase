"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/components/ui";
import { money, type SiteCountry } from "@/content/site/country";
import { SEG, SEG_BTN } from "./cls";

/** Roving-focus helper for a tablist: arrow keys move between tabs. */
export function onTabKeys(e: KeyboardEvent<HTMLElement>, count: number, cur: number, pick: (i: number) => void) {
  const k = e.key;
  if (k !== "ArrowRight" && k !== "ArrowLeft" && k !== "Home" && k !== "End") return;
  e.preventDefault();
  const n = k === "Home" ? 0 : k === "End" ? count - 1 : (cur + (k === "ArrowRight" ? 1 : -1) + count) % count;
  pick(n);
  const list = (e.currentTarget as HTMLElement).closest('[role="tablist"]');
  (list?.querySelectorAll<HTMLElement>('[role="tab"]')[n])?.focus();
}

/** /features "Works with": segmented tabs over a grid of monogram tiles (prototype SiteFeatures section 5). */
export function WorksTabs({ heading, tabs }: { heading: ReactNode; tabs: { id: string; label: string; note: string; items: [string, string, string, string][] }[] }) {
  const [cur, setCur] = useState(0);
  const base = useId();
  const t = tabs[cur];
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
      {heading}
      <div role="tablist" aria-label="What BillingEase works with" className={SEG}>
        {tabs.map((x, i) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            id={`${base}-t${i}`}
            aria-selected={i === cur}
            aria-controls={`${base}-p`}
            tabIndex={i === cur ? 0 : -1}
            onClick={() => setCur(i)}
            onKeyDown={(e) => onTabKeys(e, tabs.length, cur, setCur)}
            className={SEG_BTN}
          >
            {x.label}
          </button>
        ))}
      </div>
      </div>
      <div id={`${base}-p`} role="tabpanel" aria-labelledby={`${base}-t${cur}`} className="flex flex-col gap-7">
        <ul className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}>
          {t.items.map((i) => (
            <li key={i[1]} className="flex min-w-0 items-center gap-3 rounded-[18px] border border-line bg-bg p-4">
              <span aria-hidden className="flex size-11 flex-none items-center justify-center rounded-xl font-display text-[13px] font-extrabold" style={{ background: i[3] }}>
                {i[0]}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[15px] font-bold">{i[1]}</span>
                <span className="text-[13px] leading-[1.45] text-muted">{i[2]}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[13px] leading-[1.45] text-muted">{t.note}</p>
      </div>
    </>
  );
}

/** "Two countries, one product": flip between the UK and Sri Lanka versions of one invoice. */
export function CountryPeek({ initial }: { initial: SiteCountry }) {
  const [c, setC] = useState<SiteCountry>(initial);
  const D = {
    uk: { who: "Kirkstall Brewing Co · Leeds", amt: money(1850, "uk"), note: "Invoice in pounds · tax year 6 April to 5 April · VAT shown if you’re registered" },
    lk: { who: "Kandyan Spice Co · Kandy", amt: "Rs 302,375", note: "Tax Invoice in rupees · VAT 18% and SSCL 2.5% on their own lines · year from 1 April" },
  }[c];
  return (
    <div className="flex flex-col gap-2.5">
      <div role="group" aria-label="Country" className={cx(SEG, "bg-white")}>
        {(["uk", "lk"] as const).map((k) => (
          <button key={k} type="button" aria-pressed={c === k} onClick={() => setC(k)} className={SEG_BTN}>
            {k === "uk" ? "United Kingdom" : "Sri Lanka"}
          </button>
        ))}
      </div>
      <span aria-live="polite" className="flex flex-col gap-0.5 px-1 pt-1">
        <span className="text-[13px] text-muted">{D.who}</span>
        <span className="font-display text-[26px] font-bold tracking-[-0.02em] tabular-nums">{D.amt}</span>
        <span className="text-[13px] leading-[1.45] text-muted">{D.note}</span>
      </span>
    </div>
  );
}
