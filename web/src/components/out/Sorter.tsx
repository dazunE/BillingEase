"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { sortTransactionAction } from "@/app/app/out/actions";
import { ICONS, Icon, cx } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { CategoryOption, SortItem } from "@/lib/ops-out";
import { niceMerchant } from "./format";

type Picked = { id: string; nice: string; amountCents: number; category: string; remembered: boolean };

const chip =
  "inline-flex min-h-11 items-center rounded-full border border-input bg-white px-4 text-sm font-semibold text-ink hover:border-ink disabled:opacity-50";

/**
 * "Sort these": bank and card transactions we couldn't file on our own, one
 * at a time. Each answer is saved straight away (and remembered, by default).
 */
export function Sorter({ items, categories, autoSorted: autoSortedAtLoad }: { items: SortItem[]; categories: { out: CategoryOption[]; in: CategoryOption[] }; autoSorted: number }) {
  // The queue is fixed when the page loads; answers are saved as you go.
  const [queue] = useState(items);
  const [autoSorted] = useState(autoSortedAtLoad);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [remember, setRemember] = useState(true);
  const [other, setOther] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const otherId = useId();

  const total = queue.length;
  const left = total - idx;
  const current = idx < total ? queue[idx] : null;

  function choose(option: CategoryOption) {
    if (!current || pending) return;
    setError(null);
    const tx = current;
    startTransition(async () => {
      const r = await sortTransactionAction(tx.id, option.id, remember);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setPicked((p) => [...p, { id: tx.id, nice: niceMerchant(tx.description), amountCents: tx.amountCents, category: option.name, remembered: remember }]);
      setOther("");
      setIdx((i) => i + 1);
    });
  }

  const header = (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <h2 id="sort-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">
        Sort these {left > 0 && <span className="font-semibold text-muted">{left}</span>}
      </h2>
      <span className="text-[13px] text-muted">
        {autoSorted > 0 && total > 0
          ? `We sorted ${autoSorted} on our own. ${total === 1 ? "This one is" : total === 2 ? "These two are" : `These ${total} are`} new to us.`
          : "Charges we can't file on our own show up here."}
      </span>
    </div>
  );

  if (total === 0) {
    return (
      <section id="sort" aria-labelledby="sort-h" className="flex scroll-mt-24 flex-col gap-3">
        {header}
        <div className="flex items-center gap-3.5 rounded-[20px] border border-line bg-white p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pos-bg text-pos">
            <Icon d={ICONS.check} size={18} strokeWidth={2.6} />
          </span>
          <p className="text-[15px] text-ink2">
            Nothing to sort. {autoSorted > 0 ? `Every charge is filed, ${autoSorted} of them on our own.` : "New charges from your bank and cards are filed as they come in."}{" "}
            <Link href="/app/transactions" className="font-semibold text-ink underline underline-offset-4">
              See all transactions
            </Link>
          </p>
        </div>
      </section>
    );
  }

  if (!current) {
    const anyRemembered = picked.some((p) => p.remembered);
    return (
      <section id="sort" aria-labelledby="sort-h" className="flex scroll-mt-24 flex-col gap-3">
        {header}
        <div role="status" className="flex flex-col gap-4 rounded-[20px] bg-ink p-6 text-white">
          <div className="flex flex-col gap-1">
            <span className="font-display text-[22px] font-bold text-violet">{anyRemembered ? "All sorted. We'll remember these." : "All sorted."}</span>
            <span className="text-[15px] text-tint">
              {anyRemembered ? "Next time these merchants show up, they go straight to the right place." : "Change any of them from your transactions list."}
            </span>
          </div>
          <ul className="flex flex-col gap-1.5 text-sm">
            {picked.map((p) => (
              <li key={p.id} className="flex flex-wrap gap-x-2">
                <span className="font-semibold">{p.nice}</span>
                <span className="tabular text-tint">{formatMoney(Math.abs(p.amountCents))}</span>
                <span aria-hidden className="text-tint">
                  →
                </span>
                <span className="sr-only">filed under</span>
                <span>{p.category}</span>
              </li>
            ))}
          </ul>
          <Link href="/app/transactions" className="self-start text-sm font-semibold text-white underline underline-offset-4">
            Change answers
          </Link>
        </div>
      </section>
    );
  }

  const options = current.moneyIn ? categories.in : categories.out;
  const suggested = current.suggested;
  const nice = niceMerchant(current.description);

  return (
    <section id="sort" aria-labelledby="sort-h" className="flex scroll-mt-24 flex-col gap-3">
      {header}
      <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-white p-5 sm:p-6" aria-busy={pending}>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold" aria-live="polite">
            {idx + 1} of {total}
          </span>
          <span className="flex flex-1 gap-1" aria-hidden>
            {queue.map((q, i) => (
              <span key={q.id} className={cx("h-1.5 flex-1 rounded-full", i < idx ? "bg-going" : i === idx ? "bg-going-light" : "bg-divider")} />
            ))}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-going-tint">
            <Icon d={current.account.toLowerCase().includes("checking") ? ICONS.bank : ICONS.card} size={22} strokeWidth={1.9} />
          </span>
          <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
            <span className="font-mono text-[13px] text-ink2">{current.description}</span>
            <span className="text-xl font-bold">{nice}</span>
            <span className="text-[13px] text-ink2">
              {formatDate(current.postedOn)} · {current.account}
            </span>
          </div>
          <span className="font-display text-[28px] font-bold tracking-[-0.02em] tabular">
            {current.moneyIn ? "+" : ""}
            {formatMoney(Math.abs(current.amountCents))}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[13px] font-semibold text-ink2">{current.moneyIn ? "Where did this money come from?" : "What was it for?"}{suggested ? " Our guess:" : ""}</span>
          <div className="flex flex-wrap items-center gap-2">
            {suggested && (
              <>
                <button
                  type="button"
                  onClick={() => choose(suggested)}
                  disabled={pending}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-violet px-5 text-sm font-semibold text-ink hover:bg-[#a98ffb] disabled:opacity-50"
                >
                  <Icon d={ICONS.check} size={16} strokeWidth={2.6} />
                  {suggested.name}
                </button>
                <span className="px-1 text-sm text-muted">or</span>
              </>
            )}
            {current.common.map((o) => (
              <button key={o.id} type="button" className={chip} onClick={() => choose(o)} disabled={pending}>
                {o.name}
              </button>
            ))}
            {current.personal && (
              <button type="button" className={chip} onClick={() => choose(current.personal!)} disabled={pending} title="Not a business cost">
                Personal
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={otherId} className="sr-only">
              Other category
            </label>
            <select
              id={otherId}
              value={other}
              onChange={(e) => setOther(e.target.value)}
              className="min-h-11 w-full max-w-[280px] rounded-full border border-input bg-white px-4 text-sm font-semibold text-ink focus:border-ink focus:outline-none"
            >
              <option value="">Other…</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            {other && (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const o = options.find((x) => x.id === other);
                  if (o) choose(o);
                }}
                className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
              >
                File it there
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider pt-3.5">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-[18px] accent-coming" />
            Remember this for next time
          </label>
          {pending && <span className="text-[13px] text-muted">Saving…</span>}
        </div>
        {error && (
          <p role="alert" className="text-sm font-semibold text-late">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
