import type { Metadata } from "next";
import Link from "next/link";
import { EquationStrip } from "@/components/EquationStrip";
import { BillForm } from "@/components/out/BillForm";
import { BillList } from "@/components/out/BillList";
import { ExpenseForm } from "@/components/out/ExpenseForm";
import { niceMerchant } from "@/components/out/format";
import { PayrollCard } from "@/components/out/PayrollCard";
import { Sorter } from "@/components/out/Sorter";
import { ButtonLink, Card, ICONS, Icon } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { addDays, formatDate, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { threeNumbers } from "@/lib/numbers";
import {
  autoSortedCount,
  CATEGORY_KEYWORDS,
  categoryChoices,
  listBills,
  mainCashAccount,
  paidThisPeriod,
  paymentAccounts,
  sortQueue,
  upcomingPayroll,
  vendorNames,
} from "@/lib/ops-out";

export const metadata: Metadata = { title: "Going out" };

function pct(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.max(2, Math.min(98, Math.round((part / whole) * 100)));
}

export default async function GoingOutPage() {
  const { business, db } = await requireBusiness();
  const t = today();
  const n = await threeNumbers(db, business.id, "month", t);
  const [queue, choices, autoSorted, payroll, unpaid, cash, paid, payFrom, vendors] = await Promise.all([
    sortQueue(db, business.id),
    categoryChoices(db, business.id),
    autoSortedCount(db, business.id),
    upcomingPayroll(db, business.id, t),
    listBills(db, business.id, "unpaid"),
    mainCashAccount(db, business.id),
    paidThisPeriod(db, business.id, n.start, t < n.end ? t : n.end),
    paymentAccounts(db, business.id),
    vendorNames(db, business.id),
  ]);
  const expenseOnly = choices.out.filter((c) => !c.code.startsWith("3"));
  const rules: [string, string][] = CATEGORY_KEYWORDS.map(([re, code]) => [re.source, code]);
  const monthName = formatDate(t, { month: "long" });
  const back = "/app/out";

  return (
    <>
      <EquationStrip n={n} current="out" />

      <Card className="flex flex-wrap items-center gap-x-10 gap-y-5 p-6 sm:p-7">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3">
          <h1 className="flex items-center gap-2 font-bold">
            <span className="size-2.5 rounded-full bg-going" aria-hidden />
            Going out this {monthName}
          </h1>
          <span className="font-display text-[clamp(40px,5vw,56px)] font-bold leading-none tracking-[-0.03em] tabular">{formatMoney(n.goingOut, { cents: false })}</span>
          <span className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface" aria-hidden>
            <span className="bg-going" style={{ width: `${pct(n.outPaid, n.goingOut)}%` }} />
            <span className="flex-1 bg-going-light" />
          </span>
          <span className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink2">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-going" aria-hidden />
              <strong className="text-ink">{formatMoney(n.outPaid, { cents: false })}</strong> paid
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-going-light" aria-hidden />
              <strong className="text-ink">{formatMoney(n.outScheduled, { cents: false })}</strong> still to pay
            </span>
          </span>
        </div>
        <div className="flex flex-[1_1_260px] flex-col items-start gap-4">
          <p className="text-[15px] leading-relaxed text-ink2">
            Everything leaving the business this month: what you&apos;ve paid, plus payroll and bills still to come. We sort most of it on our own.
          </p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="#expense">
              <Icon d={ICONS.plus} size={18} />
              Record an expense
            </ButtonLink>
            <ButtonLink href="#bill" variant="secondary">
              Add a bill
            </ButtonLink>
          </div>
        </div>
      </Card>

      <Sorter items={queue} categories={choices} autoSorted={autoSorted} />

      <section aria-labelledby="up-h" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="up-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">
            Coming up
          </h2>
          <span className="text-[13px] text-muted">
            {n.outScheduled > 0 ? `${formatMoney(n.outScheduled, { cents: false })} still to pay before ${formatDate(n.end)}` : `Nothing else due before ${formatDate(n.end)}`}
          </span>
        </div>
        {payroll.map((run, i) => (
          <PayrollCard key={run.id} run={run} fundingAccount={cash.name} back={back} anchor={i === 0} />
        ))}
        <div className="rounded-[20px] border border-line bg-white">
          {unpaid.length > 0 ? (
            <BillList bills={unpaid} today={t} back={back} payFromName={cash.name} />
          ) : (
            <p className="px-5 py-4 text-[15px] text-ink2">No bills waiting. Every bill is paid.</p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider px-4 py-3 text-[13px] text-ink2 sm:px-5">
            <span>Bills are paid from {cash.name} on the day you tap Pay.</span>
            <Link href="/app/bills" className="font-semibold text-ink underline underline-offset-4">
              All bills
            </Link>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <Card id="expense" className="flex min-w-0 flex-[1_1_420px] scroll-mt-24 flex-col gap-4 rounded-[20px] p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Record an expense</h2>
            <p id="exp-sub" className="text-sm text-ink2">
              Cash or card you&apos;ve already spent. We&apos;ll file it for you.
            </p>
          </div>
          <ExpenseForm payFrom={payFrom.map((a) => ({ id: a.id, name: a.name, subtype: a.subtype }))} categories={expenseOnly} rules={rules} today={t} />
        </Card>

        <Card id="bill" className="flex min-w-0 flex-[1_1_420px] scroll-mt-24 flex-col gap-4 rounded-[20px] p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Add a bill</h2>
            <p className="text-sm text-ink2">Something you&apos;ll pay later. It counts as still to pay until it&apos;s paid.</p>
          </div>
          <BillForm vendors={vendors} categories={expenseOnly} today={t} defaultDue={addDays(t, 14)} suggestions={rules} />
        </Card>
      </div>

      <section aria-labelledby="paid-h" className="flex flex-col gap-3">
        <h2 id="paid-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">
          Paid this month <span className="font-semibold text-muted">{paid.rows.length}</span>
        </h2>
        <details className="group rounded-[20px] border border-line bg-white">
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3.5 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pos-bg text-pos">
              <Icon d={ICONS.check} size={18} strokeWidth={2.6} />
            </span>
            <span className="min-w-0 flex-[1_1_220px] text-[15px] text-ink2">
              {paid.rows.length > 0 ? (
                <>
                  <strong className="text-ink">{formatMoney(paid.totalCents)}</strong> across {paid.rows.length} payment{paid.rows.length === 1 ? "" : "s"} since {formatDate(n.start)}, each one
                  filed under a category.
                </>
              ) : (
                <>Nothing has left your accounts yet this month.</>
              )}
            </span>
            {paid.rows.length > 0 && (
              <span className="inline-flex min-h-10 items-center rounded-full bg-ink/[0.07] px-4 text-sm font-semibold">
                <span className="group-open:hidden">Show all</span>
                <span className="hidden group-open:inline">Hide</span>
              </span>
            )}
          </summary>
          {paid.rows.length > 0 && (
            <ul className="flex flex-col border-t border-divider">
              {paid.rows.map((r) => (
                <li key={r.lineId} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-divider px-4 py-3 last:border-b-0 sm:px-5">
                  <div className="flex min-w-0 flex-[1_1_220px] flex-col">
                    <span className="truncate text-[15px] font-semibold">{r.sourceType === "bank" ? niceMerchant(r.who) : r.who}</span>
                    <span className="truncate text-[13px] text-ink2">
                      {r.category} · {r.paidWith}
                    </span>
                  </div>
                  <span className="text-[13px] text-muted">{formatDate(r.date)}</span>
                  <span className="min-w-[80px] text-right font-display text-[15px] font-bold tabular">{formatMoney(r.amountCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </details>
      </section>

      <nav aria-label="More detail" className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2 text-sm text-ink2">
        <span>Need more detail?</span>
        <Link href="/app/transactions" className="font-semibold text-ink underline underline-offset-4">
          All transactions
        </Link>
        <Link href="/app/bills" className="font-semibold text-ink underline underline-offset-4">
          Bills
        </Link>
        <Link href="/app/vendors" className="font-semibold text-ink underline underline-offset-4">
          Vendors
        </Link>
      </nav>
    </>
  );
}
