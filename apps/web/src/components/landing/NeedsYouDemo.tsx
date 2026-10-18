"use client";

import { useState } from "react";
import { NEEDS_YOU, NEEDS_YOU_COPY as C, type Task } from "@/content/site/home";
import type { SiteCountry } from "@/content/site/country";

const TINT: Record<Task["tint"], string> = { late: "bg-late-bg", due: "bg-due-bg", violet: "bg-tint" };

function Check({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

/**
 * A clickable "Needs you" list with its plain activity log, as on the app's
 * Home (sample data for the visitor's country; nothing is sent). Remount with
 * `key={country}` so a country switch starts it fresh.
 */
export function NeedsYouDemo({ country }: { country: SiteCountry }) {
  const data = NEEDS_YOU[country];
  // task id → order in which it was done
  const [done, setDone] = useState<Record<string, number>>({});
  const [seq, setSeq] = useState(1);
  const openCount = data.tasks.filter((t) => !done[t.id]).length;
  const justNow = data.tasks
    .filter((t) => done[t.id])
    .sort((a, b) => done[b.id] - done[a.id])
    .map((t) => ({ t: t.log, when: "Just now", fresh: true }));
  const log = [...justNow, ...data.activity.map((h) => ({ ...h, fresh: false }))].slice(0, 6);

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">
            {C.listTitle} <span className="font-semibold text-muted">{openCount}</span>
          </h3>
          <span className="text-[13px] text-muted">{C.listAside}</span>
        </div>
        {data.tasks.map((t) =>
          done[t.id] ? (
            <div key={t.id} className="flex items-center gap-3 rounded-[18px] bg-pos-bg py-3 pl-[18px] pr-3 text-sm font-semibold text-pos" role="status">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2F5711" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="flex-none">
                <path d="m5 12 5 5 9-10" />
              </svg>
              <span className="min-w-0 flex-1">{t.doneText}</span>
              <button
                type="button"
                onClick={() => setDone((d) => Object.fromEntries(Object.entries(d).filter(([k]) => k !== t.id)))}
                className="min-h-11 flex-none rounded-full px-3 text-[13px] font-semibold underline"
              >
                {C.undo}
              </button>
            </div>
          ) : (
            <article key={t.id} className="flex flex-wrap items-center gap-x-[18px] gap-y-3.5 rounded-[20px] border border-line bg-white px-5 py-[18px]">
              <span className={`flex size-11 flex-none items-center justify-center rounded-[14px] ${TINT[t.tint]}`}>
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
              <span className="font-display text-[22px] font-bold text-violet">{C.allClear}</span>
              <span className="text-[15px] text-tint">{C.allClearBody}</span>
            </span>
            <button type="button" onClick={() => setDone({})} className="min-h-11 rounded-full bg-tint/15 px-4 text-sm font-semibold hover:bg-tint/25">
              {C.again}
            </button>
          </div>
        )}
      </div>

      <section aria-labelledby="activity-h" className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5 rounded-[20px] bg-bg p-[22px]">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="activity-h" className="font-display text-lg font-bold tracking-[-0.02em]">
            {C.logTitle}
          </h3>
          <span className="text-[13px] text-muted">{C.logAside}</span>
        </div>
        <ul className="flex flex-col gap-3" aria-live="polite">
          {log.map((h) => (
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
        <span className="border-t border-line pt-3 text-[13px] leading-normal text-muted">{C.logNote}</span>
      </section>
    </div>
  );
}
