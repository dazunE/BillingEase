"use client";

import { useId, useState } from "react";
import { cx } from "@/components/ui";
import { money, type SiteCountry } from "@/content/site/country";
import type { SolePage } from "@/content/site/sole-traders";

/** "Who owes you": tick the invoices to remind; the button counts them (prototype SiteFreelancers "Time you can bill", reworked). */
export function OwedList({ list, country, channel }: { list: SolePage["owed"]["list"]; country: SiteCountry; channel: string }) {
  const [on, setOn] = useState<boolean[]>(() => list.rows.map((r) => !!r.late));
  const [sent, setSent] = useState<string | null>(null);
  const base = useId();
  const picked = list.rows.filter((_, i) => on[i]);
  const total = picked.reduce((t, r) => t + r.amount, 0);
  return (
    <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,2.6vw,28px)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">{list.title}</h3>
        <span className="text-[13px] text-muted">{list.sub}</span>
      </div>
      <ul className="flex flex-col border-t border-line">
        {list.rows.map((r, i) => {
          const id = `${base}-${i}`;
          return (
            <li key={r.who + r.what} className="border-b border-line">
              <label htmlFor={id} className="flex min-h-14 cursor-pointer items-center gap-3 py-3">
                <input
                  id={id}
                  type="checkbox"
                  checked={on[i]}
                  onChange={() => {
                    setSent(null);
                    setOn((o) => o.map((v, j) => (j === i ? !v : v)));
                  }}
                  className="size-5 flex-none accent-coming"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-bold">{r.who}</span>
                  <span className="truncate text-[13px] text-muted">{r.what}</span>
                </span>
                <span className="flex flex-none flex-col items-end">
                  <span className="tabular text-[15px] font-bold">{money(r.amount, country)}</span>
                  <span className={cx("text-xs font-semibold", r.late ? "text-late" : "text-muted")}>{r.state}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm" aria-live="polite">
          {sent ?? (
            <>
              <strong>{picked.length}</strong> picked · <strong className="tabular">{money(total, country)}</strong>
            </>
          )}
        </span>
        <button
          type="button"
          disabled={picked.length === 0}
          onClick={() => setSent(`Done. ${picked.length} polite ${picked.length === 1 ? "reminder" : "reminders"} queued ${channel}. (A demo: nothing is sent.)`)}
          className="inline-flex min-h-11 items-center rounded-full bg-violet px-5 text-sm font-bold hover:bg-[#a98ffb] disabled:opacity-40"
        >
          Send {picked.length === 1 ? "1 reminder" : `${picked.length} reminders`}
        </button>
      </div>
    </div>
  );
}
