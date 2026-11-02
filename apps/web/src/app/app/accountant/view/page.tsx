import { books, practice } from "@billingease/contracts";
import { formatMoney, rulesFor, today } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { Checks, Lines, longDate, range, signed, StatePill } from "@/components/keep/parts";
import { ButtonLink, cx, Icon } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "What your accountant sees" };

const EYE = "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6";

/** What your accountant sees (prototype PracticeView): this business as a client, from their side. */
export default async function PracticeViewPage() {
  const { business: b } = await requireBusiness();
  const rules = rulesFor(b.country);
  const noun = rules.wording.practitionerNoun;
  const uk = b.country === "uk", lk = b.country === "lk";
  const cur = b.currency;
  const [o, quarters, periods, pl] = await Promise.all([
    load(practice.overview),
    uk ? load(books.quarters) : null,
    lk && (b.vatRegistered || b.ssclRegistered) ? load(books.taxPeriods) : null,
    load(books.profitAndLoss),
  ]);
  const linked = o.accountants[0]?.name ?? null;
  const name = linked ?? `your ${noun}`;
  const open = o.requests.filter((r) => r.status === "open");
  const q = quarters ? [...quarters.quarters].reverse().find((x) => x.state === "closed") ?? quarters.quarters.find((x) => x.id === quarters.current) ?? null : null;
  const p = periods ? [...periods.periods].reverse().find((x) => x.state === "closed") ?? periods.periods.find((x) => x.id === periods.current) ?? null : null;
  const focus = q ?? p;
  const range2 = focus ? { from: focus.from, to: focus.to } : { from: pl.from, to: pl.to };
  const period = focus ? (await load(books.profitAndLoss, { query: range2 })) : pl;
  const waiting = (focus?.checks.some((c) => !c.ok) ?? false) || open.length > 0;
  const status = focus?.state === "sent" ? ["Filed", "sent"] : waiting ? ["Waiting on client", "closed"] : focus?.state === "closed" ? ["Ready to file", "open"] : ["In progress", "open"];
  const kind = { sole_trader: "Sole trader", landlord: "Landlord", both: "Sole trader and landlord", sole_proprietor: "Sole proprietor", partnership: "Partnership" }[b.kind];

  return (
    <>
      <AppCrumbs area="biz" trail={[{ label: "Your business", href: "/app/settings/business" }, { label: `Your ${noun}`, href: "/app/accountant" }, { label: "Their view" }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[780px] flex-col gap-2">
          <span className="flex items-center gap-2 self-start rounded-full bg-due-bg px-3 py-1 text-xs font-bold text-due"><Icon d={EYE} size={14} />Preview of your {noun}&apos;s view</span>
          <h1 className="font-display text-[clamp(28px,4vw,44px)] font-bold leading-[1.08] tracking-[-0.03em]">What {name} sees</h1>
          <p className="text-ink2">Your {noun} sees {b.name} as one of their clients: {uk ? "the quarter's status" : lk ? "the VAT and SSCL month" : "the year so far"}, the readiness checks, totals by category and the requests they&apos;ve sent you.</p>
        </div>
        <ButtonLink href="/app/accountant" variant="secondary">Back to your {noun}</ButtonLink>
      </div>

      <section className="overflow-hidden rounded-3xl border border-line bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-ink px-6 py-3.5 text-white">
          <span className="flex items-center gap-2.5 font-semibold"><span className="flex size-7 items-center justify-center rounded-lg bg-violet text-xs font-bold text-ink">{lk ? rules.wording.practitionerTool.slice(0, 2).toUpperCase() : "PW"}</span>{lk ? rules.wording.practitionerTool : "Practice workbench"}</span>
          {linked && <span className="text-sm text-white/75">Signed in as {linked}</span>}
        </div>
        <div className="flex flex-col gap-5 p-[clamp(18px,3vw,28px)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col">
              <span className="flex flex-wrap items-center gap-2 font-display text-2xl font-bold">{b.name}<span className="rounded-full bg-tint px-2.5 py-0.5 font-sans text-xs font-bold">Your business, live</span></span>
              <span className="text-sm text-ink2">{[b.ownerName, kind, b.taxId ? `${rules.wording.taxIdLabel} ${b.taxId}` : null, b.basis === "cash" ? "Cash basis" : "Accrual basis", b.town].filter(Boolean).join(" · ")}</span>
            </div>
            <StatePill state={status[1]} label={status[0]} />
          </div>
          {focus && (
            <p className={cx("rounded-2xl px-4 py-3 text-sm font-semibold", focus.state === "sent" ? "bg-pos-bg text-pos" : "bg-due-bg text-due")}>
              {focus.label} ({range(focus.from, focus.to)}) · {status[0]} <span className="font-normal">{uk ? "Quarterly update" : "Return"} due {longDate(focus.due)}{focus.daysToDue >= 0 && focus.state !== "sent" ? ` · in ${focus.daysToDue} days` : ""}</span>
            </p>
          )}
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-w-0 flex-col gap-4">
              <h2 className="font-display text-lg font-bold">Totals by {uk ? "HMRC" : lk ? "return" : "Schedule C"} category{focus ? `, ${focus.label.split(" ")[0]}` : ""}</h2>
              <Lines rows={[
                ...period.income.map((l) => ({ key: l.code, name: l.name, sub: l.official ?? undefined, amount: formatMoney(l.amount, cur, { decimals: "never" }) })),
                ...period.expenses.map((l) => ({ key: l.code, name: l.name, sub: l.official ?? undefined, amount: formatMoney(l.amount, cur, { decimals: "never" }) })),
              ]} empty="Nothing recorded in this period yet." total={{ label: "Profit", sub: period.disallowed ? "Income less allowable costs" : "Income less costs", amount: signed(period.profit + period.disallowed, cur) }} />
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              {focus && <><h2 className="font-display text-lg font-bold">Readiness</h2><Checks items={focus.checks} /></>}
              <h2 className="font-display text-lg font-bold">Requests to the client</h2>
              {o.requests.length === 0 ? <p className="text-sm text-muted">None sent.</p> : (
                <ul className="flex flex-col gap-2">
                  {o.requests.slice(0, 6).map((r) => (
                    <li key={r.id} className="flex items-start justify-between gap-2 rounded-2xl bg-bg p-3 text-sm"><span>{r.title}</span><span className={cx("shrink-0 rounded-full px-2 py-0.5 text-xs font-bold", r.status === "open" ? "bg-due-bg text-due" : "bg-pos-bg text-pos")}>{r.status === "open" ? "Open" : "Done"}</span></li>
                  ))}
                </ul>
              )}
              {focus && focus.state !== "sent" && <p className="text-xs text-muted">Once they&apos;ve filed, they mark {focus.label.split(" ")[0]} {uk ? "sent" : "filed"}. That locks it in your books.</p>}
              {focus && <Link href={uk ? `/app/keep/quarters?q=${focus.id}` : `/app/keep/tax-periods?p=${focus.id}`} className="text-sm font-semibold underline underline-offset-4">Open it in your books</Link>}
            </div>
          </div>
        </div>
      </section>
      <p className="text-xs text-muted">Figures are your books as they are on {longDate(today())}.</p>
    </>
  );
}
