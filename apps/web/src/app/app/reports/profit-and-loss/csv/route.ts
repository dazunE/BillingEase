import type { NextRequest } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { today } from "@/lib/dates";
import { profitAndLoss } from "@/lib/ledger";
import { reportRange } from "@/lib/ops-keep";

const cell = (v: string | number) => {
  const s = String(v);
  // Quote everything; neutralise spreadsheet formulas in text cells.
  const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? "'" + s : s;
  return `"${safe.replace(/"/g, '""')}"`;
};
const dollars = (cents: number) => (cents / 100).toFixed(2);

/** Profit & Loss as CSV for the signed-in business, same ?range / ?from&to as the page. */
export async function GET(request: NextRequest) {
  const { business, db } = await requireBusiness();
  const sp = request.nextUrl.searchParams;
  const r = reportRange({ range: sp.get("range") ?? undefined, from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined }, today());
  const [cur, prev] = await Promise.all([profitAndLoss(db, business.id, r.from, r.to), profitAndLoss(db, business.id, r.prevFrom, r.prevTo)]);

  const rows: (string | number)[][] = [
    [`Profit & Loss: ${business.name}`],
    ["Section", "Account", `${r.from} to ${r.to}`, `${r.prevFrom} to ${r.prevTo}`],
  ];
  const section = (name: string, a: typeof cur.income, b: typeof cur.income, total: [number, number]) => {
    const ids = [...new Set([...a.map((x) => x.accountId), ...b.map((x) => x.accountId)])];
    for (const id of ids) {
      const x = a.find((l) => l.accountId === id);
      const y = b.find((l) => l.accountId === id);
      rows.push([name, (x ?? y)!.name, dollars(x?.cents ?? 0), dollars(y?.cents ?? 0)]);
    }
    rows.push([name, `Total ${name.toLowerCase()}`, dollars(total[0]), dollars(total[1])]);
  };
  section("Income", cur.income, prev.income, [cur.totalIncome, prev.totalIncome]);
  section("Expenses", cur.expenses, prev.expenses, [cur.totalExpenses, prev.totalExpenses]);
  rows.push(["Net profit", "", dollars(cur.netProfit), dollars(prev.netProfit)]);

  const body = rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
  const slug = business.name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "business";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-profit-and-loss-${r.from}-to-${r.to}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
