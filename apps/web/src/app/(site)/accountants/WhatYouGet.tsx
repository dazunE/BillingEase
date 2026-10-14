"use client";

import { useState } from "react";
import { audienceStyles as a } from "@/components/site/illustrations/audience";
import { cx } from "@/components/ui";
import type { GetItem } from "@/content/site/accountants";

const TONE = { pos: "bg-pos-bg text-pos", due: "bg-due-bg text-due", info: "bg-info-bg text-info", grey: "bg-surface text-ink2", violet: "bg-tint text-ink" } as const;

/** "What you get": a list on the left, a preview of the picked item on the right (prototype SitePartners §3). */
export function WhatYouGet({ items }: { items: GetItem[] }) {
  const [i, setI] = useState(0);
  const cur = items[i];
  return (
    <div className="flex flex-wrap items-stretch gap-x-6 gap-y-5">
      <ul className="flex min-w-0 flex-[1_1_380px] flex-col gap-2.5">
        {items.map((it, n) => (
          <li key={it.title}>
            <button
              type="button"
              aria-pressed={n === i}
              onClick={() => setI(n)}
              className={cx("flex w-full items-start gap-3 rounded-[18px] border p-4 text-left transition-colors", n === i ? "border-ink bg-white shadow-[0_6px_18px_rgba(24,22,31,0.08)]" : "border-line bg-white/60 hover:border-input")}
            >
              <span className={cx("flex size-9 flex-none items-center justify-center rounded-xl", n === i ? "bg-violet" : "bg-surface")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={it.icon} />
                </svg>
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2 text-[15px] font-bold">
                  {it.title}
                  {it.next && <span className="rounded-full bg-due-bg px-2 py-0.5 text-[11px] font-bold text-due">Next phase</span>}
                </span>
                <span className="text-[13px] leading-normal text-ink2">{it.body}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div aria-live="polite" className="box-border flex min-h-[360px] min-w-0 flex-[1_1_380px] items-center justify-center rounded-[28px] bg-tint p-[clamp(16px,4vw,48px)]">
        <div key={i} className={cx(a.in, "relative w-full max-w-[360px]")}>
          <div aria-hidden className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-[22px] bg-ink" />
          <div className="relative flex flex-col gap-3 rounded-[22px] border-2 border-ink bg-white p-5">
            <span className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted">Preview{cur.next ? " · next phase" : ""}</span>
              {cur.next && <span className="rounded-full bg-due-bg px-2 py-0.5 text-[11px] font-bold text-due">Coming</span>}
            </span>
            <span className="font-display text-base font-bold">{cur.preview.head}</span>
            <dl className="flex flex-col">
              {cur.preview.rows.map(([l, v, tone]) => (
                <div key={l} className="flex items-center justify-between gap-3 border-b border-divider py-2 text-[13px] last:border-b-0">
                  <dt className="text-ink2">{l}</dt>
                  <dd className={cx("tabular text-right font-bold", tone && cx("rounded-full px-2.5 py-0.5 text-xs", TONE[tone]))}>{v}</dd>
                </div>
              ))}
            </dl>
            <span className="rounded-xl bg-bg px-3 py-2 text-xs font-semibold">{cur.preview.foot}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
