import { and, eq, gte, inArray, lt, lte, ne, notInArray, sql } from "drizzle-orm";
import { accounts, bills, businesses, invoices, journalEntries, journalLines, payrollRuns } from "@/db/schema";
import { endOfMonth, endOfQuarter, endOfYear, startOfMonth, startOfQuarter, startOfYear, today as todayIso } from "./dates";
import type { Exec } from "./ledger";
import { shareOf } from "./money";

export type Period = "month" | "quarter" | "year";

export function periodRange(period: Period, today = todayIso()) {
  if (period === "quarter") return { start: startOfQuarter(today), end: endOfQuarter(today) };
  if (period === "year") return { start: startOfYear(today), end: endOfYear(today) };
  return { start: startOfMonth(today), end: endOfMonth(today) };
}

export type ThreeNumbers = {
  period: Period;
  start: string;
  end: string;
  today: string;
  /** Money that landed in your bank/card accounts this period. */
  inReceived: number;
  /** Open invoice balances due between today and the end of the period. */
  inExpected: number;
  /** Open invoice balances already past due (shown separately, not counted). */
  late: number;
  lateCount: number;
  /** Money that left your bank/card accounts this period. */
  outPaid: number;
  /** Unpaid bills due by the end of the period, plus payroll still to run. */
  outScheduled: number;
  comingIn: number;
  goingOut: number;
  profit: number;
  taxRateBps: number;
  taxSetAside: number;
  yoursToKeep: number;
};

// Moving money between your own accounts isn't coming in or going out.
const NOT_FLOW = ["transfer", "opening"];

/**
 * Coming in − Going out = Yours to keep.
 *
 * "Received" and "paid" come from the ledger: debits and credits on cash and
 * card accounts. "Expected" and "still to pay" come from open invoices, unpaid
 * bills and payroll that hasn't run yet. A share of profit (the business's tax
 * rate) is set aside for tax; the rest is yours to keep.
 */
export async function threeNumbers(db: Exec, businessId: string, period: Period = "month", today = todayIso()): Promise<ThreeNumbers> {
  const { start, end } = periodRange(period, today);

  const [biz] = await db.select({ taxRateBps: businesses.taxRateBps }).from(businesses).where(eq(businesses.id, businessId));

  const [flow] = await db
    .select({
      debit: sql<string>`coalesce(sum(${journalLines.debitCents}), 0)`,
      credit: sql<string>`coalesce(sum(${journalLines.creditCents}), 0)`,
    })
    .from(journalLines)
    .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
    .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
    .where(
      and(
        eq(journalLines.businessId, businessId),
        inArray(accounts.subtype, ["cash", "card"]),
        notInArray(journalEntries.sourceType, NOT_FLOW),
        gte(journalEntries.entryDate, start),
        lte(journalEntries.entryDate, today < end ? today : end),
      ),
    );

  const openBalance = sql<string>`coalesce(sum(${invoices.totalCents} - ${invoices.paidCents}), 0)`;
  const [expected] = await db
    .select({ cents: openBalance })
    .from(invoices)
    .where(and(eq(invoices.businessId, businessId), eq(invoices.status, "sent"), gte(invoices.dueDate, today), lte(invoices.dueDate, end)));
  const [late] = await db
    .select({ cents: openBalance, count: sql<string>`count(*)` })
    .from(invoices)
    .where(and(eq(invoices.businessId, businessId), eq(invoices.status, "sent"), lt(invoices.dueDate, today)));

  const [billsDue] = await db
    .select({ cents: sql<string>`coalesce(sum(${bills.amountCents}), 0)` })
    .from(bills)
    .where(and(eq(bills.businessId, businessId), eq(bills.status, "unpaid"), lte(bills.dueDate, end)));
  const [payrollDue] = await db
    .select({ cents: sql<string>`coalesce(sum(${payrollRuns.totalCents}), 0)` })
    .from(payrollRuns)
    .where(and(eq(payrollRuns.businessId, businessId), ne(payrollRuns.status, "paid"), sql`${payrollRuns.payDate} > ${today}`, lte(payrollRuns.payDate, end)));

  const inReceived = Number(flow?.debit ?? 0);
  const outPaid = Number(flow?.credit ?? 0);
  const inExpected = Number(expected?.cents ?? 0);
  const outScheduled = Number(billsDue?.cents ?? 0) + Number(payrollDue?.cents ?? 0);
  const comingIn = inReceived + inExpected;
  const goingOut = outPaid + outScheduled;
  const profit = comingIn - goingOut;
  const taxRateBps = biz?.taxRateBps ?? 2500;
  const taxSetAside = profit > 0 ? shareOf(profit, taxRateBps) : 0;

  return {
    period,
    start,
    end,
    today,
    inReceived,
    inExpected,
    late: Number(late?.cents ?? 0),
    lateCount: Number(late?.count ?? 0),
    outPaid,
    outScheduled,
    comingIn,
    goingOut,
    profit,
    taxRateBps,
    taxSetAside,
    yoursToKeep: profit - taxSetAside,
  };
}
