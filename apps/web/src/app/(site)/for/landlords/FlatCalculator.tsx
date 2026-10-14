"use client";

import { useId, useState } from "react";
import { cx } from "@/components/ui";
import { money } from "@/content/site/country";

const SHARES = [100, 50, 25];
const FEES = [0, 10, 12, 15];
const ALLOWANCE = 1000;
const BASIC = 0.2;

function Field({ label, hint, value, onChange }: { label: string; hint: string; value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-[1_1_140px] flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-bold">
        {label}
      </label>
      <span className="flex min-h-11 items-center gap-1.5 rounded-xl border border-input bg-white px-3 focus-within:outline-3 focus-within:outline-coming">
        <span className="text-sm text-muted">£</span>
        <input
          id={id}
          inputMode="numeric"
          value={value ? value.toLocaleString("en-GB") : ""}
          onChange={(e) => onChange(Math.min(1_000_000, +e.target.value.replace(/[^\d]/g, "") || 0))}
          className="tabular w-full min-w-0 bg-transparent text-[15px] outline-none"
        />
      </span>
      <span className="text-xs text-muted">{hint}</span>
    </div>
  );
}

function Pills({ label, items, value, onPick, fmt }: { label: string; items: number[]; value: number; onPick: (v: number) => void; fmt: (v: number) => string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-bold" id={id}>
        {label}
      </span>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-1 self-start rounded-3xl bg-surface p-1">
        {items.map((v) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onPick(v)} className={cx("min-h-11 rounded-full px-4 text-[13px] font-semibold", value === v ? "bg-ink text-white" : "text-ink")}>
            {fmt(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * "What does that flat really make you?": rent, share, agent fee, repairs and
 * mortgage interest in; a year's profit, the finance-cost reduction and the
 * £1,000 allowance comparison out (prototype SiteShops "What did that mug really earn me?").
 */
export function FlatCalculator() {
  const [rent, setRent] = useState(800);
  const [share, setShare] = useState(100);
  const [fee, setFee] = useState(12);
  const [repairs, setRepairs] = useState(1200);
  const [interest, setInterest] = useState(4900);

  const s = share / 100;
  const year = rent * 12 * s;
  const agent = rent * 12 * (fee / 100) * s;
  const other = repairs * s;
  const costs = agent + other;
  const profit = Math.max(0, year - costs);
  const int = interest * s;
  const credit = int * BASIC;
  // Basic-rate comparison: costs + finance-cost reduction, or the allowance (no reduction).
  const taxCosts = Math.max(0, profit * BASIC - credit);
  const taxAllow = Math.max(0, (year - ALLOWANCE) * BASIC);
  const allowBetter = taxAllow < taxCosts;
  const keep = profit - taxCosts;
  const pct = (v: number) => `${year > 0 ? Math.max(0, (v / year) * 100) : 0}%`;

  return (
    <div className="flex flex-wrap items-stretch gap-x-10 gap-y-7 rounded-[28px] border border-line bg-white p-[clamp(20px,3vw,36px)]">
      <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-5">
        <Pills label="Your ownership share" items={SHARES} value={share} onPick={setShare} fmt={(v) => (v === 100 ? "All of it" : `${v}%`)} />
        <Pills label="Letting agent’s fee" items={FEES} value={fee} onPick={setFee} fmt={(v) => (v === 0 ? "No agent" : `${v}%`)} />
        <div className="flex flex-wrap gap-3">
          <Field label="Rent a month" hint="The whole property" value={rent} onChange={setRent} />
          <Field label="Repairs and other costs" hint="A year, whole property" value={repairs} onChange={setRepairs} />
          <Field label="Mortgage interest" hint="A year, interest only" value={interest} onChange={setInterest} />
        </div>
      </div>

      <div className="box-border flex min-w-0 flex-[1_1_380px] flex-col gap-4 rounded-[22px] bg-bg p-[clamp(18px,2.6vw,28px)]" aria-live="polite">
        <span className="text-[13px] font-semibold text-muted">Your share, over a year</span>
        <span className="flex flex-wrap items-baseline gap-x-2.5">
          <span className="tabular font-display text-[clamp(36px,4.4vw,56px)] font-bold leading-none tracking-[-0.04em]">{money(profit, "uk")}</span>
          <span className="text-[15px] font-semibold text-ink2">profit before tax</span>
        </span>
        <span aria-hidden className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-surface">
          <span className="bg-going" style={{ width: pct(agent) }} />
          <span className="bg-going-light" style={{ width: pct(other) }} />
          <span className="bg-coming" style={{ width: pct(profit) }} />
        </span>
        <dl className="flex flex-col gap-1.5 text-sm">
          {(
            [
              ["bg-ink", "Rent, your share", money(year, "uk")],
              ["bg-going", "Letting agent’s fee", `−${money(agent, "uk")}`],
              ["bg-going-light", "Repairs and other costs", `−${money(other, "uk")}`],
              ["bg-coming", "Profit", money(profit, "uk")],
            ] as const
          ).map(([dot, l, v]) => (
            <div key={l} className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2">
                <span aria-hidden className={cx("size-2.5 rounded-sm", dot)} />
                {l}
              </dt>
              <dd className="tabular font-bold">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-line pt-3 text-[13px] leading-normal text-ink2">
          <strong className="text-ink">Mortgage interest isn’t a cost here.</strong> Your {money(int, "uk")} is kept apart, and 20% of it, {money(credit, "uk")}, comes off your Income Tax instead.
        </p>
        <p className={cx("rounded-xl px-3 py-2.5 text-[13px] leading-normal", allowBetter ? "bg-due-bg" : "bg-white")}>
          <strong>£1,000 property allowance: </strong>
          {allowBetter
            ? `better for you here. Taking it instead of costs saves about ${money(taxCosts - taxAllow, "uk")} at the basic rate, and means no mortgage interest reduction.`
            : `your costs and the interest reduction work out better than the allowance, so BillingEase uses those.`}
        </p>
        <p className="text-[13px] leading-normal text-ink2">
          <strong className="text-ink">After an estimated {money(taxCosts, "uk")} of tax at the basic rate,</strong> about {money(keep, "uk")} is yours to keep.
        </p>
      </div>
    </div>
  );
}
