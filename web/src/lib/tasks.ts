import { and, asc, count, eq, lt, lte, sql } from "drizzle-orm";
import { bankFeeds, bankTransactions, bills, customers, invoiceLines, invoices, payrollRuns, vendors } from "@/db/schema";
import { addDays, daysBetween, formatDate } from "./dates";
import type { Exec } from "./ledger";
import { formatMoney } from "./money";

/**
 * "Needs you": only the things BillingEase can't do without the owner.
 * Each task has one obvious action. Everything else is handled.
 */
export type Task =
  | { kind: "late"; id: string; title: string; body: string; invoiceId: string; tone: "late" }
  | { kind: "sort"; id: string; title: string; body: string; count: number; tone: "due" }
  | { kind: "payroll"; id: string; title: string; body: string; runId: string; tone: "violet" }
  | { kind: "bill"; id: string; title: string; body: string; billId: string; tone: "due" }
  | { kind: "draft"; id: string; title: string; body: string; invoiceId: string; tone: "violet" }
  | { kind: "connect"; id: string; title: string; body: string; tone: "violet" };

export async function needsYou(db: Exec, businessId: string, today: string): Promise<Task[]> {
  const tasks: Task[] = [];

  const late = await db
    .select({
      inv: invoices,
      customer: customers,
      firstLine: sql<string | null>`(select ${invoiceLines.description} from ${invoiceLines} where ${invoiceLines.invoiceId} = ${invoices.id} order by ${invoiceLines.position} limit 1)`,
    })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(eq(invoices.businessId, businessId), eq(invoices.status, "sent"), lt(invoices.dueDate, today)))
    .orderBy(asc(invoices.dueDate))
    .limit(3);
  for (const { inv, customer, firstLine } of late) {
    const days = daysBetween(inv.dueDate, today);
    const open = inv.totalCents - inv.paidCents;
    tasks.push({
      kind: "late",
      id: `late-${inv.id}`,
      invoiceId: inv.id,
      tone: "late",
      title: `${customer.name} is ${days} day${days === 1 ? "" : "s"} late`,
      body:
        `${formatMoney(open)} for ${firstLine ?? inv.number} (${inv.number}). ` +
        (inv.remindersSent > 0 ? `${inv.remindersSent} reminder${inv.remindersSent === 1 ? "" : "s"} sent so far, so a personal note might help.` : "A friendly nudge usually does it."),
    });
  }

  const [toSort] = await db
    .select({ n: count() })
    .from(bankTransactions)
    .where(and(eq(bankTransactions.businessId, businessId), eq(bankTransactions.status, "needs_review")));
  if (toSort.n > 0) {
    const [sorted] = await db
      .select({ n: count() })
      .from(bankTransactions)
      .where(and(eq(bankTransactions.businessId, businessId), eq(bankTransactions.status, "categorized")));
    tasks.push({
      kind: "sort",
      id: "sort",
      count: toSort.n,
      tone: "due",
      title: `${toSort.n} card charge${toSort.n === 1 ? "" : "s"} need${toSort.n === 1 ? "s" : ""} a category`,
      body: sorted.n > 0 ? `We sorted ${sorted.n} on our own. These are new to us, so it takes about 20 seconds.` : "They're new to us, so it takes about 20 seconds.",
    });
  }

  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(and(eq(payrollRuns.businessId, businessId), eq(payrollRuns.status, "pending")))
    .orderBy(asc(payrollRuns.payDate))
    .limit(1);
  if (run) {
    tasks.push({
      kind: "payroll",
      id: `payroll-${run.id}`,
      runId: run.id,
      tone: "violet",
      title: `Approve ${formatDate(run.payDate, { weekday: "long" })}'s payroll · ${formatMoney(run.totalCents)}`,
      body: `${run.people.length} people, paid ${formatDate(run.payDate)} by direct deposit. Payroll taxes are filed for you.`,
    });
  }

  const dueSoon = await db
    .select({ bill: bills, vendor: vendors })
    .from(bills)
    .innerJoin(vendors, eq(bills.vendorId, vendors.id))
    .where(and(eq(bills.businessId, businessId), eq(bills.status, "unpaid"), lte(bills.dueDate, addDays(today, 3))))
    .orderBy(asc(bills.dueDate))
    .limit(2);
  for (const { bill, vendor } of dueSoon) {
    const days = daysBetween(today, bill.dueDate);
    tasks.push({
      kind: "bill",
      id: `bill-${bill.id}`,
      billId: bill.id,
      tone: "due",
      title: `Pay ${vendor.name} · ${formatMoney(bill.amountCents)}`,
      body: days < 0 ? `It was due ${formatDate(bill.dueDate)}.` : days === 0 ? "It's due today." : `It's due ${formatDate(bill.dueDate, { weekday: "long" })}.`,
    });
  }

  const [feeds] = await db.select({ n: count() }).from(bankFeeds).where(eq(bankFeeds.businessId, businessId));
  if (feeds.n === 0) {
    tasks.push({
      kind: "connect",
      id: "connect",
      tone: "violet",
      title: "Connect your bank",
      body: "Transactions flow in every morning and mostly sort themselves. Runs in sandbox mode until a bank provider is set up.",
    });
  }

  return tasks.slice(0, 6);
}
