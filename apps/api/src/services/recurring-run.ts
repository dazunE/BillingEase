import type { Recurring } from "@billingease/contracts";
import { addDays, addMonths, computeInvoice, formatDate, monthEnd, today } from "@billingease/core";
import type { Db, Exec } from "@billingease/db";
import { businesses, customers, recurringInvoices, type RecurringTemplate } from "@billingease/db/schema";
import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import type { BusinessRow } from "../lib/context";
import { logActivity, notify } from "../lib/activity";
import type { Services } from "./index";
import { invoiceLink, issueDraft, taxContext, writeDraft } from "./invoice-core";
import { rateFor } from "./doc-currency";

export type RecurringDb = typeof recurringInvoices.$inferSelect;
type Frequency = RecurringDb["frequency"];

/** The next run. Monthly, quarterly and yearly keep to the bill day where the month has it. */
export function advance(date: string, f: Frequency, billDay?: number): string {
  if (f === "weekly") return addDays(date, 7);
  const next = addMonths(date, f === "monthly" ? 1 : f === "quarterly" ? 3 : 12);
  if (!billDay) return next;
  const last = Number(monthEnd(next).slice(8, 10));
  return next.slice(0, 8) + String(Math.min(billDay, last)).padStart(2, "0");
}

export function upcoming(r: { nextRun: string; frequency: Frequency; endDate: string | null; template?: { billDay?: number } }, n = 3) {
  const out: string[] = [];
  let d = r.nextRun;
  while (out.length < n && (!r.endDate || d <= r.endDate)) {
    out.push(d);
    d = advance(d, r.frequency, r.template?.billDay);
  }
  return out;
}

export function recurringOut(b: BusinessRow, r: RecurringDb, customerName: string, invoiceCount: number): Recurring {
  const t = r.template;
  const lines = t.lines.map((l) => ({ itemId: l.itemId ?? null, description: l.description, quantityMilli: l.quantityMilli, unitPrice: l.unitPrice, discount: l.discount ?? 0, vatRateId: l.vatRateId ?? null, sscl: l.sscl !== false }));
  let totals = { net: 0, vat: 0, sscl: 0, total: 0 };
  try {
    totals = computeInvoice(lines.map((l) => ({ ...l, sscl: b.country === "lk" ? l.sscl : false })), taxContext(b));
  } catch {
    // A rate that no longer exists: shown as nothing until it's edited.
  }
  return {
    id: r.id, name: r.name, customerId: r.customerId, customerName, frequency: r.frequency, nextRun: r.nextRun, endDate: r.endDate, mode: r.mode, currency: r.currency, active: r.active,
    lastRunAt: r.lastRunAt?.toISOString() ?? null, termsDays: t.termsDays, notes: t.notes ?? null, reference: t.reference ?? null, lines,
    net: totals.net, vat: totals.vat, sscl: totals.sscl, total: totals.total, invoiceCount, upcoming: r.active ? upcoming(r) : [],
  };
}

/**
 * Makes one invoice from a repeating invoice, claiming its run first: the UPDATE only succeeds
 * while next_run is still the date we read, so two workers (or a double click) can't both run it.
 * Returns null when someone else got there first.
 */
export async function runOnce(
  tx: Exec, services: Services, b: BusinessRow, r: RecurringDb,
  opts: { userId: string | null; issueDate: string },
): Promise<{ invoiceId: string; emailId: string | null } | null> {
  const next = advance(r.nextRun, r.frequency, r.template.billDay);
  const stillActive = !r.endDate || next <= r.endDate;
  const claimed = await tx.update(recurringInvoices)
    .set({ nextRun: next, lastRunAt: new Date(), active: stillActive })
    .where(and(eq(recurringInvoices.id, r.id), eq(recurringInvoices.businessId, b.id), eq(recurringInvoices.nextRun, r.nextRun), eq(recurringInvoices.active, true)))
    .returning({ id: recurringInvoices.id });
  if (!claimed.length) return null;

  const t: RecurringTemplate = r.template;
  const [c] = await tx.select().from(customers).where(and(eq(customers.id, r.customerId), eq(customers.businessId, b.id)));
  // Each run is in the repeating invoice's currency, at the rate on its own date. With no rate to
  // be found the run fails, and the job pauses it and tells the owner.
  const fxRate = await rateFor(tx, services, b, r.currency, opts.issueDate);
  const invoiceId = await writeDraft(tx, b, {
    currency: r.currency, fxRate,
    customerId: r.customerId, issueDate: opts.issueDate, dueDate: addDays(opts.issueDate, t.termsDays), reference: t.reference ?? null, notes: t.notes ?? null,
    recurringId: r.id,
    lines: t.lines.map((l) => ({ itemId: l.itemId ?? null, description: l.description, quantityMilli: l.quantityMilli, unitPrice: l.unitPrice, discount: l.discount ?? 0, vatRateId: l.vatRateId ?? null, sscl: b.country === "lk" && l.sscl !== false })),
  });
  if (r.mode === "send") {
    const { number, emailId } = await issueDraft(tx, services, b, invoiceId, { userId: opts.userId, email: !!c.email });
    if (!emailId) await notify(tx, b.id, `${number} for ${c.name} was issued but not emailed`, { body: `Add an email address for ${c.name} to email repeating invoices.`, link: invoiceLink(invoiceId) });
    return { invoiceId, emailId };
  }
  await logActivity(tx, b.id, `Draft invoice for ${c.name} made from "${r.name}" (${formatDate(opts.issueDate, { year: true })})`, { actorId: opts.userId, link: invoiceLink(invoiceId) });
  await notify(tx, b.id, `Draft invoice ready for ${c.name}`, { body: `From your repeating invoice "${r.name}". Check it and send it.`, link: invoiceLink(invoiceId) });
  return { invoiceId, emailId: null };
}

/**
 * The repeating-invoices job: for every active repeating invoice that's due, make the invoice
 * dated its run day and move next_run on. Catches up missed runs one at a time. Safe to run twice.
 */
export async function runDueRecurring(db: Db, services: Services, now = today()) {
  let made = 0;
  const emails: string[] = [];
  for (let pass = 0; pass < 60; pass++) {
    const due = await db.select({ r: recurringInvoices, b: businesses }).from(recurringInvoices)
      .innerJoin(businesses, eq(businesses.id, recurringInvoices.businessId))
      .where(and(
        eq(recurringInvoices.active, true),
        lte(recurringInvoices.nextRun, now),
        or(isNull(recurringInvoices.endDate), sql`${recurringInvoices.nextRun} <= ${recurringInvoices.endDate}`),
      ))
      .limit(100);
    if (!due.length) break;
    let progressed = false;
    for (const { r, b } of due) {
      try {
        const res = await db.transaction((tx) => runOnce(tx, services, b, r, { userId: null, issueDate: r.nextRun }));
        if (res) {
          made++;
          progressed = true;
          if (res.emailId) emails.push(res.emailId);
        }
      } catch (err) {
        // Leave it for the next run and tell the owner (a locked period, a deleted VAT rate...).
        await db.transaction(async (tx) => {
          await tx.update(recurringInvoices).set({ active: false }).where(eq(recurringInvoices.id, r.id));
          await notify(tx, b.id, `Repeating invoice "${r.name}" is paused`, { body: `It couldn't make the invoice due ${formatDate(r.nextRun, { year: true })}: ${(err as Error).message}`, link: `/app/in/repeating/${r.id}` });
        });
      }
    }
    if (!progressed) break;
  }
  if (emails.length) await services.email.deliver(db, emails);
  return { made };
}
