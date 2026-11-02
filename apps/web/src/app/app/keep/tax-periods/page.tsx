import { books } from "@billingease/contracts";
import { formatMoney, rulesFor } from "@billingease/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { Checks, Hero, longDate, Panel, PeriodCards, pence, range, shortDate, signed, StatePill } from "@/components/keep/parts";
import { LockForm } from "@/components/keep/LockForm";
import { ButtonLink, cx } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Tax periods" };

/** VAT (and SSCL in Sri Lanka), period by period (prototype TaxPeriods): the return's figures and marking it filed. */
export default async function TaxPeriodsPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { business: b } = await requireBusiness();
  if (b.country === "us") notFound();
  const { p } = await searchParams;
  const lk = b.country === "lk";
  const rules = rulesFor(b.country);
  const practitioner = rules.wording.practitionerNoun;
  const cur = b.currency;
  const registered = b.vatRegistered || (lk && b.ssclRegistered);

  if (!registered) {
    return (
      <>
        <AppCrumbs area="keep" trail={[{ label: "Yours to keep", href: "/app/keep" }, { label: lk ? "VAT and SSCL" : "VAT" }]} />
        <Hero eyebrow={lk ? "VAT and SSCL" : "VAT"} big="Not registered">
          {b.name} isn&apos;t registered for {lk ? "VAT or SSCL" : "VAT"}, so there are no returns to send. You must register once your turnover passes {formatMoney(rules.vatThreshold, cur, { decimals: "never" })} a year{lk ? " (to confirm with IRD)" : ""}. When you do, add your number to your business profile and your periods show here.
        </Hero>
        <ButtonLink href="/app/settings/business" className="self-start">Open business profile</ButtonLink>
      </>
    );
  }

  const r = await load(books.taxPeriods);
  const chosen = r.periods.find((x) => x.id === p) ?? [...r.periods].reverse().find((x) => x.state === "closed") ?? r.periods.find((x) => x.id === r.current) ?? r.periods[0];
  const toPay = (r.vat ? chosen.vatPayable : 0) + (r.sscl ? chosen.sscl : 0);
  const title = lk ? (r.vat && r.sscl ? "VAT and SSCL" : r.vat ? "VAT" : "SSCL") : "VAT";
  const name = (label: string) => (lk ? label.split(" ")[0] : label);
  const left = chosen.checks.filter((c) => !c.ok).length;

  // The return, line by line (the IRD layout is still to confirm).
  const boxes: { n: string; label: string; sub?: string; amount: number; strong?: boolean }[] = [];
  if (r.vat) {
    boxes.push(
      { n: "1", label: "Sales before VAT", sub: lk && rules.ssclInVatBase ? "On tax invoices issued in the period" : "On invoices issued in the period", amount: chosen.sales },
      { n: "2", label: "Output VAT", sub: "VAT on your sales", amount: chosen.outputVat },
      { n: "3", label: "Input VAT", sub: "VAT on costs you can claim back", amount: -chosen.inputVat },
      { n: "4", label: chosen.vatPayable >= 0 ? "VAT to pay" : "VAT to reclaim", sub: "Box 2 − box 3", amount: chosen.vatPayable, strong: true },
    );
  }
  if (lk && r.sscl) {
    boxes.push(
      { n: "S1", label: "Liable turnover for SSCL", sub: "Sales before VAT and SSCL", amount: chosen.sales },
      { n: "S2", label: `SSCL at ${rules.ssclBps / 100}%`, sub: "No input credit for SSCL", amount: chosen.sscl, strong: true },
    );
  }

  return (
    <>
      <AppCrumbs area="keep" trail={[{ label: "Yours to keep", href: "/app/keep" }, { label: lk ? "VAT and SSCL" : "VAT summary" }]} />

      <Hero
        eyebrow={`${title} · ${chosen.label}`}
        big={signed(toPay, cur)}
        chips={<><StatePill state={chosen.state === "closed" && chosen.daysToDue < 0 ? "late" : chosen.state} label={chosen.state === "closed" && chosen.daysToDue >= 0 ? (left ? "To check" : "Ready to file") : undefined} /><span>Return due {longDate(chosen.due)}{chosen.state !== "sent" && chosen.daysToDue >= 0 ? ` · ${chosen.daysToDue} days` : ""}</span></>}
        tiles={chosen.state === "upcoming" ? [] : [
          ...(r.vat ? [{ label: "Output VAT", value: pence(chosen.outputVat, cur) }, { label: "Input VAT", value: signed(-chosen.inputVat, cur) }] : []),
          ...(lk && r.sscl ? [{ label: "SSCL", value: pence(chosen.sscl, cur) }] : []),
          { label: "To pay", value: signed(toPay, cur), accent: true },
        ]}
      >
        {chosen.state === "sent" ? <>{name(chosen.label)} was filed. Its figures are locked.</>
          : chosen.state === "open" ? <>{name(chosen.label)} is under way, so these are the figures so far. It closes {longDate(chosen.to)}.</>
          : chosen.state === "upcoming" ? <>{name(chosen.label)} hasn&apos;t started yet.</>
          : <>{name(chosen.label)} has closed. {r.vat ? `VAT ${chosen.vatPayable >= 0 ? "payable" : "to reclaim"} ${pence(Math.abs(chosen.vatPayable), cur)}` : ""}{r.vat && lk && r.sscl ? " and " : ""}{lk && r.sscl ? `SSCL ${pence(chosen.sscl, cur)}` : ""}, for your {practitioner} to enter by {longDate(chosen.due)}.</>}
      </Hero>

      <PeriodCards items={r.periods.filter((x) => x.state !== "upcoming" || x.id === chosen.id).map((x) => {
        const pay = (r.vat ? x.vatPayable : 0) + (r.sscl ? x.sscl : 0);
        return {
          id: x.id, title: name(x.label), on: x.id === chosen.id, href: `/app/keep/tax-periods?p=${x.id}`, state: x.state === "closed" && x.daysToDue < 0 ? "late" : x.state,
          stateLabel: x.state === "closed" && x.daysToDue >= 0 ? `Due ${shortDate(x.due)}` : undefined,
          sub: x.state === "open" ? `So far ${signed(pay, cur)} to pay` : `${signed(pay, cur)} to pay`,
          note: x.state === "sent" ? `Filed ${shortDate((x.lock?.lockedAt ?? x.to).slice(0, 10))}` : x.state === "open" ? `Closes ${shortDate(x.to)} · due ${shortDate(x.due)}` : `Return due ${longDate(x.due)}`,
        };
      }).reverse()} />

      {chosen.state !== "upcoming" && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Panel id="lines-h" title="The return, line by line" aside={lk ? <span className="rounded-full bg-due-bg px-2.5 py-0.5 text-xs font-bold text-due">Layout to confirm with IRD</span> : undefined}
            sub={lk ? `How SSCL sits in the VAT base is to confirm with IRD. BillingEase doesn't connect to RAMIS: you or your ${practitioner} enter these figures.` : `For your ${practitioner} to send with their Making Tax Digital software. Figures are from invoices issued and costs recorded in ${range(chosen.from, chosen.to)}.`}>
            <ul className="flex flex-col">
              {boxes.map((x) => (
                <li key={x.n} className={cx("flex items-center gap-3 py-3", x.strong ? "my-1 rounded-xl bg-tint px-3" : "border-b border-divider")}>
                  <span className={cx("flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-xs font-bold", x.strong ? "bg-ink text-white" : "bg-surface")}>{x.n}</span>
                  <span className="flex min-w-0 flex-1 flex-col"><span className={cx("text-[14.5px]", x.strong && "font-bold")}>{x.label}</span>{x.sub && <span className="text-xs text-muted">{x.sub}</span>}</span>
                  <span className={cx("tabular-nums", x.strong ? "font-display text-lg font-bold" : "font-semibold")}>{signed(x.amount, cur)}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel id="file-h" title={chosen.state === "sent" ? "Filed" : "File it"} aside={<StatePill state={chosen.state} label={chosen.state === "closed" ? (left ? "To check" : "Ready to file") : undefined} />}>
            {chosen.state === "sent" ? (
              <p className="text-sm text-ink2">Marked as filed{chosen.lock?.lockedBy ? ` by ${chosen.lock.lockedBy}` : ""}{chosen.lock?.reference ? `, reference ${chosen.lock.reference}` : ""}. Nothing more can be recorded in {name(chosen.label)}.</p>
            ) : chosen.state === "open" ? (
              <p className="text-sm text-ink2">File once {name(chosen.label)} closes on {longDate(chosen.to)}. Payment is due by {longDate(chosen.due)}.</p>
            ) : (
              <>
                <p className="text-sm text-ink2">Your {practitioner} enters these figures on the return and you pay {lk ? "the IRD" : "HMRC"} {pence(Math.max(0, toPay), cur)} by {longDate(chosen.due)}. Once it&apos;s filed, mark it here: that locks the period so nothing in it changes by mistake.</p>
                <Checks items={chosen.checks} />
                {b.role === "admin" ? <p className="text-sm text-muted">The owner or your {practitioner} marks it as filed.</p> : (
                  <LockForm from={chosen.from} to={chosen.to} label={`The ${name(chosen.label)} return`} button={`Mark ${name(chosen.label)} filed`} referenceHint={lk ? "The IRD acknowledgement, if you have it" : "HMRC's submission receipt, if you have it"} />
                )}
              </>
            )}
            <p className="text-xs text-muted">{lk ? "Payment goes to the IRD (VAT and SSCL) by the 20th of the following month (to confirm)." : "Most businesses' VAT quarters end in March, June, September and December; returns are due one month and seven days after. If HMRC gave you different months, your accountant uses those."} Figures come from your invoices and the VAT on costs you record.</p>
          </Panel>
        </div>
      )}
    </>
  );
}
