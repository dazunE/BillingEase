"use client";

import { useId, useState } from "react";
import { cx } from "@/components/ui";
import { money, type SiteCountry } from "@/content/site/country";
import { LK_INSTALMENTS, MTD_QUARTERS, MTD_WAVES } from "@/content/site/sole-traders";

/**
 * The right-hand card of the tax section (prototype SiteFreelancers "Tax four
 * times a year"). UK: when MTD starts for your income, and the quarter dates.
 * Sri Lanka: the instalment dates and a set-aside you choose.
 */
export function TaxPanel({ country }: { country: SiteCountry }) {
  return country === "uk" ? <MtdPanel /> : <LkPanel />;
}

function Dates({ title, rows, current, mark }: { title: string; rows: { q: string; span: string; due: string }[]; current: number; mark: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[13px] font-bold">{title}</span>
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,110px),1fr))] gap-2">
        {rows.map((d, i) => (
          <li key={d.q} className={cx("flex flex-col gap-1 rounded-[14px] p-3", i === current ? "bg-ink text-white" : "bg-white")}>
            <strong className="font-display text-base">{d.q}</strong>
            <span className="text-xs opacity-85">{d.span}</span>
            <span className="text-xs font-bold">
              {i === current ? `${mark} · ` : ""}due {d.due}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function MtdPanel() {
  const [income, setIncome] = useState(34000);
  const id = useId();
  const wave = MTD_WAVES.find((w) => income > w.from);
  return (
    <div className="box-border flex min-w-0 flex-[1_1_440px] flex-col gap-[22px] rounded-[28px] bg-bg p-[clamp(20px,3vw,32px)]">
      <Dates title="Quarterly updates (standard quarters)" rows={MTD_QUARTERS} current={2} mark="Now" />
      <div className="flex flex-col gap-2.5">
        <label htmlFor={id} className="flex justify-between gap-3 text-[13px] font-bold">
          <span>Your qualifying income (before costs)</span>
          <span className="tabular">{money(income, "uk")}</span>
        </label>
        <input id={id} type="range" min={10000} max={80000} step={1000} value={income} onChange={(e) => setIncome(+e.target.value)} className="m-0 h-11 w-full accent-coming" />
      </div>
      <div className="flex flex-col gap-3 rounded-[22px] bg-ink p-[22px] text-white" aria-live="polite">
        <span className="text-sm font-semibold text-tint">Making Tax Digital starts for you</span>
        <span className="font-display text-[clamp(30px,3.6vw,44px)] font-bold leading-none tracking-[-0.035em] text-violet">{wave ? wave.start : "Not yet"}</span>
        <span className="text-sm leading-normal text-tint">
          {wave
            ? `${wave.label} in a tax year means quarterly updates from ${wave.start}. BillingEase gets your records ready; your accountant sends them.`
            : "Under £20,000 you’re not in the announced waves yet. Keeping records the MTD way now makes the switch a non-event."}
        </span>
      </div>
    </div>
  );
}

const RATES = [10, 15, 20];

function LkPanel() {
  const [profit, setProfit] = useState(980000);
  const [rate, setRate] = useState(15);
  const id = useId();
  const tax = Math.round((profit * rate) / 100 / 50) * 50;
  const each = Math.round(tax / 4 / 50) * 50;
  return (
    <div className="box-border flex min-w-0 flex-[1_1_440px] flex-col gap-[22px] rounded-[28px] bg-bg p-[clamp(20px,3vw,32px)]">
      <Dates title="Income tax instalments" rows={LK_INSTALMENTS} current={1} mark="Next" />
      <div className="flex flex-col gap-2.5">
        <label htmlFor={id} className="flex justify-between gap-3 text-[13px] font-bold">
          <span>Profit so far this year</span>
          <span className="tabular">{money(profit, "lk")}</span>
        </label>
        <input id={id} type="range" min={0} max={4000000} step={20000} value={profit} onChange={(e) => setProfit(+e.target.value)} className="m-0 h-11 w-full accent-coming" />
      </div>
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
        <span className="text-[13px] font-bold">Set aside</span>
        <div role="group" aria-label="Set-aside share" className="flex flex-wrap gap-1 rounded-3xl bg-surface p-1">
          {RATES.map((r) => (
            <button key={r} type="button" aria-pressed={rate === r} onClick={() => setRate(r)} className={cx("min-h-11 rounded-full px-4 text-sm font-semibold", rate === r ? "bg-ink text-white" : "text-ink")}>
              {r}%
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-[22px] bg-ink p-[22px] text-white" aria-live="polite">
        <span className="text-sm font-semibold text-tint">Set aside so far</span>
        <span className="tabular font-display text-[clamp(30px,3.6vw,44px)] font-bold leading-none tracking-[-0.035em] text-violet">{money(tax, "lk")}</span>
        <span aria-hidden className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-white/[0.16]">
          <span className="bg-violet" style={{ width: `${100 - rate}%` }} />
          <span className="bg-tint/45" style={{ width: `${rate}%` }} />
        </span>
        <span className="text-sm leading-normal text-tint">
          About {money(each, "lk")} for each instalment. The rest, {money(profit - tax, "lk")}, is yours to spend. The share is your choice; BillingEase’s estimate uses the current rates and reliefs.
        </span>
      </div>
    </div>
  );
}
