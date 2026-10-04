import type { Metadata } from "next";
import Link from "next/link";
import { EquationStrip } from "@/components/EquationStrip";
import { Badge, Card, cx } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { formatDate, today } from "@/lib/dates";
import { listAccounts, trialBalance } from "@/lib/ledger";
import { formatMoney } from "@/lib/money";
import { threeNumbers } from "@/lib/numbers";
import { ledgerPage } from "@/lib/ops-keep";

export const metadata: Metadata = { title: "Ledger" };

const SOURCES: Record<string, string> = {
  invoice: "Invoice",
  payment: "Payment",
  bill: "Bill",
  bill_payment: "Bill paid",
  expense: "Expense",
  bank: "Bank",
  payroll: "Payroll",
  transfer: "Transfer",
  opening: "Opening balance",
};

export default async function LedgerPage({ searchParams }: { searchParams: Promise<{ page?: string; account?: string }> }) {
  const sp = await searchParams;
  const { business, db } = await requireBusiness();
  const accounts = await listAccounts(db, business.id);
  // Only accept an account that belongs to this business.
  const account = accounts.find((a) => a.id === sp.account) ?? null;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const [n, tb, data] = await Promise.all([
    threeNumbers(db, business.id, "month", today()),
    trialBalance(db, business.id),
    ledgerPage(db, business.id, { page, accountId: account?.id ?? null, pageSize: 25 }),
  ]);
  const balanced = tb.debit === tb.credit;
  const href = (p: number) => {
    const q = new URLSearchParams();
    if (account) q.set("account", account.id);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return `/app/ledger${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <EquationStrip n={n} current="keep" />

      <section className="flex flex-col gap-1.5">
        <Link href="/app/keep" className="self-start text-sm font-semibold text-ink2 underline underline-offset-4">
          Yours to keep
        </Link>
        <h1 className="font-display text-[clamp(28px,3.4vw,40px)] font-bold leading-tight tracking-[-0.03em]">Every entry</h1>
        <p className="text-[15px] text-ink2">The ledger behind your three numbers. Every entry&apos;s debits equal its credits.</p>
      </section>

      <div
        className={cx("flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-3 text-sm", balanced ? "bg-pos-bg text-pos" : "bg-late-bg text-late")}
        role="status"
      >
        <Badge tone={balanced ? "pos" : "late"} className="bg-white/70">
          {balanced ? "Balanced ✓" : "Out of balance"}
        </Badge>
        <span className="tabular">
          Trial balance: debits <strong>{formatMoney(tb.debit)}</strong> · credits <strong>{formatMoney(tb.credit)}</strong>
        </span>
      </div>

      <form action="/app/ledger" className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-[0_1_340px] flex-col gap-1 text-[13px] font-semibold">
          Account
          <select name="account" defaultValue={account?.id ?? ""} className="min-h-11 rounded-[10px] border border-input bg-white px-3 text-[15px] font-normal">
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.name}
              </option>
            ))}
          </select>
        </label>
        <button className="inline-flex min-h-11 items-center rounded-full bg-ink/[0.07] px-5 text-[15px] font-semibold hover:bg-ink/[0.11]">Filter</button>
        {account && (
          <Link href="/app/ledger" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
            Show all
          </Link>
        )}
        <span className="ml-auto text-[13px] text-muted">
          {data.total} entr{data.total === 1 ? "y" : "ies"}
          {account ? ` touching ${account.name}` : ""}
        </span>
      </form>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm tabular">
          <caption className="sr-only">Journal entries, newest first</caption>
          <thead>
            <tr className="border-b border-line text-[13px] text-muted">
              <th scope="col" className="px-5 py-3 font-semibold">Date</th>
              <th scope="col" className="py-3 font-semibold">Entry</th>
              <th scope="col" className="py-3 font-semibold">Account</th>
              <th scope="col" className="py-3 text-right font-semibold">Debit</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">Credit</th>
            </tr>
          </thead>
          {data.entries.map((e) => (
            <tbody key={e.id} className="border-b border-line last:border-0">
              {e.lines.map((l, i) => (
                <tr key={`${l.accountId}-${i}`} className={cx(account && l.accountId === account.id && "bg-tint/60")}>
                  {i === 0 && (
                    <>
                      <td rowSpan={e.lines.length} className="whitespace-nowrap px-5 py-2.5 align-top font-semibold">
                        {formatDate(e.entryDate, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td rowSpan={e.lines.length} className="max-w-[260px] py-2.5 pr-4 align-top">
                        <span className="block font-semibold">{e.memo}</span>
                        <span className="text-xs text-muted">{SOURCES[e.sourceType] ?? e.sourceType}</span>
                      </td>
                    </>
                  )}
                  <td className={cx("py-2.5 pr-4", l.credit > 0 && "pl-5")}>
                    <Link href={`/app/ledger?account=${l.accountId}`} className="hover:underline">
                      {l.accountName}
                    </Link>
                  </td>
                  <td className="py-2.5 text-right">{l.debit > 0 ? formatMoney(l.debit) : ""}</td>
                  <td className="px-5 py-2.5 text-right">{l.credit > 0 ? formatMoney(l.credit) : ""}</td>
                </tr>
              ))}
            </tbody>
          ))}
          {data.entries.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted">
                  No entries {account ? "for this account" : "yet"}. As you bill, pay and connect your bank, entries appear here.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </Card>

      {data.pages > 1 && (
        <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
          {page > 1 ? (
            <Link href={href(page - 1)} rel="prev" className="inline-flex min-h-11 items-center rounded-full bg-ink/[0.07] px-5 font-semibold hover:bg-ink/[0.11]">
              Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {Math.min(page, data.pages)} of {data.pages}
          </span>
          {page < data.pages ? (
            <Link href={href(page + 1)} rel="next" className="inline-flex min-h-11 items-center rounded-full bg-ink/[0.07] px-5 font-semibold hover:bg-ink/[0.11]">
              Older
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
