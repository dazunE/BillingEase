import { books } from "@billingease/contracts";
import { addDays, rulesFor, today } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { Checks, Hero, Lines, longDate, Panel, pence, signed, StatePill } from "@/components/keep/parts";
import { LockForm } from "@/components/keep/LockForm";
import { cx, Icon, ICONS } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Tax and year-end" };

/** Tax year end (prototype BooksTax): what's left before the year's return, and the pack for your accountant. */
export default async function YearEndPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { business: b } = await requireBusiness();
  const { year } = await searchParams;
  const rules = rulesFor(b.country);
  const lk = b.country === "lk", uk = b.country === "uk";
  const practitioner = rules.wording.practitionerNoun;
  const cur = b.currency;
  const t = today();
  const thisYear = rules.taxYearOf(t);
  const lastYear = rules.taxYearOf(addDays(thisYear.from, -1));
  const date = year === "last" ? lastYear.from : undefined;
  const [r, quarters] = await Promise.all([
    load(books.yearEnd, { query: { date } }),
    rules.features.mtdQuarters ? load(books.quarters, { query: { date } }) : null,
  ]);
  const y = r.taxYear;
  const ended = y.to < t;
  // When the year's return is due: UK 31 January after; Sri Lanka 30 November after (to confirm); US 15 April.
  const endYear = Number(y.to.slice(0, 4));
  const returnDue = uk ? `${endYear + 1}-01-31` : lk ? `${endYear}-11-30` : `${endYear + 1}-04-15`;
  const returnName = uk ? "final declaration" : lk ? "income tax return" : "Schedule C with your Form 1040";

  const steps = [
    ...(quarters?.quarters ?? []).map((q) => ({
      id: q.id, label: `${q.label.split(" ")[0]} update`, ok: q.state === "sent",
      detail: q.state === "sent" ? `Sent${q.lock?.lockedBy ? ` by ${q.lock.lockedBy}` : ""}` : q.state === "upcoming" ? `Starts ${longDate(q.from)}` : q.state === "open" ? `Under way · closes ${longDate(q.to)}` : `Closed · send it by ${longDate(q.due)}`,
      href: `/app/keep/quarters?q=${q.id}`, cta: q.state === "closed" ? "Send" : "Open",
    })),
    ...r.checks,
  ];
  const done = steps.filter((s) => s.ok).length;
  const pl = r.profitAndLoss;

  return (
    <>
      <AppCrumbs area="keep" trail={[{ label: "Yours to keep", href: "/app/keep" }, { label: "Tax and year-end" }]} />

      <Hero
        eyebrow={`${lk ? "Year of assessment" : "Tax year"} end · ${y.label}`}
        big={longDate(returnDue)}
        chips={<><StatePill state={r.lock ? "sent" : ended ? "closed" : "open"} label={r.lock ? "Year closed" : ended ? "Year ended" : "Year in progress"} /><span>Your {returnName} is due {longDate(returnDue)}{lk ? " (to confirm)" : ""}</span></>}
      >
        {ended ? <>The {y.label} year ended on {longDate(y.to)}. Your {practitioner} adds the year-end adjustments and files your {returnName}.</>
          : <>The year ends on {longDate(y.to)}, in {r.daysToEnd} days. {uk ? `After the four quarterly updates, your ${practitioner} adds the year-end adjustments and files the final declaration.` : `Then your ${practitioner} prepares your ${returnName}${lk ? " with TaxWise.lk" : ""}.`}</>}
      </Hero>

      <nav aria-label="Year" className="flex flex-wrap gap-1 self-start rounded-[22px] bg-surface p-1">
        {[["", thisYear.label], ["last", lastYear.label]].map(([k, label]) => (
          <Link key={k} href={k ? `/app/keep/year-end?year=${k}` : "/app/keep/year-end"} aria-current={(year ?? "") === k ? "page" : undefined}
            className={cx("flex min-h-10 items-center rounded-full px-4 text-sm font-semibold", (year ?? "") === k ? "bg-ink text-white" : "text-ink hover:bg-white/60")}>{label}</Link>
        ))}
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel id="toward-h" title={`Toward your ${returnName}`} aside={<span className="text-[13px] text-muted">{done} of {steps.length} done</span>}>
          <div className="h-2 overflow-hidden rounded-full bg-surface" aria-hidden><span className="block h-full rounded-full bg-violet" style={{ width: `${Math.round((done / Math.max(1, steps.length)) * 100)}%` }} /></div>
          <Checks items={steps} />
          {ended && !r.lock && b.role !== "admin" && (
            <div className="flex flex-col gap-3 border-t border-divider pt-4">
              <span className="font-semibold">Close the year</span>
              <LockForm from={y.from} to={y.to} label={`The ${y.label} ${returnName}`} button={`Close ${y.label}`} referenceHint="Your return's reference, if you have it" />
            </div>
          )}
          {r.lock && <p className="text-sm text-ink2">{y.label} was closed{r.lock.lockedBy ? ` by ${r.lock.lockedBy}` : ""}. Nothing more can be recorded in it.</p>}
        </Panel>

        <Panel id="pack-h" title={`${uk ? "Final-declaration" : "Year-end"} pack`} aside={<span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold text-ink2">{ended ? "Final figures" : "So far"}</span>}
          sub={`Everything your ${practitioner} needs for ${y.label}: the year by category and the tax estimate.`}>
          <Lines heading="Income" rows={pl.income.map((l) => ({ key: l.code, name: l.name, sub: l.official ?? undefined, amount: pence(l.amount, cur) }))} empty="No income recorded." />
          <Lines heading="Costs" rows={pl.expenses.map((l) => ({ key: l.code, name: l.name, sub: l.official ?? undefined, amount: signed(-l.amount, cur), tag: l.allowable === false ? { text: "Not allowable", tone: "neutral" as const } : undefined }))}
            empty="No costs recorded." total={{ label: "Profit", sub: "Income less allowable costs", amount: signed(pl.profit + pl.disallowed, cur) }} />
          <Lines heading="Tax"
            rows={[
              { key: "est", name: `Estimated ${r.estimate.label} for ${y.label}`, sub: r.estimate.verified ? undefined : `Estimate · your ${practitioner} confirms the final figure`, amount: pence(r.estimate.total, cur) },
              ...r.instalments.map((i) => ({ key: i.due, name: i.label, sub: `Due ${longDate(i.due)}`, amount: pence(i.amount, cur) })),
            ]}
          />
          <a href={`/app/keep/reports/export?from=${y.from}&to=${ended ? y.to : t}`} download className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-ink/[0.07] px-5 text-[15px] font-semibold hover:bg-ink/[0.11]"><Icon d={ICONS.download} size={18} />Download as CSV</a>
        </Panel>
      </div>
      <p className="text-[13px] text-muted">BillingEase doesn&apos;t file with {lk ? "the IRD" : uk ? "HMRC" : "the IRS"}. Your {practitioner} files {uk ? "the quarterly updates and the final declaration through their MTD software" : `your ${returnName}`}.</p>
    </>
  );
}
