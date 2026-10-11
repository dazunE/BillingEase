import type { HomeSummary } from "@billingease/contracts";
import { formatDate } from "@billingease/core";
import Link from "next/link";
import { ICONS, Icon } from "@/components/ui";
import { ago, inDays } from "./format";

export function RecentActivity({ items, practitioner }: { items: HomeSummary["activity"]; practitioner: string }) {
  return (
    <section aria-labelledby="recent-h" className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="recent-h" className="font-display text-lg font-bold tracking-[-0.02em]">Recent activity</h2>
        <span className="text-xs text-muted">Latest first</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-ink2">What you and your {practitioner} do shows up here: invoices sent, payments recorded, details changed.</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((a) => (
            <li key={a.id} className="flex gap-3 border-b border-divider py-2.5 last:border-0">
              <span className="mt-1.5 size-2 flex-none rounded-full bg-coming" aria-hidden />
              <span className="flex min-w-0 flex-col">
                {a.link ? <Link href={a.link} className="text-sm font-semibold hover:underline">{a.message}</Link> : <span className="text-sm font-semibold">{a.message}</span>}
                <span className="text-xs text-muted">{ago(a.createdAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Deadlines({ items }: { items: HomeSummary["deadlines"] }) {
  return (
    <section aria-labelledby="dl-h" className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-5">
      <h2 id="dl-h" className="font-display text-lg font-bold tracking-[-0.02em]">Coming up</h2>
      {items.length === 0 ? <p className="text-sm text-ink2">No dates coming up.</p> : (
        <ul className="flex flex-col">
          {items.map((d) => (
            <li key={d.date + d.label} className="flex items-start gap-3 border-b border-divider py-2.5 last:border-0">
              <span className="flex w-12 flex-none flex-col items-center rounded-xl bg-surface py-1 text-center">
                <span className="font-display text-base font-bold leading-tight">{d.date.slice(8, 10).replace(/^0/, "")}</span>
                <span className="text-[11px] font-semibold text-muted">{formatDate(d.date).split(" ")[1]}</span>
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold">{d.label}</span>
                <span className="text-xs text-muted">{d.detail} · {inDays(d.daysAway)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <span className="text-xs text-muted">Dates from the country rules; to be checked against official sources.</span>
    </section>
  );
}

export function FirstSteps({ steps }: { steps: HomeSummary["firstSteps"] }) {
  const done = steps.filter((s) => s.done).length;
  return (
    <section aria-labelledby="start-h" className="flex min-w-0 flex-[999_1_480px] flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="start-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">Get started <span className="font-semibold text-muted">{done} of {steps.length}</span></h2>
        <span className="text-[13px] text-muted">Do them in any order. Each one ticks itself off.</span>
      </div>
      <div className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white">
        {steps.map((s) => (
          <Link key={s.id} href={s.href} className="flex min-h-16 items-center gap-3.5 border-b border-divider px-5 py-3 last:border-0 hover:bg-bg">
            <span className={`flex size-7 flex-none items-center justify-center rounded-full ${s.done ? "bg-pos-bg text-pos" : "border-2 border-input"}`}>
              {s.done && <Icon d={ICONS.check} size={15} strokeWidth={3} />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={`font-semibold ${s.done ? "text-muted line-through" : ""}`}>{s.label}</span>
              <span className="text-[13px] text-muted">{s.done ? "Done" : s.hint}</span>
            </span>
            <Icon d={ICONS.arrowRight} size={18} />
          </Link>
        ))}
      </div>
    </section>
  );
}
