import { goingOut } from "@billingease/contracts";
import { formatDate, formatMoney, monthEnd } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { deleteMonthly, pauseMonthly } from "@/app/app/out/actions";
import { Crumbs, Empty, HeroCard, Legend, SplitBar, StateBadge } from "@/components/out/bits";
import { EditMonthly, MonthlyForm, RecordMonthly } from "@/components/out/MonthlyForms";
import { ActionButton } from "@/components/out/quick";
import { SectionTitle, cx } from "@/components/ui";
import { load } from "@/lib/api";

export const metadata: Metadata = { title: "Every month" };

const ord = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function MonthlyPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const sp = await searchParams;
  const [setup, data, suppliers] = await Promise.all([load(goingOut.setup), load(goingOut.monthly), load(goingOut.suppliers)]);
  const fmt = (m: number) => formatMoney(m, setup.currency);
  const t = data.totals;
  const monthName = data.month.label.split(" ")[0];
  const sups = suppliers.suppliers.map((s) => ({ id: s.id, name: s.name }));
  const toCome = data.costs.filter((c) => c.state === "due" || c.state === "late");
  const days = Number(monthEnd(data.month.from).slice(8));
  const dayState = (d: number) => {
    const on = data.costs.filter((c) => c.active || c.state === "recorded").filter((c) => c.dayOfMonth === d);
    if (on.length === 0) return null;
    return on.every((c) => c.state === "recorded") ? "paid" : "due";
  };
  const todayDay = Number(setup.today.slice(8));

  return (
    <>
      <Crumbs trail={[{ label: "Going out", href: "/app/out" }, { label: "Every month" }]} />
      <HeroCard label="Every month" amount={<>{fmt(t.perMonth)} <span className="text-base font-bold tracking-normal text-ink2">a month · {fmt(t.perMonth * 12)} a year</span></>}
        sub={<><SplitBar paid={t.recorded} toPay={t.toPay} /><Legend paid={t.recorded} toPay={t.toPay} currency={setup.currency} paidLabel={`recorded as paid in ${monthName}`} toPayLabel={`still to pay by ${formatDate(data.month.to)}`} /></>}>
        <p className="text-[15px] leading-relaxed">
          {setup.country === "uk" ? "Desk rent, phone and software" : "Rent, utilities and services"} you pay every month. Set each one up once; on the day, record the payment and it moves to paid in its category. Until then it counts as still to pay.
        </p>
      </HeroCard>

      <section id="new" className="scroll-mt-4 rounded-3xl border border-going bg-white p-[clamp(18px,3vw,28px)]" aria-labelledby="new-h">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="new-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">Set up a cost you pay every month</h2>
          <span className="text-[13px] text-muted">Like rent, a phone contract or a cleaner. Nothing is paid from here.</span>
        </div>
        <MonthlyForm key={sp.new ?? "form"} setup={setup} suppliers={sups} />
      </section>

      {data.costs.length > 0 && (
        <section className="flex flex-col gap-4" aria-labelledby="come-h">
          <SectionTitle id="come-h" aside={toCome.length ? `${toCome.length} more payment${toCome.length === 1 ? "" : "s"} · ${fmt(t.toPay)} still to pay` : "All recorded"}>Still to come in {monthName}</SectionTitle>
          <div className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-[clamp(14px,2.5vw,20px)]">
            <ol className="grid grid-cols-[repeat(auto-fill,minmax(30px,1fr))] gap-1" aria-label={`Days of ${data.month.label}`}>
              {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
                const st = dayState(d);
                return (
                  <li key={d} className={cx("flex h-8 items-center justify-center rounded-md text-xs font-bold",
                    st === "paid" ? "bg-going text-white" : st === "due" ? "bg-going-light" : "bg-surface text-ink2", d === todayDay && "ring-2 ring-ink")}
                    aria-label={`${d}${st === "paid" ? ", paid" : st === "due" ? ", still to pay" : ""}${d === todayDay ? ", today" : ""}`}>{d}</li>
                );
              })}
            </ol>
            <div className="flex flex-wrap gap-4 text-xs text-ink2">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-going" />Paid</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-going-light" />Still to pay</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] ring-2 ring-ink" />Today, {formatDate(setup.today)}</span>
            </div>
            {toCome.length > 0 && (
              <div className="grid gap-2.5 md:grid-cols-2">
                {toCome.map((c) => (
                  <div key={c.id} className={cx("flex flex-wrap items-center gap-3.5 rounded-2xl p-3.5", c.state === "late" ? "bg-due-bg" : "bg-going-tint")}>
                    <span className="flex w-10 flex-col items-center leading-tight"><span className="text-[11px] font-bold">{WEEKDAY[new Date(c.dueOn + "T00:00:00Z").getUTCDay()].toUpperCase()}</span><span className="font-display text-lg font-bold">{c.dayOfMonth}</span></span>
                    <span className="flex min-w-0 flex-1 flex-col"><span className="font-bold">{c.name}</span><span className="text-[13px] text-ink2">{fmt(c.amount)} · {c.method}{c.state === "late" ? " · was due" : ""}</span></span>
                    <RecordMonthly cost={c} currency={setup.currency} today={setup.today} methods={setup.payMethods} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4" aria-labelledby="all-h">
        <SectionTitle id="all-h" aside="In order of the day they renew">All of them <span className="text-muted">{data.costs.length}</span></SectionTitle>
        <div className="rounded-3xl border border-line bg-white p-[clamp(12px,2.5vw,20px)]">
          {data.costs.length === 0 ? <Empty>Nothing set up yet. Add the costs you pay every month above.</Empty> : (
            <ul className="flex flex-col divide-y divide-divider">
              {data.costs.map((c) => (
                <li key={c.id} className={cx("flex flex-wrap items-center gap-x-3.5 gap-y-2 py-3.5", !c.active && "opacity-70")}>
                  <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl bg-going-tint leading-none"><span className="font-bold">{c.dayOfMonth}</span><span className="text-[10px] font-bold">{ord(c.dayOfMonth).slice(-2)}</span></span>
                  <span className="flex min-w-0 flex-[1_1_220px] flex-col">
                    <span className="font-bold">{c.name}</span>
                    <span className="text-[13px] text-muted">
                      {c.categoryName} · every month on the {ord(c.dayOfMonth)} · {c.method}
                      {c.supplierId && c.supplierName && <> · <Link href={`/app/out/suppliers/${c.supplierId}`} className="underline underline-offset-2">{c.supplierName}</Link></>}
                    </span>
                  </span>
                  <StateBadge state={c.state}>
                    {c.state === "recorded" ? `Recorded ${formatDate(c.recordedOn!)}` : c.state === "paused" ? "Paused" : c.state === "late" ? `Was due ${formatDate(c.dueOn)}` : `Due ${formatDate(c.dueOn)}`}
                  </StateBadge>
                  <span className="text-[13px] text-muted">Next {formatDate(c.nextOn)}</span>
                  <span className="ml-auto font-bold tabular">{fmt(c.amount)}</span>
                  <span className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                    {(c.state === "due" || c.state === "late") && <RecordMonthly cost={c} currency={setup.currency} today={setup.today} methods={setup.payMethods} />}
                    {c.state === "recorded" && c.recordedExpenseId && <Link href={`/app/out/expenses/${c.recordedExpenseId}`} className="flex min-h-11 items-center px-2 text-sm font-semibold underline underline-offset-4">See payment</Link>}
                    <ActionButton action={pauseMonthly} fields={{ id: c.id, active: String(!c.active) }} variant="ghost">{c.active ? "Pause" : "Resume"}</ActionButton>
                    <ActionButton action={deleteMonthly} fields={{ id: c.id }} variant="ghost" confirm={`Stop ${c.name}? Payments already recorded stay in your books.`}>Delete</ActionButton>
                    <EditMonthly setup={setup} suppliers={sups} cost={c} />
                  </span>
                </li>
              ))}
              <li className="flex flex-wrap justify-between gap-2 pt-3.5 text-sm">
                <span><strong className="tabular">{fmt(t.recorded)}</strong> paid · <strong className="tabular">{fmt(t.toPay)}</strong> still to pay this month</span>
                <strong className="tabular">{fmt(t.perMonth)} a month</strong>
              </li>
            </ul>
          )}
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-ink p-[clamp(20px,3vw,28px)] text-white">
        <div className="flex max-w-[560px] flex-col gap-2">
          <h2 className="font-display text-xl font-bold text-violet">How these count in your numbers</h2>
          <p className="text-[15px] text-white/80">Until you record {monthName}&apos;s payment, a cost waits as still to pay. Record it and it moves to paid, in its category. Pause or stop one and it comes off. BillingEase never pays anything for you.</p>
        </div>
        <Link href="/app/out" className="font-bold underline underline-offset-4">See all of Going out</Link>
      </section>
    </>
  );
}
