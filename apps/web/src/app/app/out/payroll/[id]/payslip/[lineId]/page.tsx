import { payroll } from "@billingease/contracts";
import { formatMoney, monthLabel } from "@billingease/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { longDate } from "@/components/keep/parts";
import { ButtonLink } from "@/components/ui";
import { PrintButton } from "@/components/out/PrintButton";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Payslip" };

/** A payslip (prototype Payslip). Sri Lanka only: in the UK they come from the payroll software. */
export default async function PayslipPage({ params }: { params: Promise<{ id: string; lineId: string }> }) {
  const { id, lineId } = await params;
  const { business: b } = await requireBusiness();
  const cur = b.currency;
  const m = (n: number) => formatMoney(n, cur);
  if (b.country !== "lk") {
    return (
      <>
        <AppCrumbs area="out" trail={[{ label: "Going out", href: "/app/out" }, { label: "Payroll", href: "/app/out/payroll" }, { label: "Payslip" }]} />
        <section className="flex max-w-[780px] flex-col gap-3 rounded-3xl border border-line bg-white p-8">
          <h1 className="font-display text-[clamp(24px,3vw,30px)] font-bold tracking-[-0.02em]">Payslips come from your payroll software</h1>
          <p className="text-ink2">In the UK, BillingEase keeps your payroll records: each pay run&apos;s figures, the staff costs in your books and what you owe HMRC. Payslips, RTI reports to HMRC and P60s come from the payroll software your accountant uses.</p>
          <div className="flex flex-wrap gap-2.5"><ButtonLink href="/app/out/payroll">Back to payroll records</ButtonLink><ButtonLink href="/app/settings/people" variant="secondary">Your accountant</ButtonLink></div>
        </section>
      </>
    );
  }
  const r = await load(payroll.run, { params: { id } });
  const l = r.lines.find((x) => x.id === lineId);
  if (!l) notFound();
  const name = monthLabel(r.month + "-01");
  const row = (label: string, amount: number, opts: { minus?: boolean; strong?: boolean; sub?: string } = {}) => (
    <div className={`flex items-start justify-between gap-4 py-2.5 ${opts.strong ? "border-t-2 border-ink font-bold" : "border-b border-divider"}`}>
      <span className="flex flex-col"><span>{label}</span>{opts.sub && <span className="text-xs font-normal text-muted">{opts.sub}</span>}</span>
      <span className="tabular-nums">{opts.minus ? "−" : ""}{m(amount)}</span>
    </div>
  );
  return (
    <>
      <div className="print:hidden"><AppCrumbs area="out" trail={[{ label: "Going out", href: "/app/out" }, { label: "Payroll", href: "/app/out/payroll" }, { label: name, href: `/app/out/payroll/${r.id}` }, { label: l.name }]} /></div>
      <article className="mx-auto flex w-full max-w-[720px] flex-col gap-6 rounded-3xl border border-line bg-white p-[clamp(20px,4vw,40px)] print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold">{b.legalName ?? b.name}</span>
            <span className="text-[13px] text-muted">{[b.addressLine1, b.town].filter(Boolean).join(", ")}</span>
          </div>
          <div className="flex flex-col items-end">
            <h1 className="font-display text-2xl font-bold tracking-[-0.02em]">Payslip</h1>
            <span className="text-sm text-ink2">{name} · paid {longDate(r.payDate)}</span>
          </div>
        </header>
        <div className="flex flex-col rounded-2xl bg-bg p-4">
          <span className="font-semibold">{l.name}</span>
          <span className="text-[13px] text-muted">{l.job}</span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <section className="flex flex-col text-sm">
            <h2 className="mb-1 text-xs font-bold uppercase tracking-[0.05em] text-muted">Earnings</h2>
            {row("Basic pay", l.basic)}
            {l.allowances > 0 && row("Allowances", l.allowances)}
            {l.overtime > 0 && row("Overtime", l.overtime, { sub: "Not counted for EPF and ETF" })}
            {row("Gross pay", l.gross, { strong: true })}
          </section>
          <section className="flex flex-col text-sm">
            <h2 className="mb-1 text-xs font-bold uppercase tracking-[0.05em] text-muted">Deductions</h2>
            {row("EPF (employee 8%)", l.epfEe, { minus: true, sub: `On ${m(l.epfBase)}` })}
            {row("APIT", l.apit, { minus: true })}
            {row("Total deductions", l.epfEe + l.apit, { minus: true, strong: true })}
          </section>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-tint px-4 py-4">
          <span className="font-bold">Net pay</span>
          <span className="font-display text-2xl font-bold tabular-nums">{m(l.net)}</span>
        </div>
        <section className="flex flex-col text-sm">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-[0.05em] text-muted">Paid by your employer, on top</h2>
          {row("EPF (employer 12%)", l.epfEr)}
          {row("ETF (3%)", l.etf)}
        </section>
        <p className="text-xs text-muted">Worked out by BillingEase from the rates in use for {name}; your employer pays EPF, ETF and APIT to the funds and the Inland Revenue Department.</p>
      </article>
      <div className="flex justify-center print:hidden"><PrintButton /></div>
    </>
  );
}
