import { books } from "@billingease/contracts";
import { rulesFor } from "@billingease/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { Checks, Hero, Lines, longDate, Panel, PeriodCards, pence, range, shortDate, signed, StatePill } from "@/components/keep/parts";
import { LockForm } from "@/components/keep/LockForm";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Quarters" };

/** Making Tax Digital quarters (prototype Quarters): each quarter's figures, what's left to check, and marking it sent. */
export default async function QuartersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { business: b } = await requireBusiness();
  if (!rulesFor(b.country).features.mtdQuarters) notFound();
  const { q } = await searchParams;
  const r = await load(books.quarters);
  const cur = b.currency;
  const practitioner = rulesFor(b.country).wording.practitionerNoun;
  // The one to look at: asked for, else the latest still to send, else this quarter.
  const chosen = r.quarters.find((x) => x.id === q) ?? [...r.quarters].reverse().find((x) => x.state === "closed") ?? r.quarters.find((x) => x.id === r.current) ?? r.quarters[0];
  const left = chosen.checks.filter((c) => !c.ok).length;
  const short = (label: string) => label.split(" ")[0];

  const words = {
    sent: <>{short(chosen.label)} was marked as sent{chosen.lock?.lockedBy ? ` by ${chosen.lock.lockedBy}` : ""} on {longDate(chosen.lock?.lockedAt.slice(0, 10) ?? chosen.to)}. Its figures are locked.</>,
    closed: <>{short(chosen.label)} has closed. {left ? `Clear the ${left === 1 ? "check" : `${left} checks`} below, then` : "Everything is ready:"} send it to your {practitioner}, who files it with HMRC by {longDate(chosen.due)}.</>,
    open: <>{short(chosen.label)} is under way. It closes on {longDate(chosen.to)}; the update is due {longDate(chosen.due)}.</>,
    upcoming: <>{short(chosen.label)} starts on {longDate(chosen.from)}.</>,
  }[chosen.state];

  const rows = chosen.categories.map((c) => ({
    key: c.code, name: c.name, sub: c.official ?? undefined, amount: signed(-c.amount, cur),
    tag: c.code === "6990" ? { text: "Needs a category", tone: "late" as const } : c.allowable === false ? { text: "Not allowable", tone: "neutral" as const } : undefined,
    tone: c.code === "6990" ? "late" as const : undefined,
    href: c.code === "6990" ? "/app/out?sort=1" : undefined,
  }));
  const allowable = chosen.categories.filter((c) => c.allowable !== false).reduce((a, c) => a + c.amount, 0);
  const notCounted = chosen.categories.filter((c) => c.allowable === false).reduce((a, c) => a + c.amount, 0);

  return (
    <>
      <AppCrumbs area="keep" trail={[{ label: "Yours to keep", href: "/app/keep" }, { label: "Quarters" }]} />

      <Hero
        eyebrow={`Making Tax Digital · ${r.taxYear.label} · ${short(chosen.label)}`}
        big={range(chosen.from, chosen.to)}
        chips={<><StatePill state={chosen.state === "closed" && chosen.daysToDue < 0 ? "late" : chosen.state} label={chosen.state === "closed" && chosen.daysToDue >= 0 && left ? "To check" : undefined} /><span>HMRC deadline {longDate(chosen.due)}{chosen.daysToDue >= 0 && chosen.state !== "sent" ? ` · ${chosen.daysToDue} days` : ""}</span></>}
        tiles={chosen.state === "upcoming" ? [] : [
          { label: "Income", value: pence(chosen.income, cur) },
          { label: "Expenses", value: pence(chosen.expenses, cur) },
          { label: "Profit", value: signed(chosen.profit, cur), accent: true },
        ]}
      >
        {words}
      </Hero>

      <PeriodCards items={r.quarters.map((x) => ({
        id: x.id, title: short(x.label), sub: range(x.from, x.to), on: x.id === chosen.id, href: `/app/keep/quarters?q=${x.id}`, state: x.state === "closed" && x.daysToDue < 0 ? "late" : x.state,
        stateLabel: x.state === "closed" && x.daysToDue >= 0 && x.checks.some((c) => !c.ok) ? "To check" : undefined,
        note: x.state === "sent" ? `Sent ${shortDate((x.lock?.lockedAt ?? x.to).slice(0, 10))}` : x.state === "upcoming" ? `Starts ${shortDate(x.from)} · due ${longDate(x.due)}` : x.state === "open" ? `Under way · due ${longDate(x.due)}` : `Due ${longDate(x.due)}`,
      }))} />

      {chosen.state !== "upcoming" && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Panel id="ready-h" title={`Ready for your ${practitioner}?`} aside={<span className="text-[13px] text-muted">{chosen.checks.length - left} of {chosen.checks.length} done</span>}>
            <Checks items={chosen.checks} />
          </Panel>
          <Panel id="send-h" title={chosen.state === "sent" ? "Sent" : `Send ${short(chosen.label)}`} aside={<StatePill state={chosen.state} />}>
            {chosen.state === "sent" ? (
              <p className="text-sm text-ink2">Marked as sent{chosen.lock?.lockedBy ? ` by ${chosen.lock.lockedBy}` : ""}{chosen.lock?.reference ? `, reference ${chosen.lock.reference}` : ""}. Nothing more can be recorded between {longDate(chosen.from)} and {longDate(chosen.to)}.</p>
            ) : chosen.state === "open" ? (
              <p className="text-sm text-ink2">You can send {short(chosen.label)} once it closes on {longDate(chosen.to)}. Keep recording as you go; the checks update as you do.</p>
            ) : (
              <>
                <p className="text-sm text-ink2">Your {practitioner} sends {short(chosen.label)}&apos;s totals by HMRC category with their Making Tax Digital software. Once it&apos;s sent, mark it here so nothing in it changes by mistake. BillingEase doesn&apos;t file with HMRC itself.</p>
                {left > 0 && <p className="rounded-2xl bg-due-bg p-3.5 text-sm text-due">{left === 1 ? "1 check is" : `${left} checks are`} still open. Clear {left === 1 ? "it" : "them"} first if you can.</p>}
                {b.role === "admin" ? <p className="text-sm text-muted">The owner or your {practitioner} marks it as sent.</p> : (
                  <LockForm from={chosen.from} to={chosen.to} label={chosen.label} button={`Mark ${short(chosen.label)} as sent`} referenceHint="HMRC's submission receipt, if you have it" />
                )}
              </>
            )}
          </Panel>
        </div>
      )}

      {chosen.state !== "upcoming" && (
        <Panel id="cats-h" title={`${short(chosen.label)} by HMRC category`} aside={<span className="text-[13px] text-muted">{range(chosen.from, chosen.to)} · from your books</span>}>
          <Lines
            rows={rows}
            empty="Nothing recorded in this quarter yet."
            total={{ label: "Allowable expenses", sub: "Counted against your profit", amount: signed(-allowable, cur) }}
          />
          {notCounted > 0 && <p className="text-[13px] text-ink2">{pence(notCounted, cur)} isn&apos;t counted against profit (entertaining and equipment; your {practitioner} claims capital allowances on equipment).</p>}
          <p className="text-xs text-muted">Costs are by the date each expense was paid or each bill is dated. Income and expenses at the top are as on Home: money received or still owed on invoices and bills from the quarter, without VAT.</p>
        </Panel>
      )}
    </>
  );
}
