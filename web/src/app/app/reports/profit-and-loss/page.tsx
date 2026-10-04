import type { Metadata } from "next";
import Link from "next/link";
import { EquationStrip } from "@/components/EquationStrip";
import { Card, ICONS, Icon, cx } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { formatDate, today } from "@/lib/dates";
import { profitAndLoss } from "@/lib/ledger";
import { formatMoney } from "@/lib/money";
import { threeNumbers } from "@/lib/numbers";
import { RANGE_PRESETS, reportRange } from "@/lib/ops-keep";

export const metadata: Metadata = { title: "Profit & Loss" };

const d = (iso: string) => formatDate(iso, { month: "short", day: "numeric", year: "numeric" });

export default async function ProfitAndLossPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { business, db } = await requireBusiness();
  const t = today();
  const r = reportRange(sp, t);
  const [n, cur, prev] = await Promise.all([
    threeNumbers(db, business.id, "month", t),
    profitAndLoss(db, business.id, r.from, r.to),
    profitAndLoss(db, business.id, r.prevFrom, r.prevTo),
  ]);
  const qs = r.preset === "custom" ? `?from=${r.from}&to=${r.to}` : r.preset === "this-month" ? "" : `?range=${r.preset}`;

  // Union of accounts so a line that only appears in one period still shows.
  const merge = (a: typeof cur.income, b: typeof cur.income) => {
    const ids = [...new Set([...a.map((x) => x.accountId), ...b.map((x) => x.accountId)])];
    return ids.map((id) => {
      const x = a.find((l) => l.accountId === id);
      const y = b.find((l) => l.accountId === id);
      return { id, name: (x ?? y)!.name, cur: x?.cents ?? 0, prev: y?.cents ?? 0 };
    });
  };
  const income = merge(cur.income, prev.income);
  const expenses = merge(cur.expenses, prev.expenses).sort((a, b) => b.cur - a.cur);

  return (
    <>
      <EquationStrip n={n} current="keep" />

      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Link href="/app/keep" className="text-sm font-semibold text-ink2 underline underline-offset-4">
            Yours to keep
          </Link>
          <h1 className="font-display text-[clamp(28px,3.4vw,40px)] font-bold leading-tight tracking-[-0.03em]">How much did I make?</h1>
          <p className="text-[15px] text-ink2">
            Profit &amp; Loss for {business.name}, {d(r.from)} – {d(r.to)}. Counted when you bill and when bills arrive (accrual basis).
          </p>
        </div>
        <a
          href={`/app/reports/profit-and-loss/csv${qs}`}
          download
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink/[0.07] px-5 text-[15px] font-semibold text-ink hover:bg-ink/[0.11]"
        >
          <Icon d="M12 4v11M7 10l5 5 5-5M5 20h14" size={18} />
          Download CSV
        </a>
      </section>

      <div className="flex flex-col gap-3">
        <nav aria-label="Report period" className="flex flex-wrap gap-1 self-start rounded-full bg-surface p-1">
          {RANGE_PRESETS.map((p) => (
            <Link
              key={p.key}
              href={p.key === "this-month" ? "/app/reports/profit-and-loss" : `/app/reports/profit-and-loss?range=${p.key}`}
              aria-current={r.preset === p.key ? "page" : undefined}
              className={cx("inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold", r.preset === p.key ? "bg-ink text-white" : "text-ink hover:bg-white")}
            >
              {p.label}
            </Link>
          ))}
        </nav>
        <form className="flex flex-wrap items-end gap-3" action="/app/reports/profit-and-loss">
          <label className="flex flex-col gap-1 text-[13px] font-semibold">
            From
            <input type="date" name="from" required defaultValue={r.from} className="min-h-11 rounded-[10px] border border-input bg-white px-3 text-[15px] font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-semibold">
            To
            <input type="date" name="to" required defaultValue={r.to} className="min-h-11 rounded-[10px] border border-input bg-white px-3 text-[15px] font-normal" />
          </label>
          <button className={cx("inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-semibold", r.preset === "custom" ? "bg-ink text-white" : "bg-ink/[0.07] hover:bg-ink/[0.11]")}>
            Show these dates
          </button>
        </form>
      </div>

      <Card className="overflow-x-auto p-[clamp(16px,2.5vw,28px)]">
        <table className="w-full min-w-[520px] text-left text-[15px] tabular">
          <caption className="sr-only">
            Profit and loss, {d(r.from)} to {d(r.to)}, compared with {d(r.prevFrom)} to {d(r.prevTo)}
          </caption>
          <thead>
            <tr className="border-b border-line text-[13px] text-muted">
              <th scope="col" className="py-2 font-semibold">
                <span className="sr-only">Account</span>
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                {d(r.from)} – {d(r.to)}
              </th>
              <th scope="col" className="py-2 pl-4 text-right font-semibold">
                Previous period
                <span className="block font-normal">
                  {d(r.prevFrom)} – {d(r.prevTo)}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <Heading>Income</Heading>
            {income.map((l) => (
              <Line key={l.id} name={l.name} cur={l.cur} prev={l.prev} />
            ))}
            {income.length === 0 && <Empty>No income in this period</Empty>}
            <Total label="Total income" cur={cur.totalIncome} prev={prev.totalIncome} />
            <Heading>Expenses</Heading>
            {expenses.map((l) => (
              <Line key={l.id} name={l.name} cur={l.cur} prev={l.prev} />
            ))}
            {expenses.length === 0 && <Empty>No expenses in this period</Empty>}
            <Total label="Total expenses" cur={cur.totalExpenses} prev={prev.totalExpenses} />
          </tbody>
          <tfoot>
            <tr className="bg-tint">
              <th scope="row" className="rounded-l-xl px-3 py-3.5 font-display text-lg font-bold">
                {cur.netProfit >= 0 ? "Net profit" : "Net loss"}
              </th>
              <td className="py-3.5 text-right font-display text-lg font-bold">{formatMoney(cur.netProfit)}</td>
              <td className="rounded-r-xl py-3.5 pl-4 pr-3 text-right font-semibold text-ink2">{formatMoney(prev.netProfit)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>
      <p className="flex items-center gap-2 text-[13px] text-muted">
        <Icon d={ICONS.check} size={16} />
        Straight from your ledger. <Link href="/app/ledger" className="font-semibold text-ink underline underline-offset-4">See every entry</Link>
      </p>
    </>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <tr>
      <th scope="rowgroup" colSpan={3} className="pb-1 pt-5 text-[13px] font-bold uppercase tracking-[0.04em] text-muted">
        {children}
      </th>
    </tr>
  );
}

function Line({ name, cur, prev }: { name: string; cur: number; prev: number }) {
  return (
    <tr className="border-b border-divider">
      <th scope="row" className="py-2.5 font-normal">
        {name}
      </th>
      <td className="py-2.5 text-right">{formatMoney(cur)}</td>
      <td className="py-2.5 pl-4 text-right text-ink2">{formatMoney(prev)}</td>
    </tr>
  );
}

function Total({ label, cur, prev }: { label: string; cur: number; prev: number }) {
  return (
    <tr className="border-b border-line">
      <th scope="row" className="py-2.5 font-bold">
        {label}
      </th>
      <td className="py-2.5 text-right font-bold">{formatMoney(cur)}</td>
      <td className="py-2.5 pl-4 text-right font-semibold text-ink2">{formatMoney(prev)}</td>
    </tr>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b border-divider">
      <td colSpan={3} className="py-2.5 text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}
