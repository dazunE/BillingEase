"use client";

import { useState } from "react";
import { L_ICONS } from "./data";

const TASKS = [
  {
    id: "late",
    icon: L_ICONS.clock,
    tint: "bg-late-bg",
    title: "Harbor & Pine Café is 32 days late",
    body: "$2,480 for August menu design. Two automatic reminders didn’t work, so a personal note might.",
    cta: "Send a friendly nudge",
    doneText: "Nudge sent to Daniel at Harbor & Pine Café",
    log: "Sent your note to Harbor & Pine Café",
  },
  {
    id: "sort",
    icon: L_ICONS.sort,
    tint: "bg-due-bg",
    title: "4 card charges need a category",
    body: "We sorted 19 on our own. Blue Bottle, Amazon, Uber and Canva are new to us, so we made our best guesses.",
    cta: "Use our guesses",
    doneText: "4 charges sorted. We’ll remember these next time.",
    log: "Sorted Blue Bottle, Amazon, Uber and Canva",
  },
  {
    id: "payroll",
    icon: L_ICONS.people,
    tint: "bg-tint",
    title: "Approve Friday’s payroll · $7,231",
    body: "3 people, paid Oct 9 by direct deposit. Payroll taxes are filed for you.",
    cta: "Approve",
    doneText: "Payroll approved. Jordan, Priya and Sam get paid Friday.",
    log: "Scheduled $7,231 payroll and its tax filings",
  },
];

const BASE = [
  { t: "Matched Atlas Freight’s $6,300 payment to its invoice", when: "Today, 7:42 AM" },
  { t: "Imported 23 transactions from Chase and Amex", when: "Today, 6:00 AM" },
  { t: "Sorted 19 expenses into the right categories", when: "Yesterday" },
  { t: "Moved $2,803 into your tax set-aside", when: "Oct 1" },
  { t: "Sent automatic reminders to Lumen Dental Group", when: "Sep 30" },
];

function Check({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

/** A clickable "Needs you" list with its "Handled for you" log (sample data, nothing is sent). */
export function NeedsYouDemo() {
  // task id → order in which it was done
  const [done, setDone] = useState<Record<string, number>>({});
  const [seq, setSeq] = useState(1);
  const openCount = TASKS.filter((t) => !done[t.id]).length;
  const justNow = TASKS.filter((t) => done[t.id])
    .sort((a, b) => done[b.id] - done[a.id])
    .map((t) => ({ t: t.log, when: "Just now", fresh: true }));
  const handled = [...justNow, ...BASE.map((h) => ({ ...h, fresh: false }))].slice(0, 6);

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">
            Needs you <span className="font-semibold text-muted">{openCount}</span>
          </h3>
          <span className="text-[13px] text-muted">Only things we can’t do without you</span>
        </div>
        {TASKS.map((t) =>
          done[t.id] ? (
            <div key={t.id} className="flex items-center gap-3 rounded-[18px] bg-pos-bg py-3 pl-[18px] pr-3 text-sm font-semibold text-pos" role="status">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2F5711" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="flex-none">
                <path d="m5 12 5 5 9-10" />
              </svg>
              <span className="min-w-0 flex-1">{t.doneText}</span>
              <button
                type="button"
                onClick={() => setDone((d) => Object.fromEntries(Object.entries(d).filter(([k]) => k !== t.id)))}
                className="min-h-8 flex-none rounded-full px-3 text-[13px] font-semibold underline"
              >
                Undo
              </button>
            </div>
          ) : (
            <article key={t.id} className="flex flex-wrap items-center gap-x-[18px] gap-y-3.5 rounded-[20px] border border-line bg-white px-5 py-[18px]">
              <span className={`flex size-11 flex-none items-center justify-center rounded-[14px] ${t.tint}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={t.icon} />
                </svg>
              </span>
              <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-[3px]">
                <span className="text-base font-bold">{t.title}</span>
                <span className="text-sm leading-snug text-ink2">{t.body}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDone((d) => ({ ...d, [t.id]: seq }));
                  setSeq((n) => n + 1);
                }}
                className="min-h-11 rounded-full bg-violet px-5 text-sm font-semibold hover:bg-[#a98ffb]"
              >
                {t.cta}
              </button>
            </article>
          ),
        )}
        {openCount === 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-[20px] bg-ink p-6 text-white">
            <span className="flex flex-col gap-1.5">
              <span className="font-display text-[22px] font-bold text-violet">All clear.</span>
              <span className="text-[15px] text-tint">Nothing else needs you today. Go enjoy your Sunday.</span>
            </span>
            <button type="button" onClick={() => setDone({})} className="min-h-10 rounded-full bg-tint/15 px-4 text-sm font-semibold hover:bg-tint/25">
              Run it again
            </button>
          </div>
        )}
      </div>

      <section aria-labelledby="handled-h" className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5 rounded-[20px] bg-bg p-[22px]">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="handled-h" className="font-display text-lg font-bold tracking-[-0.02em]">
            Handled for you
          </h3>
          <span className="text-[13px] text-muted">While you were away</span>
        </div>
        <ul className="flex flex-col gap-3" aria-live="polite">
          {handled.map((h) => (
            <li key={h.t} className="flex items-start gap-2.5 text-sm leading-snug">
              <span className={`mt-px flex size-[22px] flex-none items-center justify-center rounded-full ${h.fresh ? "bg-pos-bg" : "bg-tint"}`}>
                <Check color={h.fresh ? "#2F5711" : "#18161F"} />
              </span>
              <span className="flex flex-col">
                <span>{h.t}</span>
                <span className="text-xs text-muted">{h.when}</span>
              </span>
            </li>
          ))}
        </ul>
        <span className="border-t border-line pt-3 text-[13px] leading-normal text-muted">You never have to read this list. It’s here so you can see the work is getting done.</span>
      </section>
    </div>
  );
}
