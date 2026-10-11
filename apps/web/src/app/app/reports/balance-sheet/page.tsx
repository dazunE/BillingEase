import type { Metadata } from "next";
import Link from "next/link";
import { EquationStrip } from "@/components/EquationStrip";
import { Badge, Card } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { formatDate, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { threeNumbers } from "@/lib/numbers";
import { balanceSheet, type SheetLine } from "@/lib/ops-keep";

export const metadata: Metadata = { title: "Balance sheet" };

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function BalanceSheetPage({ searchParams }: { searchParams: Promise<{ asOf?: string }> }) {
  const { asOf: raw } = await searchParams;
  const { business, db } = await requireBusiness();
  const t = today();
  const asOf = raw && ISO.test(raw) && !Number.isNaN(new Date(raw + "T12:00:00").getTime()) ? raw : t;
  const [n, sheet] = await Promise.all([threeNumbers(db, business.id, "month", t), balanceSheet(db, business.id, asOf)]);
  const long = formatDate(asOf, { month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      <EquationStrip n={n} current="keep" />

      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Link href="/app/keep" className="text-sm font-semibold text-ink2 underline underline-offset-4">
            Yours to keep
          </Link>
          <h1 className="font-display text-[clamp(28px,3.4vw,40px)] font-bold leading-tight tracking-[-0.03em]">What do I own and owe?</h1>
          <p className="text-[15px] text-ink2">
            Balance sheet for {business.name} as of {long}.
          </p>
        </div>
        <form action="/app/reports/balance-sheet" className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[13px] font-semibold">
            As of
            <input type="date" name="asOf" required defaultValue={asOf} className="min-h-11 rounded-[10px] border border-input bg-white px-3 text-[15px] font-normal" />
          </label>
          <button className="inline-flex min-h-11 items-center rounded-full bg-ink/[0.07] px-5 text-[15px] font-semibold hover:bg-ink/[0.11]">Show</button>
        </form>
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <Card className="flex min-w-0 flex-[1_1_380px] flex-col gap-2 p-[clamp(16px,2.5vw,28px)]">
          <Group title="What you own" sub="Assets" lines={sheet.assets} total={sheet.totalAssets} totalLabel="Total assets" />
        </Card>
        <Card className="flex min-w-0 flex-[1_1_380px] flex-col gap-6 p-[clamp(16px,2.5vw,28px)]">
          <Group title="What you owe" sub="Liabilities" lines={sheet.liabilities} total={sheet.totalLiabilities} totalLabel="Total liabilities" />
          <Group title="What's yours" sub="Equity" lines={sheet.equity} total={sheet.totalEquity} totalLabel="Total equity" />
          <div className="flex items-baseline justify-between gap-3 rounded-xl bg-tint px-3 py-3">
            <span className="font-bold">Liabilities + equity</span>
            <span className="font-display text-lg font-bold tabular">{formatMoney(sheet.totalLiabilities + sheet.totalEquity)}</span>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-ink2">
        {sheet.balanced ? (
          <Badge tone="pos">Balanced ✓</Badge>
        ) : (
          <Badge tone="late">Out of balance by {formatMoney(Math.abs(sheet.totalAssets - sheet.totalLiabilities - sheet.totalEquity))}</Badge>
        )}
        <span>
          What you own ({formatMoney(sheet.totalAssets)}) equals what you owe plus what&apos;s yours. Retained earnings is all profit to date, {formatMoney(sheet.retainedEarnings)}.
        </span>
      </div>
    </>
  );
}

function Group({ title, sub, lines, total, totalLabel }: { title: string; sub: string; lines: SheetLine[]; total: number; totalLabel: string }) {
  return (
    <section className="flex flex-col">
      <h2 className="flex items-baseline gap-2 font-display text-xl font-bold tracking-[-0.02em]">
        {title} <span className="font-sans text-[13px] font-semibold text-muted">{sub}</span>
      </h2>
      <dl className="mt-2 flex flex-col">
        {lines.map((l) => (
          <div key={l.accountId ?? l.name} className="flex justify-between gap-3 border-b border-divider py-2.5 text-[15px]">
            <dt className="min-w-0">
              {l.accountId ? (
                <Link href={`/app/ledger?account=${l.accountId}`} className="hover:underline">
                  {l.name}
                </Link>
              ) : (
                l.name
              )}
            </dt>
            <dd className="whitespace-nowrap tabular">{formatMoney(l.cents)}</dd>
          </div>
        ))}
        {lines.length === 0 && <div className="border-b border-divider py-2.5 text-sm text-muted">Nothing here yet</div>}
        <div className="flex justify-between gap-3 py-2.5 font-bold">
          <dt>{totalLabel}</dt>
          <dd className="tabular">{formatMoney(total)}</dd>
        </div>
      </dl>
    </section>
  );
}
