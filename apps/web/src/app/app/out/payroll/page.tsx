import { payroll, type PayRunDetail } from "@billingease/contracts";
import { formatMoney, monthLabel, rulesFor, today } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { longDate, Panel, shortDate } from "@/components/keep/parts";
import { EmployeeForm, PayDue, RunForm, type RunPerson } from "@/components/out/PayrollForms";
import { ButtonLink, cx, Icon, ICONS } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Payroll" };

const whole = (m: number, c: "GBP" | "LKR" | "USD") => formatMoney(m, c, { decimals: "never" });
const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

/** Payroll (prototype SpendPayroll): this month's run, what's still to pay, the people and past runs. */
export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ add?: string }> }) {
  const { business: b } = await requireBusiness();
  const { add } = await searchParams;
  const o = await load(payroll.overview);
  const lk = o.mode === "full";
  const cur = b.currency;
  const t = today();
  const practitioner = rulesFor(b.country).wording.practitionerNoun;
  const canApprove = b.role !== "admin";
  const active = o.employees.filter((e) => !e.endedOn || e.endedOn >= `${o.next.month}-01`);

  // The run to work on: a draft if there is one, else next month's, started from the people on payroll.
  const draftRun = o.runs.find((r) => r.status === "draft");
  const draft: PayRunDetail | null = draftRun ? await load(payroll.run, { params: { id: draftRun.id } }) : null;
  const last = o.runs.find((r) => r.status === "approved");
  const lastDetail: PayRunDetail | null = !lk && last ? await load(payroll.run, { params: { id: last.id } }) : null;
  const month = draft?.month ?? o.next.month;
  const people: RunPerson[] = (draft ? o.employees.filter((e) => active.includes(e) || draft.lines.some((l) => l.employeeId === e.id)) : active).map((e) => {
    const line = draft?.lines.find((l) => l.employeeId === e.id) ?? lastDetail?.lines.find((l) => l.employeeId === e.id);
    return {
      employee: e, on: draft ? draft.lines.some((l) => l.employeeId === e.id) : true,
      values: lk ? { overtime: draft?.lines.find((l) => l.employeeId === e.id)?.overtime ?? 0 }
        : { gross: line?.gross ?? 0, paye: line?.paye ?? 0, eeNi: line?.eeNi ?? 0, erNi: line?.erNi ?? 0, pensionEe: line?.pensionEe ?? 0, pensionEr: line?.pensionEr ?? 0 },
    };
  });

  const nextDue = o.open.filter((d) => d.kind !== "net").sort((a, c) => a.dueOn.localeCompare(c.dueOn))[0] ?? o.open[0];
  const runLabel = `${monthLabel(month + "-01")} ${lk ? "payroll" : "pay run"}`;

  return (
    <>
      <AppCrumbs area="out" trail={[{ label: "Going out", href: "/app/out" }, { label: "Payroll" }]} />

      <section className="grid items-center gap-5 rounded-3xl border border-line bg-white p-[clamp(20px,3vw,32px)] md:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="flex min-w-0 flex-col gap-2">
          {nextDue ? (
            <>
              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold"><span className="size-2 rounded-full bg-going" />{nextDue.label} · {shortDate(nextDue.dueOn)}
                <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-bold", nextDue.daysToDue < 0 ? "bg-late-bg text-late" : "bg-due-bg text-due")}>{nextDue.daysToDue < 0 ? `${-nextDue.daysToDue} days late` : nextDue.daysToDue === 0 ? "Due today" : `Due in ${nextDue.daysToDue} days`}</span>
              </span>
              <span className="font-display text-[clamp(38px,6vw,56px)] font-bold leading-none tracking-[-0.03em] tabular-nums">{formatMoney(nextDue.amount, cur)}</span>
              <span className="text-[13px] text-muted">To {nextDue.payTo}{o.open.length > 1 ? ` · ${o.open.length - 1} more to pay below` : ""}</span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-2 text-sm font-semibold"><span className="size-2 rounded-full bg-going" />{runLabel} · {draft ? "draft" : "not started"}</span>
              <span className="font-display text-[clamp(38px,6vw,56px)] font-bold leading-none tracking-[-0.03em] tabular-nums">{draft ? whole(draft.net, cur) : `${active.length} ${active.length === 1 ? "person" : "people"}`}</span>
              <span className="text-[13px] text-muted">{draft ? `Net pay for ${draft.people} ${draft.people === 1 ? "person" : "people"} · pay day ${longDate(draft.payDate)}` : `On payroll for ${monthLabel(month + "-01")}`}</span>
            </>
          )}
        </div>
        <p className="text-sm text-ink2">{lk
          ? "BillingEase works out earnings, EPF, ETF, APIT and net pay. Check and approve: that posts salaries and what you owe to your books. You pay and file through the EPF, ETF and IRD channels."
          : "Your payroll software runs payroll and reports to HMRC. Enter each pay run's figures here so your books match, then mark HMRC and the pension provider paid when you pay them."}</p>
      </section>

      <p className="flex items-start gap-2.5 rounded-2xl bg-info-bg px-4 py-3 text-sm text-info">
        <Icon d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8h.01M11 12h1v4h1" size={18} className="mt-px shrink-0" />
        <span><strong>{lk ? "Payroll calculation." : "Records only."}</strong> {lk ? "BillingEase calculates payroll. Pay EPF, ETF and APIT and file returns through the EPF, ETF and IRD channels." : "BillingEase keeps your payroll records. Run payroll and report to HMRC (RTI) through your payroll software."}{!o.verified && " Rates are illustrative until checked against official guidance."}</span>
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel id="run-h" title={runLabel} aside={<span className="rounded-full bg-due-bg px-2.5 py-0.5 text-xs font-bold text-due">{draft ? "Draft" : "Not started"}</span>}
            sub={o.next.exists && !draft ? `${monthLabel(o.next.month + "-01")} is already run.` : `Pay period ${monthLabel(month + "-01")} · pay day ${longDate(draft?.payDate ?? o.next.payDate)}`}>
            {o.employees.length === 0 ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-ink2">Add the people you pay first. {lk ? "Their basic pay and allowances are used to work out each month." : "Then enter each month's figures from your payroll software."}</p>
                <ButtonLink href="/app/out/payroll?add=1#person"><Icon d={ICONS.plus} size={18} strokeWidth={2.4} />Add a person</ButtonLink>
              </div>
            ) : (
              <RunForm key={draft?.id ?? month} mode={o.mode} currency={cur} id={draft?.id} month={month} label={lk ? "Usually the last working day" : "As in your payroll software"} payDate={draft?.payDate ?? o.next.payDate} people={people} canApprove={canApprove} />
            )}
          </Panel>

          <section aria-labelledby="people-h" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="people-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">People on payroll <span className="text-muted">{active.length}</span></h2>
              <Link href="/app/out/payroll?add=1#person" className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ink/[0.07] px-4 text-sm font-semibold hover:bg-ink/[0.11]"><Icon d={ICONS.plus} size={16} />Add a person</Link>
            </div>
            {o.employees.length > 0 && (
              <ul className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white">
                {o.employees.map((e) => (
                  <li key={e.id} className="border-b border-divider last:border-0">
                    <Link href={`/app/out/payroll/people/${e.id}`} className="flex flex-wrap items-center gap-3 px-5 py-4 no-underline hover:bg-bg">
                      <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tint text-sm font-bold">{initials(e.name)}</span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-semibold">{e.name}{e.endedOn ? <span className="ml-2 rounded-full bg-surface px-2 py-px text-[11px] font-bold text-ink2">Left {shortDate(e.endedOn)}</span> : null}</span>
                        <span className="truncate text-[13px] text-muted">{[e.job, e.startedOn ? `since ${longDate(e.startedOn)}` : null, lk ? (e.epfNumber ? `EPF no ${e.epfNumber}` : null) : e.taxCode ? `Tax code ${e.taxCode}` : null, !lk && e.pension ? "in the workplace pension" : null].filter(Boolean).join(" · ")}</span>
                      </span>
                      {lk && <span className="flex flex-col items-end text-sm"><span className="font-semibold tabular-nums">{whole(e.basic, cur)} basic{e.allowances.length ? ` + ${whole(e.allowances.reduce((a, x) => a + x.amount, 0), cur)}` : ""}</span><span className="text-xs text-muted">{e.allowances.map((a) => a.name.toLowerCase()).join(", ") || "No fixed allowances"}</span></span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {(add || o.employees.length === 0) && (
              <div id="person" className="scroll-mt-6 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]">
                <h3 className="mb-4 font-display text-lg font-bold">Add a person</h3>
                <EmployeeForm mode={o.mode} currency={cur} />
              </div>
            )}
          </section>

          <section aria-labelledby="past-h" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="past-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">Past runs</h2>
              {o.yearToDate.gross > 0 && <span className="text-[13px] text-muted">{whole(o.yearToDate.net, cur)} net pay this {lk ? "year of assessment" : "tax year"}</span>}
            </div>
            {o.runs.filter((r) => r.status === "approved").length === 0 ? <p className="text-sm text-muted">No approved runs yet.</p> : (
              <ul className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white">
                {o.runs.filter((r) => r.status === "approved").map((r) => (
                  <li key={r.id} className="border-b border-divider last:border-0">
                    <Link href={`/app/out/payroll/${r.id}`} className="flex items-center gap-3 px-5 py-4 no-underline hover:bg-bg">
                      <span aria-hidden className={cx("flex size-8 shrink-0 items-center justify-center rounded-full", r.settled ? "bg-pos-bg text-pos" : "bg-due-bg text-due")}><Icon d={r.settled ? ICONS.check : ICONS.clock} size={16} /></span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-semibold">{monthLabel(r.month + "-01")}</span>
                        <span className="text-[13px] text-muted">{r.people} {r.people === 1 ? "person" : "people"} · paid {shortDate(r.payDate)} · {r.settled ? "everything paid" : "some still to pay"}</span>
                      </span>
                      <span className="font-display font-bold tabular-nums">{whole(r.net, cur)}</span>
                      <span className="rounded-full bg-ink/[0.07] px-3 py-1.5 text-[13px] font-semibold">{lk ? "Payslips" : "Details"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Panel id="pay-h" title={lk ? "To pay and file" : "PAYE and pension"} sub={lk ? "APIT by the 15th of the next month; EPF and ETF by the last working day of the next month." : "PAYE and NI reach HMRC by the 22nd of the month after each tax month."}>
            {o.open.length === 0 ? <p className="text-sm text-muted">Nothing to pay right now.</p> : (
              <ul className="flex flex-col gap-2.5">
                {o.open.map((d) => (
                  <li key={d.id} className="flex flex-col gap-2 rounded-2xl border border-line p-3.5">
                    <span className="flex items-start justify-between gap-2"><span className="text-sm font-semibold">{d.label}</span><span className="font-semibold tabular-nums">{formatMoney(d.amount, cur)}</span></span>
                    <span className="text-xs text-muted">{d.payTo}</span>
                    <span className={cx("self-start rounded-full px-2.5 py-0.5 text-xs font-bold", d.daysToDue < 0 ? "bg-late-bg text-late" : "bg-due-bg text-due")}>Due {shortDate(d.dueOn)} · {d.daysToDue < 0 ? `${-d.daysToDue} days late` : `in ${d.daysToDue} days`}</span>
                    <PayDue id={d.id} today={t} />
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted">Marking paid records the payment in your books. {lk ? "Pay through the EPF, ETF and IRD channels; BillingEase doesn't file." : "It doesn't pay or report anything to HMRC."}</p>
          </Panel>

          {lk && (
            <Panel id="ytd-h" title="Year-end totals" sub={`Year of assessment ${o.yearToDate.label} so far (approved runs)`}>
              {o.yearToDate.byPerson.length === 0 ? <p className="text-sm text-muted">Totals build up as you approve runs.</p> : (
                <ul className="flex flex-col text-sm">
                  {o.yearToDate.byPerson.map((p) => (
                    <li key={p.employeeId} className="flex items-start justify-between gap-2 border-b border-divider py-2.5 last:border-0">
                      <span className="flex flex-col"><span className="font-semibold">{p.name}</span><span className="text-xs text-muted">{whole(p.gross, cur)} gross</span></span>
                      <span className="text-right"><span className="block font-semibold tabular-nums">{whole(p.tax, cur)}</span><span className="text-xs text-muted">APIT</span></span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted">After 31 March these totals, with employer certificates for each person, go to your {practitioner}.</p>
            </Panel>
          )}

          <Panel id="count-h" title="How payroll counts in Going out" className="border-going-light bg-going-tint">
            <p className="text-sm text-ink2">{lk ? "Approving a run counts its whole cost, gross pay plus EPF 12% and ETF 3%, in the month of the run: paid when you pay each part, still to pay until then." : "Net pay and what you owe HMRC and the pension provider count as still to pay until you mark them paid; then they move to paid. The total doesn't change."} It goes under “{lk ? "Salaries and wages" : "Staff costs"}” in your books.</p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
