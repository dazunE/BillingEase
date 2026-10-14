import type { Exec } from "@billingease/db";
import { billPayments, bills, expenses, invoices, receipts } from "@billingease/db/schema";
import { and, between, eq, gt, isNull, lt, ne, sql } from "drizzle-orm";

const n = (v: unknown) => Number(v ?? 0);

/**
 * Coming in for a period: money received in it, plus what's still owed on invoices issued in it.
 * Both leave out VAT and SSCL (each payment is split in the invoice's proportions): that money
 * belongs to the tax office, so it isn't yours to keep. Late is the full amount owed and past due,
 * whenever it was issued. See docs/ARCHITECTURE.md.
 */
export async function comingIn(db: Exec, businessId: string, from: string, to: string, today: string) {
  const exTax = (amount: unknown) => sql`round((${amount}) * ${invoices.net}::numeric / nullif(${invoices.total}, 0))`;
  const [r] = await db.select({ sum: sql<string>`coalesce(sum(${exTax(receipts.amount)}), 0)` }).from(receipts)
    .innerJoin(invoices, eq(invoices.id, receipts.invoiceId))
    .where(and(eq(receipts.businessId, businessId), between(receipts.receivedOn, from, to), isNull(receipts.voidedAt)));
  const open = sql`${invoices.total} - ${invoices.paid} - ${invoices.credited}`;
  const live = and(eq(invoices.businessId, businessId), eq(invoices.kind, "invoice"), ne(invoices.status, "draft"), ne(invoices.status, "void"));
  const [o] = await db.select({ sum: sql<string>`coalesce(sum(${exTax(open)}), 0)` }).from(invoices).where(and(live, between(invoices.issueDate, from, to)));
  const [l] = await db.select({ sum: sql<string>`coalesce(sum(${open}), 0)`, count: sql<string>`count(*)` }).from(invoices)
    .where(and(live, lt(invoices.dueDate, today), gt(open, 0)));
  const received = n(r.sum), onTheWay = n(o.sum);
  return { received, onTheWay, total: received + onTheWay, late: n(l.sum), lateCount: n(l.count) };
}

/**
 * Going out for a period: the business share of expenses and the bill payments made in it,
 * plus what's still owed on bills dated in it. VAT you can reclaim is left out (it comes back
 * from the tax office). Due soon is the full amount owed within 7 days, whenever dated.
 */
export async function goingOut(db: Exec, businessId: string, from: string, to: string, today: string) {
  // Business share of each expense, before reclaimable VAT (only VAT-registered businesses record VAT).
  const [e] = await db.select({ sum: sql<string>`coalesce(sum(round((${expenses.gross} - ${expenses.vat}) * ${expenses.bizPct} / 100.0)), 0)` }).from(expenses)
    .where(and(eq(expenses.businessId, businessId), between(expenses.spentOn, from, to)));
  const billExVat = (amount: unknown) => sql`round((${amount}) * ${bills.net}::numeric / nullif(${bills.total}, 0))`;
  const [p] = await db.select({ sum: sql<string>`coalesce(sum(${billExVat(billPayments.amount)}), 0)` }).from(billPayments)
    .innerJoin(bills, eq(bills.id, billPayments.billId))
    .where(and(eq(billPayments.businessId, businessId), between(billPayments.paidOn, from, to), isNull(billPayments.voidedAt)));
  const owed = sql`${bills.total} - ${bills.paid}`;
  const live = and(eq(bills.businessId, businessId), ne(bills.status, "void"), ne(bills.status, "paid"));
  const [o] = await db.select({ sum: sql<string>`coalesce(sum(${billExVat(owed)}), 0)` }).from(bills).where(and(live, between(bills.billDate, from, to)));
  const soon = sql`(${today}::date + 7)`;
  const [d] = await db.select({ sum: sql<string>`coalesce(sum(${owed}), 0)`, count: sql<string>`count(*)` }).from(bills).where(and(live, sql`${bills.dueDate} <= ${soon}`));
  const paid = n(e.sum) + n(p.sum), toPay = n(o.sum);
  return { paid, toPay, total: paid + toPay, dueSoon: n(d.sum), dueSoonCount: n(d.count) };
}
