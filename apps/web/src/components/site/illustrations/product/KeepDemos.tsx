"use client";

import { useId, useState, type ReactNode } from "react";
import { CashJar } from "@/components/CashJar";
import { cx } from "@/components/ui";
import { COUNTRY_META, money, type SiteCountry } from "@/content/site/country";
import type { Report } from "@/content/site/keep";
import { BTN_DARK, CHIP, INPUT, RANGE } from "./cls";
import { onTabKeys } from "./Tabs";
import { Toast, useToast } from "./Toast";

type Calc = { sample: { inc: number; out: number; pct: number }; alt: { inc: number; out: number; pct: number }; max: number; step: number; who: string; alt_who: string; taxLabel: string };

/** Hero: sliders fill the jar (prototype SiteKeep calculator). The share is a simplification of the real estimate. */
export function KeepCalc({ country, c }: { country: SiteCountry; c: Calc }) {
  const [v, setV] = useState(c.sample);
  const profit = v.inc - v.out;
  const tax = profit > 0 ? Math.round((profit * v.pct) / 100) : 0;
  const keep = profit > 0 ? profit - tax : 0;
  const isSample = v.inc === c.sample.inc && v.out === c.sample.out && v.pct === c.sample.pct;
  const sliders = [
    { id: "k-in", label: "Coming in this month", dot: "bg-coming", accent: "accent-coming", min: 0, max: c.max, step: c.step, val: v.inc, shown: money(v.inc, country), set: (n: number) => setV({ ...v, inc: n }) },
    { id: "k-out", label: "Going out this month", dot: "bg-going", accent: "accent-going", min: 0, max: c.max, step: c.step, val: v.out, shown: money(v.out, country), set: (n: number) => setV({ ...v, out: n }) },
    { id: "k-pct", label: `Estimated ${c.taxLabel}`, dot: "bg-[#E3C38F]", accent: "accent-[#B4501A]", min: 0, max: 40, step: 1, val: v.pct, shown: `${v.pct}%`, set: (n: number) => setV({ ...v, pct: n }) },
  ];
  return (
    <div role="group" aria-labelledby="calc-h" className="box-border flex min-w-0 max-w-[600px] flex-[1_1_460px] flex-col gap-[18px] rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)] shadow-[0_30px_60px_-30px_rgba(24,22,31,0.25)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="calc-h" className="text-[15px] font-bold">
          Try it with your own month
        </h2>
        <button type="button" className={cx(CHIP, "min-h-9 text-[13px]")} onClick={() => setV(isSample ? c.alt : c.sample)}>
          {isSample ? `Try ${c.alt_who}` : "Back to the sample"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div aria-live="polite" className="flex min-w-0 flex-[1_1_220px] justify-center">
          <CashJar size={300} amount={money(keep, country)} taxPct={`${v.pct}%`} sym={COUNTRY_META[country].sym} className="h-auto max-w-full" label={`Yours to keep: ${money(keep, country)}`} />
        </div>
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-3.5">
          {sliders.map((sl) => (
            <div key={sl.id} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor={sl.id} className="flex items-center gap-2 text-sm font-bold">
                  <span aria-hidden className={cx("size-2 rounded-full", sl.dot)} />
                  {sl.label}
                </label>
                <span className="font-display text-lg font-bold tabular-nums">{sl.shown}</span>
              </div>
              <input id={sl.id} type="range" min={sl.min} max={sl.max} step={sl.step} value={sl.val} onChange={(e) => sl.set(Number(e.target.value))} className={cx(RANGE, sl.accent)} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ["Profit", money(profit, country), "bg-bg", "text-ink", "text-muted", "text-lg"],
          ["Tax estimate", money(tax, country), "bg-[#FFF6E0]", "text-[#6B3E0E]", "text-[#6B3E0E]", "text-lg"],
          ["Yours to keep", money(keep, country), "bg-ink", "text-violet", "text-tint", "text-[22px]"],
        ].map(([l, val, bg, ink, sub, size], i) => (
          <span key={l} className={cx("flex min-w-0 flex-col rounded-[14px] px-3 py-2", bg, i === 2 ? "flex-[1_1_140px]" : "flex-[1_1_100px]")}>
            <span className={cx("text-[11px] font-bold", sub)}>{l}</span>
            <span className={cx("whitespace-nowrap font-display font-bold tabular-nums", ink, size)}>{val}</span>
          </span>
        ))}
      </div>
      <p className="text-[13px] leading-[1.45] text-muted">
        {profit <= 0
          ? "More went out than came in, so there’s no profit to tax this month. The jar refills when sales do."
          : isSample
            ? `${c.who} (sample business). Drag the sliders to try your own month. In the app the estimate uses the year’s real rates, not a flat share.`
            : `About ${money(tax * 12, country)} of ${c.taxLabel} over a year like this one. In the app the estimate uses the year’s real rates.`}
      </p>
    </div>
  );
}

/** Reports named after the question they answer (prototype SiteKeep reports). */
export function ReportTabs({ reports, acct, intro }: { reports: Report[]; acct: string; intro: ReactNode }) {
  const [cur, setCur] = useState(0);
  const base = useId();
  const [toast, notify] = useToast();
  const R = reports[cur];
  const nums = R.rows.filter((r) => typeof r[1] === "number").map((r) => r[1] as number);
  const max = Math.max(1, ...nums);
  const fmt = (n: number) => (R.answer.startsWith("Rs") ? "Rs " : "£") + n.toLocaleString("en-GB");
  return (
    <>
      <div className="flex min-w-0 max-w-[460px] flex-[1_1_380px] flex-col gap-[18px]">
        {intro}
        <div role="tablist" aria-label="Questions" aria-orientation="vertical" className="flex flex-col gap-2">
          {reports.map((r, i) => {
            const on = i === cur;
            return (
              <button
                key={r.key}
                type="button"
                role="tab"
                id={`${base}-t${i}`}
                aria-selected={on}
                aria-controls={`${base}-p`}
                tabIndex={on ? 0 : -1}
                onClick={() => setCur(i)}
                onKeyDown={(e) => onTabKeys(e, reports.length, cur, setCur)}
                className={cx("flex min-h-14 flex-col items-start gap-0.5 rounded-[18px] border px-[18px] py-3 text-left transition-colors", on ? "border-ink bg-ink text-white" : "border-line bg-white")}
              >
                <span className="text-[17px] font-bold">{r.q}</span>
                <span className={cx("text-[13px]", on ? "text-[#D9D4E6]" : "text-muted")}>{r.formal}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div id={`${base}-p`} role="tabpanel" aria-labelledby={`${base}-t${cur}`} className="flex min-w-0 flex-[999_1_520px] flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-[13px] text-muted">
              {R.formal} · {R.period} · sample
            </span>
            <span className="text-xl font-bold">{R.q}</span>
          </span>
          <button type="button" className={CHIP} onClick={() => notify(`“${R.q}” shared with ${acct}`)}>
            Share with {acct.split(",")[0]}
          </button>
        </div>
        <div className="flex flex-col gap-1 rounded-[18px] bg-ink px-5 py-[18px] text-white">
          <span className="text-[13px] text-tint">{R.answerLabel}</span>
          <span className="font-display text-[clamp(30px,3.6vw,44px)] font-bold tracking-[-0.03em] text-violet tabular-nums">{R.answer}</span>
          <span className="text-[13px] text-tint">{R.answerSub}</span>
        </div>
        <ul className="flex flex-col">
          {R.rows.map((r) => (
            <li key={r[0]} className="flex flex-col gap-1.5 border-b border-divider py-2.5">
              <span className="flex justify-between gap-3 text-sm">
                <span style={{ fontWeight: r[2] ?? (typeof r[1] === "number" ? 600 : 500) }}>{r[0]}</span>
                <span className="font-bold tabular-nums">{typeof r[1] === "number" ? fmt(r[1]) : r[1]}</span>
              </span>
              {typeof r[1] === "number" && (
                <span aria-hidden className="block h-1.5 rounded-full bg-surface">
                  <span className="block h-full rounded-full bg-coming" style={{ width: `${Math.round((r[1] / max) * 100)}%` }} />
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <Toast text={toast} />
    </>
  );
}

/** UK: the MTD quarter summary; Sri Lanka: the VAT and SSCL period summary. */
export function PeriodCard({ country }: { country: SiteCountry }) {
  const lk = country === "lk";
  const [sent, setSent] = useState(false);
  const rows: [string, string][] = lk
    ? [
        ["Output VAT on Tax Invoices", "Rs 412,340"],
        ["Input VAT from suppliers’ Tax Invoices", "−Rs 96,210"],
        ["VAT to pay", "Rs 316,130"],
        ["SSCL on sales (no input credit)", "Rs 61,450"],
      ]
    : [
        ["Turnover", "£7,420"],
        ["Car, van and travel", "£312"],
        ["Premises", "£1,350"],
        ["Phone, stationery and office costs", "£604"],
        ["Other allowable costs", "£318"],
      ];
  return (
    <article className="flex min-w-0 flex-[1_1_400px] flex-col gap-3.5 rounded-3xl bg-bg p-[clamp(20px,2.4vw,28px)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">{lk ? "VAT and SSCL for September" : "Your MTD quarter"}</h3>
          <span className="text-[13px] text-muted">{lk ? "In the order of the IRD return · due 20 Oct 2026" : "Q2 · 6 July to 5 October 2026 · totals by HMRC category"}</span>
        </div>
        <span className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", sent ? "bg-pos-bg text-pos" : "bg-due-bg text-due")}>{sent ? "Shared" : lk ? "Due in 15 days" : "Ready"}</span>
      </div>
      <div className="flex flex-col gap-2 rounded-[18px] bg-white p-4 text-sm">
        {rows.map(([k, v], i) => (
          <span key={k} className={cx("flex justify-between gap-3", lk && i === 2 && "border-t border-divider pt-2 font-bold")}>
            <span>{k}</span>
            <span className="tabular-nums">{v}</span>
          </span>
        ))}
        {!lk && (
          <span className="flex flex-wrap gap-1.5 border-t border-divider pt-2.5">
            {["Every expense categorised", "No gaps longer than a month", "Mileage added"].map((t) => (
              <span key={t} className="rounded-full bg-pos-bg px-2.5 py-1 text-xs font-semibold text-pos">
                ✓ {t}
              </span>
            ))}
          </span>
        )}
      </div>
      <span className="text-[13px] leading-[1.45] text-muted">
        {lk ? "BillingEase doesn’t file to the IRD. You or your practitioner enter these figures on the return." : "BillingEase doesn’t file to HMRC. Your accountant files the update from their practice software."}
      </span>
      <div className="mt-auto flex flex-wrap items-center gap-2.5">
        {sent ? (
          <button type="button" className={CHIP} onClick={() => setSent(false)}>
            Undo
          </button>
        ) : (
          <button type="button" className={BTN_DARK} onClick={() => setSent(true)}>
            {lk ? "Share with your practitioner" : "Send to your accountant"}
          </button>
        )}
        <span aria-live="polite" className="text-[13px] text-muted">
          {sent ? (lk ? "Shared with Jayasinghe & Co (sample)." : "Sent to Dale & Shaw, with the CSV in their layout (sample).") : ""}
        </span>
      </div>
    </article>
  );
}

/** Check against a bank statement by hand (no bank feed: you type the statement balance). */
export function ReconcileDemo({ country }: { country: SiteCountry }) {
  const lk = country === "lk";
  const items = lk
    ? [
        { id: "fee", t: "Bank charge not in your books", d: "Monthly service charge, 30 Sep", v: 450, cta: "Add it", done: "Added as Bank charges" },
        { id: "chq", t: "Cheque #004512 hasn’t cleared", d: "From Kandyan Spice Co, banked 29 Sep", v: 302375, cta: "Mark as on its way", done: "Will clear in October" },
      ]
    : [
        { id: "fee", t: "Bank charge not in your books", d: "Monthly account fee, 30 Sep", v: 6, cta: "Add it", done: "Added as Bank charges" },
        { id: "chq", t: "Cheque from Ochre Café hasn’t cleared", d: "Paid in 29 Sep", v: 120, cta: "Mark as on its way", done: "Will clear in October" },
      ];
  const [fixed, setFixed] = useState<Record<string, boolean>>({});
  const book = lk ? 2682375 : 9986;
  const total = items.reduce((a, i) => a + i.v, 0);
  const left = total - items.filter((i) => fixed[i.id]).reduce((a, i) => a + i.v, 0);
  const statement = book - total;
  return (
    <article className="flex min-w-0 flex-[1_1_400px] flex-col gap-3.5 rounded-3xl bg-bg p-[clamp(20px,2.4vw,28px)]">
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">Check against your bank statement</h3>
        <span className="text-[13px] text-muted">Done by hand from your statement · September</span>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))" }}>
        <div className="flex flex-col rounded-[14px] bg-white px-3.5 py-3">
          <span className="text-[13px] text-muted">Statement says</span>
          <span className="text-[17px] font-bold tabular-nums">{money(statement, country)}</span>
        </div>
        <div className="flex flex-col rounded-[14px] bg-white px-3.5 py-3">
          <span className="text-[13px] text-muted">BillingEase says</span>
          <span className="text-[17px] font-bold tabular-nums">{money(book, country)}</span>
        </div>
        <div className={cx("flex flex-col rounded-[14px] px-3.5 py-3", left === 0 ? "bg-pos-bg text-pos" : "bg-due-bg text-due")}>
          <span className="text-[13px]">Left to explain</span>
          <span className="text-[17px] font-bold tabular-nums">{money(left, country)}</span>
        </div>
      </div>
      {items.map((i) => (
        <div key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-white px-4 py-3">
          <span className="flex min-w-0 flex-[1_1_180px] flex-col">
            <span className="text-sm font-bold">{i.t}</span>
            <span className="text-[13px] text-muted">{i.d}</span>
          </span>
          <span className="font-bold tabular-nums">{money(i.v, country)}</span>
          {fixed[i.id] ? (
            <span className="rounded-full bg-pos-bg px-2.5 py-1 text-xs font-semibold text-pos">{i.done}</span>
          ) : (
            <button type="button" className={cx(BTN_DARK, "min-h-10 px-4 text-[13px]")} onClick={() => setFixed({ ...fixed, [i.id]: true })}>
              {i.cta}
            </button>
          )}
        </div>
      ))}
      {left === 0 && (
        <div role="status" className="flex items-center gap-3 rounded-2xl bg-pos-bg py-3 pl-4 pr-3 text-sm font-semibold text-pos">
          <span className="min-w-0 flex-1">September matches the statement.</span>
          <button type="button" onClick={() => setFixed({})} className="min-h-8 px-2.5 text-[13px] underline">
            Start over
          </button>
        </div>
      )}
    </article>
  );
}

/** Accountant card with a pretend invite (nothing is sent). */
export function InviteDemo({ placeholderName, placeholderEmail }: { placeholderName: string; placeholderEmail: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  const nameOk = name.trim().length > 1;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const err = tried && !nameOk ? "Add your accountant’s name." : tried && !emailOk ? "That email doesn’t look right. Try name@firm.co.uk." : null;
  if (sent)
    return (
      <div role="status" className="flex flex-col gap-1.5 rounded-2xl bg-tint px-4 py-3.5">
        <span className="font-bold">Invite ready for {name.trim()}</span>
        <span className="text-sm text-ink2 [overflow-wrap:anywhere]">In your real account, {email.trim()} gets a link to the same books. Nothing was sent from this page.</span>
        <button type="button" onClick={() => (setSent(false), setName(""), setEmail(""))} className="min-h-9 self-start text-sm font-semibold underline">
          Invite someone else
        </button>
      </div>
    );
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[13px] font-bold">Try inviting your own</span>
      <div className="flex flex-wrap gap-2">
        <label className="flex flex-[1_1_160px] flex-col gap-1 text-[13px] font-bold">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholderName} className={cx(INPUT, "min-h-11", tried && !nameOk && "border-late")} />
        </label>
        <label className="flex flex-[1_1_200px] flex-col gap-1 text-[13px] font-bold">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={placeholderEmail} className={cx(INPUT, "min-h-11", tried && nameOk && !emailOk && "border-late")} />
        </label>
      </div>
      {err && (
        <span role="alert" className="text-[13px] font-semibold text-late">
          {err}
        </span>
      )}
      <button type="button" className={cx(BTN_DARK, "self-start")} onClick={() => (nameOk && emailOk ? (setSent(true), setTried(false)) : setTried(true))}>
        Preview the invite
      </button>
    </div>
  );
}

/** Lock a filed period: tick everything, then lock (prototype "Close the year"). */
export function LockDemo({ lock }: { lock: { title: string; sub: string; period: string; items: [string, string, string][] } }) {
  const [on, setOn] = useState<Record<string, boolean>>({ sorted: true, bank: true, sent: true, filed: false });
  const [locked, setLocked] = useState(false);
  const [toast, notify] = useToast();
  const all = lock.items.every((i) => on[i[0]]);
  return (
    <article className="flex min-w-0 flex-[1_1_400px] flex-col gap-3.5 rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">{lock.title}</h3>
        <span className="text-[13px] text-muted">{lock.sub}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {lock.items.map(([id, t, d]) => {
          const c = !!on[id];
          return (
            <li key={id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={c}
                disabled={locked}
                onClick={() => setOn({ ...on, [id]: !c })}
                className={cx("flex min-h-14 w-full items-center gap-3 rounded-2xl border border-line px-3.5 py-2.5 text-left text-sm font-semibold", c ? "bg-bg" : "bg-white", locked && "opacity-80")}
              >
                <span aria-hidden className={cx("flex size-[22px] flex-none items-center justify-center rounded-md border-2", c ? "border-coming bg-coming" : "border-input bg-white")}>
                  {c && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span>{t}</span>
                  <span className="text-xs font-medium text-muted">{d}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <span aria-live="polite" className="text-[13px] text-muted">
          {locked ? `${lock.period} is locked. Nothing in it can change by accident.` : all ? `Ready. Locking keeps ${lock.period} exactly as filed.` : "Tick everything to lock it."}
        </span>
        {locked ? (
          <button type="button" className={CHIP} onClick={() => setLocked(false)}>
            Unlock
          </button>
        ) : (
          <button type="button" className={BTN_DARK} disabled={!all} onClick={() => (setLocked(true), notify(`${lock.period} locked · still readable by everyone`))}>
            Lock {lock.period}
          </button>
        )}
      </div>
      <Toast text={toast} />
    </article>
  );
}
