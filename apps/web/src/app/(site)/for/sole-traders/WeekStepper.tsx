"use client";

import { useState } from "react";
import { CashJar } from "@/components/CashJar";
import { audienceStyles as a } from "@/components/site/illustrations/audience";
import { cx } from "@/components/ui";
import type { WeekStep } from "@/content/site/sole-traders";

const TAG = {
  in: { label: "Coming in", bg: "bg-tint", dot: "bg-coming" },
  out: { label: "Going out", bg: "bg-going-tint", dot: "bg-going" },
  keep: { label: "Yours to keep", bg: "bg-surface", dot: "bg-violet" },
} as const;

/** "A quarter in the life": five steps of one job; each shows what was done and which number moved (prototype SiteFreelancers §3). */
export function WeekStepper({ steps, sym, label }: { steps: WeekStep[]; sym: string; label: string }) {
  const [i, setI] = useState(0);
  const cur = steps[i];
  const tag = TAG[cur.tag];
  const last = i === steps.length - 1;
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3.5">
        <ol aria-label={label} className="grid grid-cols-5 gap-2.5">
          {steps.map((st, n) => {
            const on = n === i;
            const done = n < i;
            return (
              <li key={st.title} className="flex min-w-0">
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`Step ${n + 1}: ${st.title}, ${st.when}`}
                  onClick={() => setI(n)}
                  className={cx(
                    "flex min-h-11 min-w-0 flex-1 flex-col items-start gap-2.5 rounded-[20px] border p-4 text-left transition-colors max-[760px]:items-center max-[760px]:p-2.5",
                    on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-input",
                  )}
                >
                  <span className="flex w-full items-center gap-2.5 max-[760px]:justify-center">
                    <span className={cx("flex size-[30px] flex-none items-center justify-center rounded-full font-display text-sm font-bold text-ink", on ? "bg-violet" : done ? "bg-tint" : "bg-surface")}>{n + 1}</span>
                    <span className="truncate text-xs font-semibold opacity-80 max-[760px]:hidden">{st.when}</span>
                  </span>
                  <span className="text-[15px] font-bold leading-[1.3] max-[760px]:hidden">{st.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-line">
          <span className="block h-full rounded-full bg-coming transition-[width] duration-400" style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
        </span>
      </div>

      <div aria-live="polite" className="flex flex-wrap items-stretch gap-x-10 gap-y-7 rounded-[28px] border border-line bg-white p-[clamp(20px,3vw,36px)]">
        <div className="flex min-w-0 flex-[1_1_340px] flex-col items-start gap-4">
          <span className={cx("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-bold", tag.bg)}>
            <span aria-hidden className={cx("size-2 rounded-full", tag.dot)} />
            {tag.label}
          </span>
          <span className="text-sm font-semibold text-muted">
            Step {i + 1} of {steps.length} · {cur.when}
          </span>
          <h3 className="font-display text-[clamp(22px,2.2vw,28px)] font-bold leading-[1.2] tracking-[-0.02em]">{cur.title}</h3>
          <p className="text-base leading-[1.55] text-ink2">{cur.body}</p>
          <span className="inline-flex items-center gap-2 rounded-[14px] bg-bg px-3.5 py-2.5 text-sm font-bold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="flex-none">
              <path d="m5 12 5 5 9-10" />
            </svg>
            {cur.effect}
          </span>
          <div className="mt-auto flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setI(Math.max(0, i - 1))}
              disabled={i === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink/[0.07] px-[18px] text-[15px] font-semibold disabled:opacity-40"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
              Back
            </button>
            <button type="button" onClick={() => setI(last ? 0 : i + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-violet px-[18px] text-[15px] font-semibold hover:bg-[#a98ffb]">
              {last ? "Start again" : "Next step"}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>

        <div aria-hidden className="box-border flex min-h-[320px] min-w-0 flex-[1_1_380px] items-center justify-center rounded-[22px] bg-bg p-[clamp(16px,3vw,28px)]">
          {cur.split ? (
            <div key={i} className={cx(a.in, "flex flex-wrap items-center justify-center gap-x-5 gap-y-3")}>
              <CashJar size={220} amount={cur.jar} sym={sym} />
              <span className="flex min-w-[210px] flex-col gap-1.5 text-sm">
                {cur.split.map(([l, v, strong]) => (
                  <span key={l} className={cx("flex justify-between gap-4 border-b border-line py-1", strong && "font-bold")}>
                    <span>{l}</span>
                    <span className="tabular whitespace-nowrap">{v}</span>
                  </span>
                ))}
              </span>
            </div>
          ) : (
            <div key={i} className={cx(a.in, "box-border flex w-full max-w-[360px] flex-col gap-3 rounded-[18px] border border-line bg-white p-5 text-sm")}>
              <span className="flex items-center justify-between gap-2">
                <span className="font-display text-xs font-extrabold tracking-[0.08em]">{cur.card.head}</span>
                {cur.card.badge && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-pos-bg px-2.5 py-1 text-xs font-bold text-pos">
                    <span className="size-1.5 rounded-full bg-pos" />
                    {cur.card.badge}
                  </span>
                )}
              </span>
              <span className="text-base font-bold">{cur.card.title}</span>
              {cur.card.rows.map(([l, v]) => (
                <span key={l} className="flex justify-between gap-3 text-ink2">
                  <span>{l}</span>
                  <strong className="tabular text-ink">{v}</strong>
                </span>
              ))}
              <span className="h-px bg-line" />
              <span className="flex items-center gap-2.5 rounded-xl bg-tint px-3 py-2.5 font-semibold">
                <span className={cx(a.blink, "size-2 flex-none rounded-full bg-coming")} />
                {cur.card.foot}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
