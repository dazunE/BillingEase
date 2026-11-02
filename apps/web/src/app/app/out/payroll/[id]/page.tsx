import { payroll } from "@billingease/contracts";
import { formatMoney, monthLabel, rulesFor, today } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { Hero, longDate, Panel, shortDate } from "@/components/keep/parts";
import { PayDue, UkCheck } from "@/components/out/PayrollForms";
import { RunSchedulesView } from "@/components/out/PayrollTables";
import { cx } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Pay run" };

/** One approved (or draft) run: everyone's figures, what it owes, and payslips in Sri Lanka. */
export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business: b } = await requireBusiness();
  const r = await load(payroll.run, { params: { id } });
  const lk = b.country === "lk";
  const cur = b.currency;
  const m = (n: number) => formatMoney(n, cur);
  const name = monthLabel(r.month + "-01");
  const schedules = lk && r.status === "approved" ? await load(payroll.schedules, { params: { id } }) : null;
  // UK: each person's tax code and pension, to check their line against.
  const people = lk ? [] : (await load(payroll.overview)).employees;
  const cols = lk
    ? [["gross", "Earnings"], ["epfEe", "EPF 8%"], ["apit", "APIT"], ["net", "Net pay"], ["epfEr", "EPF 12%"], ["etf", "ETF 3%"]] as const
    : [["gross", "Gross"], ["paye", "PAYE"], ["eeNi", "Employee NI"], ["pensionEe", "Pension"], ["net", "Net pay"], ["erNi", "Employer NI"], ["pensionEr", "Employer pension"]] as const;

  return (
    <>
      <AppCrumbs area="out" trail={[{ label: "Going out", href: "/app/out" }, { label: "Payroll", href: "/app/out/payroll" }, { label: name }]} />
      <Hero
        eyebrow={`${name} ${lk ? "payroll" : "pay run"} · ${r.status === "approved" ? `approved${r.approvedBy ? ` by ${r.approvedBy}` : ""}` : "draft"}`}
        big={formatMoney(r.net, cur, { decimals: "never" })}
        tiles={[
          { label: "Gross pay", value: formatMoney(r.gross, cur, { decimals: "never" }) },
          { label: lk ? "EPF 12% and ETF 3%" : "Employer NI and pension", value: formatMoney(r.employer, cur, { decimals: "never" }) },
          { label: "Cost to the business", value: formatMoney(r.cost, cur, { decimals: "never" }), accent: true },
        ]}
      >
        Net pay for {r.people} {r.people === 1 ? "person" : "people"}, paid {longDate(r.payDate)}.{r.settled ? " Everything it owes is paid." : ""}
      </Hero>

      <Panel id="lines-h" title="Everyone on the run">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="py-2 pr-3 font-semibold">Name</th>
                {cols.map(([, l]) => <th key={l} scope="col" className="py-2 pr-3 text-right font-semibold">{l}</th>)}
                {lk && <th scope="col" className="py-2 font-semibold"><span className="sr-only">Payslip</span></th>}
              </tr>
            </thead>
            <tbody>
              {r.lines.map((l) => (
                <tr key={l.id} className="border-b border-divider">
                  <th scope="row" className="py-3 pr-3 font-semibold">{l.name}<span className="block text-xs font-normal text-muted">{l.job}</span></th>
                  {cols.map(([k]) => <td key={k} className={cx("py-3 pr-3 text-right tabular-nums", k === "net" && "font-bold")}>{m(l[k])}</td>)}
                  {lk && <td className="py-3"><Link href={`/app/out/payroll/${r.id}/payslip/${l.id}`} className="font-semibold underline underline-offset-4">Payslip</Link></td>}
                </tr>
              ))}
              <tr className="border-t-2 border-ink font-bold">
                <th scope="row" className="py-3 pr-3">Total</th>
                {cols.map(([k]) => <td key={k} className="py-3 pr-3 text-right tabular-nums">{m(r[k])}</td>)}
                {lk && <td />}
              </tr>
            </tbody>
          </table>
        </div>
        {!lk && <p className="text-xs text-muted">Payslips, RTI reports to HMRC and P60s come from your payroll software.</p>}
      </Panel>

      {schedules && (
        <Panel id="sch-h" title="Schedules to pay and file yourself" sub="BillingEase doesn't file these. Use them for the EPF and ETF returns, your APIT payment and the bank's salary upload.">
          <RunSchedulesView data={schedules} />
        </Panel>
      )}

      {!lk && r.lines.length > 0 && (
        <UkCheck contact={`your ${rulesFor(b.country).wording.practitionerNoun}`} against={r.lines.map((l) => {
          const e = people.find((p) => p.id === l.employeeId);
          return { key: l.id, label: `${l.name}, ${name}`, gross: l.gross, paye: l.paye, eeNi: l.eeNi, erNi: l.erNi, pensionEe: l.pensionEe, pensionEr: l.pensionEr, net: l.net, taxCode: e?.taxCode ?? null, pension: e?.pension ?? l.pensionEe > 0 };
        })} />
      )}

      {r.dues.length > 0 && (
        <Panel id="dues-h" title="What it owes">
          <ul className="flex flex-col">
            {r.dues.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 border-b border-divider py-3 last:border-0">
                <span className="flex min-w-0 flex-1 flex-col"><span className="font-semibold">{d.label}</span><span className="text-xs text-muted">{d.payTo} · due {longDate(d.dueOn)}</span></span>
                <span className="font-semibold tabular-nums">{m(d.amount)}</span>
                {d.paidOn ? <span className="rounded-full bg-pos-bg px-2.5 py-0.5 text-xs font-bold text-pos">Paid {shortDate(d.paidOn)}</span> : <PayDue id={d.id} today={today()} />}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
