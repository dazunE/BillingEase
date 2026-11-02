import { books, home } from "@billingease/contracts";
import { addDays, addMonths, monthPeriod, periodsFor, rulesFor, today } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { Hero, Lines, longDate, Panel, pence, range, signed } from "@/components/keep/parts";
import { cx, Icon, ICONS } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Reports" };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reports (prototype BooksReports): the profit and loss and balance sheet, from the ledger, with CSV downloads. */
export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ report?: string; range?: string; from?: string; to?: string; at?: string }> }) {
  const { business: b } = await requireBusiness();
  const sp = await searchParams;
  const lk = b.country === "lk";
  const rules = rulesFor(b.country);
  const practitioner = rules.wording.practitionerNoun;
  const cur = b.currency;
  const t = today();
  const ps = periodsFor({ country: b.country, quarterType: b.quarterType }, t);
  const lastYear = rules.taxYearOf(addDays(ps.year.from, -1));
  const lastMonth = monthPeriod(addMonths(ps.month.from, -1));
  const ranges = [
    { id: "month", label: monthPeriod(t).label.split(" ")[0], from: ps.month.from, to: t },
    { id: "last-month", label: lastMonth.label.split(" ")[0], from: lastMonth.from, to: lastMonth.to },
    ...(lk ? [] : [{ id: "quarter", label: ps.quarter.label.split(" ")[0], from: ps.quarter.from, to: t < ps.quarter.to ? t : ps.quarter.to }]),
    { id: "year", label: rules.taxYearOf(t).label, from: ps.year.from, to: t < ps.year.to ? t : ps.year.to },
    { id: "last-year", label: lastYear.label, from: lastYear.from, to: lastYear.to },
  ];
  const custom = DATE.test(sp.from ?? "") && DATE.test(sp.to ?? "");
  const chosen = custom ? { id: "custom", label: "Your dates", from: sp.from!, to: sp.to! } : ranges.find((r) => r.id === sp.range) ?? ranges.find((r) => r.id === "year")!;
  const balance = sp.report === "balance-sheet";
  const at = DATE.test(sp.at ?? "") ? sp.at! : t;

  const [summary, pl, bs] = await Promise.all([
    load(home.summary, { query: { period: "year" } }),
    balance ? null : load(books.profitAndLoss, { query: { from: chosen.from, to: chosen.to } }),
    balance ? load(books.balanceSheet, { query: { at } }) : null,
  ]);

  const tab = (on: boolean) => cx("flex min-h-10 items-center rounded-full px-4 text-sm font-semibold no-underline", on ? "bg-ink text-white" : "text-ink hover:bg-white/60");
  const exportHref = balance ? `/app/keep/reports/export?report=balance-sheet&at=${at}` : `/app/keep/reports/export?from=${chosen.from}&to=${chosen.to}`;
  const toSort = pl?.expenses.find((l) => l.code === "6990");

  return (
    <>
      <AppCrumbs area="keep" trail={[{ label: "Yours to keep", href: "/app/keep" }, { label: "Reports" }]} />

      <Hero
        eyebrow={`Reports · ${b.name}`}
        big={pence(summary.comingIn.total - summary.goingOut.total, cur).replace(/\.\d+$/, "")}
        tiles={[
          { label: "Coming in", value: pence(summary.comingIn.total, cur).replace(/\.\d+$/, "") },
          { label: "Going out", value: pence(summary.goingOut.total, cur).replace(/\.\d+$/, "") },
          { label: "Yours to keep", value: signed(summary.keep, cur).replace(/\.\d+$/, ""), accent: true },
        ]}
      >
        Profit for {summary.tax.taxYear} so far ({longDate(summary.period.from)} to today), counting money on the way as on Home. The reports below read your books entry by entry, on the dates things were invoiced, billed and paid.
      </Hero>

      <nav aria-label="Report" className="flex flex-wrap gap-1 self-start rounded-[22px] bg-surface p-1">
        <Link href="/app/keep/reports" aria-current={!balance ? "page" : undefined} className={tab(!balance)}>Profit and loss</Link>
        <Link href="/app/keep/reports?report=balance-sheet" aria-current={balance ? "page" : undefined} className={tab(balance)}>Balance sheet</Link>
        <Link href="/app/in/invoices?status=unpaid" className={tab(false)}>Owed to you</Link>
        <Link href="/app/out/bills" className={tab(false)}>Bills to pay</Link>
        {rules.features.mtdQuarters && <Link href="/app/keep/quarters" className={tab(false)}>Quarters</Link>}
      </nav>

      {pl && (
        <Panel id="pl-h" title="Profit and loss" sub={`${range(pl.from, pl.to)} · in ${lk ? "the income tax return's" : b.country === "us" ? "Schedule C" : "HMRC's"} categories`}
          aside={
            <nav aria-label="Dates" className="flex flex-wrap gap-1 rounded-[22px] bg-surface p-1">
              {ranges.map((r) => <Link key={r.id} href={`/app/keep/reports?range=${r.id}`} scroll={false} aria-current={r.id === chosen.id ? "page" : undefined} className={tab(r.id === chosen.id)}>{r.label}</Link>)}
            </nav>
          }>
          <form className="flex flex-wrap items-end gap-2 text-sm" action="/app/keep/reports">
            <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-muted">From</span><input type="date" name="from" defaultValue={pl.from} className="min-h-10 rounded-[10px] border border-input px-3" /></label>
            <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-muted">To</span><input type="date" name="to" defaultValue={pl.to} className="min-h-10 rounded-[10px] border border-input px-3" /></label>
            <button className="min-h-10 rounded-full bg-ink/[0.07] px-4 font-semibold hover:bg-ink/[0.11]">Show</button>
          </form>
          <Lines heading="Income" rows={pl.income.map((l) => ({ key: l.code, name: l.name, sub: l.official ?? undefined, amount: pence(l.amount, cur) }))} empty="No income in these dates." />
          <Lines heading="Costs"
            rows={pl.expenses.filter((l) => l.allowable !== false).map((l) => ({
              key: l.code, name: l.name, sub: l.official ?? undefined, amount: signed(-l.amount, cur),
              tag: l.code === "6990" ? { text: "Needs a category", tone: "late" as const } : undefined, tone: l.code === "6990" ? "late" as const : undefined, href: l.code === "6990" ? "/app/out?sort=1" : undefined,
            }))}
            empty="No costs in these dates."
            total={{ label: "Profit", sub: "Income less allowable costs", amount: signed(pl.profit + pl.disallowed, cur) }}
          />
          {pl.disallowed > 0 && (
            <Lines heading="Not counted against profit"
              rows={pl.expenses.filter((l) => l.allowable === false).map((l) => ({ key: l.code, name: l.name, sub: l.official ?? undefined, amount: pence(l.amount, cur) }))}
              total={{ label: "Profit after every cost", sub: `What's left once these are paid too; your ${practitioner} uses the profit above for tax`, amount: signed(pl.profit, cur), band: true }}
            />
          )}
          {toSort && <p className="text-[13px] text-ink2">{pence(toSort.amount, cur)} isn&apos;t sorted yet; it&apos;s counted as a cost until it is. <Link href="/app/out?sort=1" className="font-semibold underline underline-offset-4">Sort it</Link></p>}
        </Panel>
      )}

      {bs && (
        <Panel id="bs-h" title="Balance sheet" sub={`What ${b.name} owns and owes on ${longDate(bs.at)}`}
          aside={
            <form className="flex items-end gap-2 text-sm" action="/app/keep/reports">
              <input type="hidden" name="report" value="balance-sheet" />
              <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-muted">On</span><input type="date" name="at" defaultValue={bs.at} className="min-h-10 rounded-[10px] border border-input px-3" /></label>
              <button className="min-h-10 rounded-full bg-ink/[0.07] px-4 font-semibold hover:bg-ink/[0.11]">Show</button>
            </form>
          }>
          <Lines heading="What you own" rows={bs.assets.map((l) => ({ key: l.code, name: l.name, amount: signed(l.amount, cur) }))} empty="Nothing yet." total={{ label: "Total you own", amount: signed(bs.totalAssets, cur) }} />
          <Lines heading="What you owe" rows={bs.liabilities.map((l) => ({ key: l.code, name: l.name, amount: signed(l.amount, cur) }))} empty="Nothing owed." total={{ label: "Total you owe", amount: signed(bs.totalLiabilities, cur) }} />
          <Lines heading="Your money in the business"
            rows={[...bs.equity.map((l) => ({ key: l.code, name: l.name, amount: signed(l.amount, cur) })), { key: "profit", name: "Profit kept in the business", sub: "Every profit since you started, less what you took out above", amount: signed(bs.profitToDate, cur) }]}
            total={{ label: "What the business is worth to you", sub: "What you own less what you owe", amount: signed(bs.totalEquity, cur), band: true }}
          />
        </Panel>
      )}

      <div className="flex flex-wrap gap-2.5">
        <a href={exportHref} download className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink/[0.07] px-5 text-[15px] font-semibold hover:bg-ink/[0.11]"><Icon d={ICONS.download} size={18} />Export CSV</a>
        <Link href="/app/keep" className="inline-flex min-h-11 items-center rounded-full bg-ink/[0.07] px-5 text-[15px] font-semibold hover:bg-ink/[0.11]">See the {summary.tax.label} estimate</Link>
      </div>
      <p className="text-[13px] text-muted">Figures are what you&apos;ve recorded. Your {practitioner} can see the same reports.</p>
    </>
  );
}
