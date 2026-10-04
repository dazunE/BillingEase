import type { Metadata } from "next";
import Link from "next/link";
import { CashJar } from "@/components/CashJar";
import { EquationStrip } from "@/components/EquationStrip";
import { Card, ICONS, Icon, cx } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { formatDate, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { threeNumbers } from "@/lib/numbers";
import { monthlyKeepSeries, safeToSpend, taxEstimate } from "@/lib/ops-keep";
import { setTaxRateAction } from "./actions";
import { KeepChart } from "./KeepChart";

export const metadata: Metadata = { title: "Yours to keep" };

const RATES = [1500, 2000, 2500, 3000, 3500];
const m = (c: number) => formatMoney(c, { cents: false });
const pctOf = (rate: number) => `${rate / 100}%`;

export default async function KeepPage() {
  const { business, db } = await requireBusiness();
  const t = today();
  const [n, trend, safe, est] = await Promise.all([
    threeNumbers(db, business.id, "month", t),
    monthlyKeepSeries(db, business.id, t, 6),
    safeToSpend(db, business.id, t),
    taxEstimate(db, business.id, t),
  ]);
  const monthYear = formatDate(t, { month: "long", year: "numeric" });
  const monthName = formatDate(t, { month: "long" });
  const rate = pctOf(n.taxRateBps);
  const keepPct = n.profit > 0 ? Math.round((n.yoursToKeep / n.profit) * 100) : 0;

  // The math as a waterfall, scaled to the larger of coming in / going out.
  const scale = Math.max(n.comingIn, n.goingOut, 1);
  const w = (c: number) => Math.round((Math.max(0, c) / scale) * 1000) / 10;
  const steps = [
    { sign: "+", signBg: "bg-tint", label: "Coming in", sub: "Paid to you or on the way this month", amount: m(n.comingIn), left: 0, width: w(n.comingIn), color: "bg-coming", row: "bg-white" },
    { sign: "−", signBg: "bg-going-tint", label: "Going out", sub: "Spending, bills and payroll, paid or still to pay", amount: "−" + m(n.goingOut), left: n.profit >= 0 ? w(n.profit) : 0, width: w(n.goingOut), color: "bg-going", row: "bg-white" },
    { sign: "=", signBg: "bg-surface", label: n.profit >= 0 ? "Profit" : "Loss", sub: n.profit >= 0 ? `What ${business.name} earned this month` : "Going out is more than coming in this month", amount: m(n.profit), left: n.profit >= 0 ? 0 : w(n.comingIn), width: w(Math.abs(n.profit)), color: n.profit >= 0 ? "bg-ink2" : "bg-late", row: "bg-bg" },
    { sign: "−", signBg: "bg-surface", label: `Set aside for tax (${rate})`, sub: n.taxSetAside > 0 ? "Kept for your next tax payment, so it isn’t a surprise" : "Nothing to set aside without a profit", amount: "−" + m(n.taxSetAside), left: w(n.yoursToKeep), width: w(n.taxSetAside), color: "bg-coming-light", row: "bg-white" },
    { sign: "=", signBg: "bg-violet", label: "Yours to keep", sub: "Pay yourself, save it or reinvest it", amount: m(n.yoursToKeep), left: 0, width: w(n.yoursToKeep), color: "bg-ink", row: "bg-tint" },
  ];

  return (
    <>
      <EquationStrip n={n} current="keep" />

      <section aria-labelledby="keep-h" className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 rounded-3xl bg-ink p-[clamp(22px,3vw,36px)] text-white">
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-2.5">
          <h1 id="keep-h" className="flex items-center gap-2 text-[15px] font-bold text-tint">
            <span className="size-2.5 rounded-full bg-violet" aria-hidden />
            Yours to keep · {monthYear}
          </h1>
          <span className="font-display text-[clamp(48px,7vw,76px)] font-bold leading-none tracking-[-0.03em] text-violet tabular">{m(n.yoursToKeep)}</span>
          <p className="max-w-[560px] text-base leading-normal text-tint">
            {n.yoursToKeep >= 0 ? (
              <>
                That&apos;s what&apos;s left after every bill, every paycheck and <strong className="text-white">{m(n.taxSetAside)}</strong> set aside for tax. Pay yourself, save it, or put it back into
                the business.
              </>
            ) : (
              <>More is going out than coming in this month, so nothing is set aside for tax. The steps below show where it&apos;s coming from.</>
            )}
          </p>
        </div>
        {n.profit > 0 && (
          <div className="flex min-w-0 flex-[0_1_320px] flex-col gap-2.5">
            <span className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-tint/15" aria-hidden>
              <span className="bg-violet" style={{ width: `${keepPct}%` }} />
              <span className="bg-tint/45" style={{ width: `${100 - keepPct}%` }} />
            </span>
            <span className="flex justify-between gap-3 text-[13px] text-tint">
              <span>
                <strong className="text-white">{keepPct}%</strong> of profit is yours
              </span>
              <span>
                <strong className="text-white">{rate}</strong> for tax
              </span>
            </span>
          </div>
        )}
      </section>

      <Card className="flex flex-col gap-4 p-[clamp(18px,2.5vw,28px)]">
        <section aria-labelledby="math-h" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
            <h2 id="math-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">
              How we got to {m(n.yoursToKeep)}
            </h2>
            <span className="text-[13px] text-muted">
              {formatDate(n.start, { month: "long", day: "numeric" })} – {formatDate(n.end, { day: "numeric" })} · includes money on the way and bills still to pay
            </span>
          </div>
          <ol className="flex flex-col gap-2.5">
            {steps.map((s) => (
              <li key={s.label} className={cx("flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl px-3.5 py-3", s.row)}>
                <div className="flex min-w-0 max-w-[320px] flex-[1_1_260px] items-center gap-3">
                  <span aria-hidden className={cx("flex size-[30px] flex-none items-center justify-center rounded-full font-display text-[17px] font-bold", s.signBg)}>
                    {s.sign}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[15px] font-bold">{s.label}</span>
                    <span className="text-[13px] leading-snug text-muted">{s.sub}</span>
                  </span>
                </div>
                <div className="flex min-w-0 flex-[999_1_280px] items-center gap-3.5">
                  <div className="relative h-7 min-w-0 flex-1 rounded-lg bg-bg" aria-hidden>
                    <div className={cx("absolute inset-y-0 rounded-lg", s.color)} style={{ left: `${s.left}%`, width: `${s.width}%` }} />
                  </div>
                  <span className="w-[104px] flex-none text-right font-display text-lg font-bold tracking-[-0.02em] tabular">{s.amount}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </Card>

      <div className="flex flex-wrap items-stretch gap-6">
        <Card className="flex min-w-0 flex-[3_1_420px] flex-col gap-4 p-[clamp(18px,2.5vw,28px)]">
          <section aria-labelledby="tax-h" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="tax-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">
                Tax set-aside
              </h2>
              <form action={setTaxRateAction} className="flex flex-wrap items-center gap-2.5">
                <span id="rate-l" className="text-[13px] font-semibold text-ink2">
                  Share of profit
                </span>
                <div role="group" aria-labelledby="rate-l" className="flex flex-wrap gap-1 rounded-full bg-surface p-1">
                  {RATES.map((r) => {
                    const on = n.taxRateBps === r;
                    return (
                      <button
                        key={r}
                        name="bps"
                        value={r}
                        aria-pressed={on}
                        className={cx("min-h-10 min-w-[52px] rounded-full px-3 text-sm font-semibold", on ? "bg-ink text-white" : "text-ink hover:bg-white")}
                      >
                        {pctOf(r)}
                      </button>
                    );
                  })}
                </div>
              </form>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-1 rounded-[18px] bg-tint px-[18px] py-4">
                <span className="text-[13px] font-semibold text-ink2">Set aside this month</span>
                <span className="font-display text-[30px] font-bold tracking-[-0.03em] tabular">{m(n.taxSetAside)}</span>
                <span className="text-[13px] text-ink2">
                  {rate} of {m(Math.max(0, n.profit))} profit
                </span>
              </div>
              <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-1 rounded-[18px] border border-line bg-bg px-[18px] py-4">
                <span className="text-[13px] font-semibold text-ink2">Next estimated tax payment</span>
                <span className="font-display text-[30px] font-bold tracking-[-0.03em] tabular">{m(est.estimate)}</span>
                <span className="text-[13px] text-ink2">due {formatDate(est.dueDate, { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
            <p className="text-[13px] leading-normal text-ink2">
              The estimate is {rate} of the {m(Math.max(0, est.quarterProfit))} profit since {formatDate(est.quarterStart, { month: "long", day: "numeric" })} (money in minus money out). It grows as the
              quarter goes on.
            </p>
            <div className="flex flex-col gap-1.5 border-t border-line pt-4">
              <h3 className="text-[15px] font-bold">Why we do this</h3>
              <p className="text-sm leading-relaxed text-ink2">
                When you work for yourself, nobody takes tax out of your pay. The IRS expects it in four payments a year instead. Setting aside a share of each month&apos;s profit means the
                money is already waiting when a payment is due. 25% is a common starting point; your accountant can tell you if yours should be higher or lower.
              </p>
            </div>
          </section>
        </Card>

        <Card className="flex min-w-0 flex-[2_1_320px] flex-col gap-4 p-[clamp(18px,2.5vw,28px)]">
          <section aria-labelledby="safe-h" className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="safe-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">
                Safe to spend today
              </h2>
              <span className="text-sm leading-snug text-ink2">The cash you can use without touching money that&apos;s already spoken for.</span>
            </div>
            <dl className="flex flex-col">
              <SafeRow label="Cash in the bank" note={safe.cashAccounts.map((a) => a.name).join(", ") || "Your bank and cash accounts"} value={m(safe.cash)} />
              <SafeRow
                label="− Card balances owed"
                note={safe.cardAccounts.length ? `What you owe on ${safe.cardAccounts.map((a) => a.name).join(", ")}` : "Nothing owed on cards"}
                value={"−" + m(safe.cardsOwed)}
              />
              <SafeRow
                label="− Bills still to pay"
                note={safe.unpaidBillCount ? `${safe.unpaidBillCount} unpaid bill${safe.unpaidBillCount === 1 ? "" : "s"}, whenever they're due` : "No unpaid bills"}
                value={"−" + m(safe.unpaidBills)}
              />
              <SafeRow label={`− Tax set aside for ${monthName}`} note={`${pctOf(safe.taxRateBps)} of this month's profit`} value={"−" + m(safe.taxSetAside)} />
            </dl>
            <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-[18px] bg-ink px-[18px] py-4 text-white">
              <span className="text-[15px] font-bold text-tint">= Safe to spend</span>
              <span className="font-display text-[30px] font-bold tracking-[-0.03em] text-violet tabular">{m(safe.safe)}</span>
            </div>
          </section>
        </Card>
      </div>

      <div className="flex flex-wrap items-stretch gap-6">
        <Card className="flex min-w-0 flex-[3_1_440px] flex-col gap-4 p-[clamp(18px,2.5vw,28px)]">
          <section aria-labelledby="trend-h" className="flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
              <h2 id="trend-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">
                Yours to keep, month by month
              </h2>
              <span className="text-[13px] text-muted">
                {trend.series[0].label} – {trend.series.at(-2)?.label} average <strong className="text-ink">{m(trend.average)}</strong>
              </span>
            </div>
            <KeepChart series={trend.series} year={t.slice(0, 4)} />
            <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-2xl bg-bg px-4 py-3.5">
              <span className="text-sm text-ink2">Kept in {t.slice(0, 4)} so far, after tax</span>
              <span className="font-display text-[22px] font-bold tracking-[-0.02em] tabular">{m(trend.ytd)}</span>
            </div>
          </section>
        </Card>

        <Card className="flex min-w-0 flex-[2_1_340px] flex-col gap-3.5 p-[clamp(18px,2.5vw,28px)]">
          <section aria-labelledby="acct-h" className="flex flex-1 flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <h2 id="acct-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">
                Ready for your accountant
              </h2>
              <span className="text-sm leading-snug text-ink2">Your books are kept as you go. Ask a question, get the report.</span>
            </div>
            <div className="flex flex-col gap-2">
              <ReportLink href="/app/reports/profit-and-loss" q="How much did I make?" name="Profit & Loss" />
              <ReportLink href="/app/reports/balance-sheet" q="What do I own and owe?" name="Balance sheet" />
              <ReportLink href="/app/ledger" q="Every entry" name="Ledger" />
            </div>
            <div className="mt-auto flex justify-center pt-2">
              <CashJar size={260} amount={m(n.yoursToKeep)} taxPct={rate} />
            </div>
          </section>
        </Card>
      </div>
    </>
  );
}

function SafeRow({ label, note, value }: { label: string; note: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-divider py-3">
      <dt className="text-sm">
        {label}
        <br />
        <span className="text-xs text-muted">{note}</span>
      </dt>
      <dd className="whitespace-nowrap font-bold tabular">{value}</dd>
    </div>
  );
}

function ReportLink({ href, q, name }: { href: string; q: string; name: string }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 rounded-2xl bg-bg px-3.5 py-2 hover:bg-surface">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-bold">{q}</span>
        <span className="text-xs text-muted">{name}</span>
      </span>
      <Icon d={ICONS.arrowRight} size={18} />
    </Link>
  );
}
