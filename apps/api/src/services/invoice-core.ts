import { randomBytes } from "node:crypto";
import type { InvoiceDetail, InvoiceRow, LineInput } from "@billingease/contracts";
import { addDays, computeInvoice, daysBetween, formatDate, formatMoney, invoiceTitle, posting, rulesFor, today, type InvoiceTotals } from "@billingease/core";
import { postEntry, reverseEntry, type Exec } from "@billingease/db";
import {
  activity, customers, invoiceLines, invoices, items, outboxEmails, quoteLines, quotes, receipts, type InvoiceSnapshot,
} from "@billingease/db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { BusinessRow } from "../lib/context";
import { logActivity } from "../lib/activity";
import { AppError, badRequest, conflict, notFound } from "../lib/errors";
import type { Services } from "./index";
import { nextNumber } from "./numbering";

export type InvoiceDb = typeof invoices.$inferSelect;
export type CustomerDb = typeof customers.$inferSelect;
type LineDb = typeof invoiceLines.$inferSelect;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** A path id, checked before it reaches the database (a bad uuid would be a 500). */
export function idOr404(id: string | undefined, what = "That"): string {
  if (!id || !UUID.test(id)) throw notFound(what);
  return id;
}

export const invoiceLink = (id: string) => `/app/in/invoices/${id}`;
export const quoteLink = (id: string) => `/app/in/quotes/${id}`;
export const newToken = () => randomBytes(18).toString("base64url");
export const money = (b: { currency: "GBP" | "LKR" | "USD" }, minor: number) => formatMoney(minor, b.currency, { decimals: "always" });

export function taxContext(b: BusinessRow) {
  return { country: b.country, vatRegistered: b.vatRegistered, ssclRegistered: b.country === "lk" && b.ssclRegistered };
}

export type NormalLine = { itemId: string | null; description: string; quantityMilli: number; unitPrice: number; discount: number; vatRateId: string | null; sscl: boolean };

export function normalLines(lines: LineInput[], b: BusinessRow): NormalLine[] {
  return lines.map((l) => ({
    itemId: l.itemId ?? null,
    description: l.description.trim(),
    quantityMilli: l.quantityMilli,
    unitPrice: l.unitPrice,
    discount: l.discount ?? 0,
    vatRateId: l.vatRateId || null,
    sscl: b.country === "lk" ? l.sscl !== false : false,
  }));
}

/** Works out each line's tax with core's computeInvoice. Errors come back against the line. */
export function computeLines(b: BusinessRow, lines: NormalLine[]): { totals: InvoiceTotals; rows: Omit<typeof invoiceLines.$inferInsert, "invoiceId">[] } {
  const rules = rulesFor(b.country);
  lines.forEach((l, i) => {
    if (l.vatRateId && !rules.vatRates.some((r) => r.id === l.vatRateId)) throw badRequest(`Line ${i + 1}: pick one of the VAT rates.`, { [`lines.${i}.vatRateId`]: "Pick a VAT rate" });
    if (l.discount > Math.round((l.quantityMilli * l.unitPrice) / 1000)) throw badRequest(`Line ${i + 1}: the discount is more than the line.`, { [`lines.${i}.discount`]: "More than the line" });
  });
  const totals = computeInvoice(lines.map((l) => ({ quantityMilli: l.quantityMilli, unitPrice: l.unitPrice, discount: l.discount, vatRateId: l.vatRateId, sscl: l.sscl })), taxContext(b));
  const rows = lines.map((l, i) => {
    const t = totals.lines[i];
    return {
      businessId: b.id, position: i, itemId: l.itemId, description: l.description, quantityMilli: l.quantityMilli, unitPrice: l.unitPrice,
      discount: l.discount, vatRateId: t.vatRateId ?? l.vatRateId, vatBps: t.vatBps, ssclApplies: l.sscl, net: t.net, sscl: t.sscl, vat: t.vat, total: t.total,
    };
  });
  return { totals, rows };
}

/** Customers and price-list items named by a draft must belong to this business. */
export async function checkRefs(db: Exec, b: BusinessRow, customerId: string, lines: NormalLine[]) {
  const [c] = await db.select().from(customers).where(and(eq(customers.id, customerId), eq(customers.businessId, b.id)));
  if (!c) throw badRequest("Pick a customer from your list.", { customerId: "Pick a customer" });
  const ids = [...new Set(lines.map((l) => l.itemId).filter((x): x is string => !!x))];
  if (ids.length) {
    const found = await db.select({ id: items.id }).from(items).where(and(eq(items.businessId, b.id), inArray(items.id, ids)));
    if (found.length !== ids.length) throw badRequest("A line uses a price that isn't in your price list.");
  }
  return c;
}

export function addressOf(b: BusinessRow) {
  return [b.addressLine1, b.addressLine2, b.town, b.region, b.postcode].filter(Boolean).join(", ");
}

/** What the seller and buyer look like now; frozen onto the invoice when it's issued. */
export function snapshotFor(b: BusinessRow, c: CustomerDb, vatRegistered: boolean): InvoiceSnapshot {
  const lk = b.country === "lk";
  return {
    title: invoiceTitle(b.country, vatRegistered),
    seller: {
      name: b.name, legalName: b.legalName, address: addressOf(b),
      taxId: lk ? b.taxId : null, vatNumber: vatRegistered ? b.vatNumber : null, email: b.email, phone: b.phone,
    },
    buyer: { name: c.name, address: c.address, taxId: lk ? c.taxId : null, vatNumber: c.vatNumber, email: c.email },
    paymentDetails: b.paymentDetails,
    note: b.invoiceNote,
  };
}

// ---------------------------------------------------------------------------
// Reading

export const openOf = (i: { total: number; paid: number; credited: number; status: string }) => (i.status === "void" || i.status === "draft" ? 0 : i.total - i.paid - i.credited);

export function shownStatus(i: { status: InvoiceDb["status"]; kind: string; dueDate: string; total: number; paid: number; credited: number }, now = today()): InvoiceRow["shown"] {
  if (i.kind === "invoice" && (i.status === "sent" || i.status === "part_paid") && openOf(i) > 0 && i.dueDate < now) return "late";
  return i.status;
}

const firstLine = sql<string | null>`(select ${invoiceLines.description} from ${invoiceLines} where ${invoiceLines.invoiceId} = ${invoices.id} order by ${invoiceLines.position} limit 1)`;

/** Selects invoices with what the list needs. Always filtered by business. */
export function invoiceRowsQuery(db: Exec) {
  return db.select({ inv: invoices, customerName: customers.name, summary: firstLine }).from(invoices).innerJoin(customers, eq(customers.id, invoices.customerId));
}

export function toRow(r: { inv: InvoiceDb; customerName: string; summary: string | null }, now = today()): InvoiceRow {
  const i = r.inv;
  const shown = shownStatus(i, now);
  return {
    id: i.id, kind: i.kind, number: i.number, status: i.status, shown, customerId: i.customerId, customerName: r.customerName,
    issueDate: i.issueDate, dueDate: i.dueDate, summary: r.summary ?? "", net: i.net, vat: i.vat, sscl: i.sscl, total: i.total,
    paid: i.paid, credited: i.credited, open: openOf(i), daysLate: shown === "late" ? daysBetween(i.dueDate, now) : 0, remindersSent: i.remindersSent,
  };
}

export function lineOut(l: LineDb | typeof quoteLines.$inferSelect) {
  return {
    id: l.id, position: l.position, itemId: l.itemId, description: l.description, quantityMilli: l.quantityMilli, unitPrice: l.unitPrice,
    discount: l.discount, vatRateId: l.vatRateId, vatBps: l.vatBps, sscl: l.ssclApplies, net: l.net, ssclAmount: l.sscl, vat: l.vat, total: l.total,
  };
}

export async function getInvoiceRow(db: Exec, businessId: string, id: string, opts: { forUpdate?: boolean } = {}): Promise<InvoiceDb> {
  const q = db.select().from(invoices).where(and(eq(invoices.id, idOr404(id, "That invoice")), eq(invoices.businessId, businessId)));
  const [row] = opts.forUpdate ? await q.for("update") : await q;
  if (!row) throw notFound("That invoice");
  return row;
}

export async function invoiceDetail(db: Exec, b: BusinessRow, id: string): Promise<InvoiceDetail> {
  const [r] = await invoiceRowsQuery(db).where(and(eq(invoices.id, idOr404(id, "That invoice")), eq(invoices.businessId, b.id)));
  if (!r) throw notFound("That invoice");
  const i = r.inv;
  const [c] = await db.select().from(customers).where(and(eq(customers.id, i.customerId), eq(customers.businessId, b.id)));
  const [lines, recs, credits, parent, quote, acts, mails] = await Promise.all([
    db.select().from(invoiceLines).where(and(eq(invoiceLines.invoiceId, i.id), eq(invoiceLines.businessId, b.id))).orderBy(asc(invoiceLines.position)),
    db.select().from(receipts).where(and(eq(receipts.invoiceId, i.id), eq(receipts.businessId, b.id))).orderBy(asc(receipts.receivedOn), asc(receipts.createdAt)),
    db.select({ id: invoices.id, number: invoices.number, issueDate: invoices.issueDate, total: invoices.total }).from(invoices)
      .where(and(eq(invoices.businessId, b.id), eq(invoices.creditForId, i.id), eq(invoices.kind, "credit_note"))).orderBy(asc(invoices.createdAt)),
    i.creditForId ? db.select({ id: invoices.id, number: invoices.number }).from(invoices).where(and(eq(invoices.id, i.creditForId), eq(invoices.businessId, b.id))) : Promise.resolve([]),
    i.quoteId ? db.select({ id: quotes.id, number: quotes.number }).from(quotes).where(and(eq(quotes.id, i.quoteId), eq(quotes.businessId, b.id))) : Promise.resolve([]),
    db.select({ message: activity.message, at: activity.createdAt }).from(activity).where(and(eq(activity.businessId, b.id), eq(activity.link, invoiceLink(i.id)))).orderBy(desc(activity.createdAt)).limit(50),
    db.select({ to: outboxEmails.toEmail, subject: outboxEmails.subject, status: outboxEmails.status, at: outboxEmails.createdAt }).from(outboxEmails)
      .where(and(eq(outboxEmails.businessId, b.id), eq(outboxEmails.attachInvoiceId, i.id))).orderBy(desc(outboxEmails.createdAt)).limit(20),
  ]);
  return {
    ...toRow(r),
    title: i.kind === "credit_note" ? "Credit note" : (i.snapshot?.title ?? invoiceTitle(b.country, b.vatRegistered)),
    supplyDate: i.supplyDate, reference: i.reference, notes: i.notes, vatRegistered: i.status === "draft" ? b.vatRegistered : i.vatRegistered,
    snapshot: i.snapshot ?? null,
    customer: { id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address, taxId: c.taxId, vatNumber: c.vatNumber },
    lines: lines.map(lineOut),
    receipts: recs.map((x) => ({ id: x.id, amount: x.amount, method: x.method, receivedOn: x.receivedOn, reference: x.reference, chequeNumber: x.chequeNumber, chequeDate: x.chequeDate, chequeBank: x.chequeBank, voided: !!x.voidedAt })),
    creditNotes: credits,
    creditFor: parent[0] ?? null,
    quote: quote[0] ?? null,
    recurringId: i.recurringId,
    sentAt: i.sentAt?.toISOString() ?? null,
    lastReminderAt: i.lastReminderAt?.toISOString() ?? null,
    activity: acts.map((a) => ({ message: a.message, at: a.at.toISOString() })),
    emails: mails.map((m) => ({ to: m.to, subject: m.subject, status: m.status, at: m.at.toISOString() })),
  };
}

// ---------------------------------------------------------------------------
// Writing

/** Saves a draft's lines and totals (replacing any lines it had). */
export async function writeDraft(
  db: Exec, b: BusinessRow,
  data: { id?: string; customerId: string; issueDate: string; supplyDate?: string | null; dueDate?: string | null; reference?: string | null; notes?: string | null; lines: NormalLine[]; quoteId?: string | null; recurringId?: string | null },
): Promise<string> {
  await checkRefs(db, b, data.customerId, data.lines);
  const { totals, rows } = computeLines(b, data.lines);
  const dueDate = data.dueDate ?? addDays(data.issueDate, b.termsDays);
  if (dueDate < data.issueDate) throw badRequest("The due date is before the invoice date.", { dueDate: "Pick a date on or after the invoice date" });
  const values = {
    customerId: data.customerId, issueDate: data.issueDate, supplyDate: data.supplyDate ?? null, dueDate, reference: data.reference ?? null, notes: data.notes ?? null,
    net: totals.net, vat: totals.vat, sscl: totals.sscl, total: totals.total, vatRegistered: b.vatRegistered, updatedAt: new Date(),
  };
  let id = data.id;
  if (id) {
    await db.update(invoices).set(values).where(and(eq(invoices.id, id), eq(invoices.businessId, b.id)));
    await db.delete(invoiceLines).where(and(eq(invoiceLines.invoiceId, id), eq(invoiceLines.businessId, b.id)));
  } else {
    const [row] = await db.insert(invoices).values({ ...values, businessId: b.id, kind: "invoice", status: "draft", publicToken: newToken(), quoteId: data.quoteId ?? null, recurringId: data.recurringId ?? null }).returning({ id: invoices.id });
    id = row.id;
  }
  if (rows.length) await db.insert(invoiceLines).values(rows.map((r) => ({ ...r, invoiceId: id! })));
  return id;
}

export function storedLines(lines: Pick<LineDb, "itemId" | "description" | "quantityMilli" | "unitPrice" | "discount" | "vatRateId" | "ssclApplies">[]): NormalLine[] {
  return lines.map((l) => ({ itemId: l.itemId, description: l.description, quantityMilli: l.quantityMilli, unitPrice: l.unitPrice, discount: l.discount, vatRateId: l.vatRateId, sscl: l.ssclApplies }));
}

function greeting(c: CustomerDb) {
  return c.contactName ? `Hello ${c.contactName.split(/\s+/)[0]},` : "Hello,";
}

export function invoiceEmail(b: BusinessRow, c: CustomerDb, inv: { number: string; total: number; dueDate: string; title: string }, message?: string | null) {
  const body = [
    greeting(c),
    "",
    message?.trim() || `Here is ${inv.title.toLowerCase().startsWith("tax") ? "Tax Invoice" : "invoice"} ${inv.number} for ${money(b, inv.total)}, due on ${formatDate(inv.dueDate, { year: true })}. The PDF is attached.`,
    ...(b.paymentDetails ? ["", `How to pay: ${b.paymentDetails}`] : []),
    "",
    "Thank you,",
    b.name,
  ];
  return { subject: `${inv.title} ${inv.number} from ${b.name}`, text: body.join("\n") };
}

export function reminderText(b: BusinessRow, c: CustomerDb, inv: InvoiceDb, now = today()) {
  const open = openOf(inv);
  const due = formatDate(inv.dueDate, { year: true });
  const when = inv.dueDate < now ? `was due on ${due}` : `is due on ${due}`;
  const lines = [
    greeting(c),
    "",
    `A friendly reminder that invoice ${inv.number} ${when}, and ${money(b, open)} is still to pay.`,
    ...(b.paymentDetails ? ["", `How to pay: ${b.paymentDetails}`] : []),
    "",
    "If you've already paid, thank you, and please ignore this.",
    "",
    b.name,
  ];
  return lines.join("\n");
}

/**
 * Issues a draft: takes the next number, freezes the seller and buyer, posts the invoice to the
 * ledger and (optionally) queues the email with the PDF. Run inside a transaction.
 */
export async function issueDraft(
  tx: Exec, services: Services, b: BusinessRow, invoiceId: string,
  opts: { userId: string | null; email: boolean; message?: string | null; replyTo?: string | null },
): Promise<{ number: string; emailId: string | null }> {
  const inv = await getInvoiceRow(tx, b.id, invoiceId, { forUpdate: true });
  if (inv.kind !== "invoice" || inv.status !== "draft") throw conflict(`${inv.number ?? "This invoice"} has already been issued.`);
  const lines = await tx.select().from(invoiceLines).where(and(eq(invoiceLines.invoiceId, inv.id), eq(invoiceLines.businessId, b.id))).orderBy(asc(invoiceLines.position));
  if (!lines.length) throw badRequest("Add at least one line before sending.", { lines: "Add a line" });
  const c = await checkRefs(tx, b, inv.customerId, storedLines(lines));
  // Recompute with the business's registration as it is now, so the issued invoice matches its title.
  const { totals, rows } = computeLines(b, storedLines(lines));
  if (totals.total <= 0) throw badRequest("The invoice comes to nothing. Add a price to a line.", { lines: "Add a price" });
  if (opts.email && !c.email) throw badRequest(`Add an email address for ${c.name} to email it, or save it without emailing.`, { email: "No email for this customer" });

  const number = await nextNumber(tx, b.id, "invoice");
  const snapshot = snapshotFor(b, c, b.vatRegistered);
  await tx.delete(invoiceLines).where(and(eq(invoiceLines.invoiceId, inv.id), eq(invoiceLines.businessId, b.id)));
  await tx.insert(invoiceLines).values(rows.map((r) => ({ ...r, invoiceId: inv.id })));
  const entryId = await postEntry(tx, {
    businessId: b.id, date: inv.issueDate, memo: `Invoice ${number} to ${c.name}`, sourceType: "invoice", sourceId: inv.id, createdBy: opts.userId,
    lines: posting.invoice(totals),
  });
  await tx.update(invoices).set({
    number, status: "sent", net: totals.net, vat: totals.vat, sscl: totals.sscl, total: totals.total, vatRegistered: b.vatRegistered,
    snapshot, journalEntryId: entryId, sentAt: new Date(), updatedAt: new Date(),
  }).where(and(eq(invoices.id, inv.id), eq(invoices.businessId, b.id)));

  let emailId: string | null = null;
  if (opts.email && c.email) {
    const m = invoiceEmail(b, c, { number, total: totals.total, dueDate: inv.dueDate, title: snapshot.title }, opts.message);
    emailId = await services.email.queue(tx, { businessId: b.id, to: c.email, replyTo: opts.replyTo ?? b.email, subject: m.subject, text: m.text, attachInvoiceId: inv.id });
  }
  await logActivity(tx, b.id, emailId ? `${snapshot.title} ${number} emailed to ${c.name} (${c.email})` : `${snapshot.title} ${number} issued to ${c.name}`, { actorId: opts.userId, link: invoiceLink(inv.id) });
  return { number, emailId };
}

/** Paid, part paid or sent, from what's been received and credited. */
export function statusFor(i: { total: number; paid: number; credited: number }): "sent" | "part_paid" | "paid" {
  if (i.paid + i.credited >= i.total) return "paid";
  if (i.paid > 0) return "part_paid";
  return "sent";
}

export async function recordPayment(
  tx: Exec, b: BusinessRow, invoiceId: string, userId: string | null,
  p: { amount: number; receivedOn: string; method: string; reference?: string | null; chequeNumber?: string | null; chequeDate?: string | null; chequeBank?: string | null },
) {
  const rules = rulesFor(b.country);
  const inv = await getInvoiceRow(tx, b.id, invoiceId, { forUpdate: true });
  if (inv.kind !== "invoice") throw conflict("Payments are recorded against invoices, not credit notes.");
  if (inv.status === "draft") throw conflict("Send the invoice before recording a payment.");
  if (inv.status === "void") throw conflict("This invoice was voided.");
  const open = openOf(inv);
  if (open <= 0) throw conflict("This invoice is already paid.");
  if (p.amount > open) throw badRequest(`That's more than the ${money(b, open)} left to pay.`, { amount: `At most ${money(b, open)}` });
  if (!rules.receiveMethods.includes(p.method)) throw badRequest("Pick how they paid.", { method: `One of: ${rules.receiveMethods.join(", ")}` });
  if (p.receivedOn > today()) throw badRequest("Pick today or an earlier date.", { receivedOn: "Can't be in the future" });
  const cheque = p.method === "Cheque";
  if (cheque && b.country === "lk" && !p.chequeNumber) throw badRequest("Enter the cheque number.", { chequeNumber: "Enter the cheque number" });
  const [c] = await tx.select({ name: customers.name }).from(customers).where(and(eq(customers.id, inv.customerId), eq(customers.businessId, b.id)));

  const [rec] = await tx.insert(receipts).values({
    businessId: b.id, invoiceId: inv.id, amount: p.amount, method: p.method, receivedOn: p.receivedOn, reference: p.reference ?? null,
    chequeNumber: cheque ? (p.chequeNumber ?? null) : null, chequeDate: cheque ? (p.chequeDate ?? null) : null, chequeBank: cheque ? (p.chequeBank ?? null) : null,
  }).returning({ id: receipts.id });
  const entryId = await postEntry(tx, {
    businessId: b.id, date: p.receivedOn, memo: `Payment for ${inv.number} from ${c.name}`, sourceType: "receipt", sourceId: rec.id, createdBy: userId,
    lines: posting.receipt(p.amount, p.method),
  });
  await tx.update(receipts).set({ journalEntryId: entryId }).where(eq(receipts.id, rec.id));
  const paid = inv.paid + p.amount;
  const status = statusFor({ total: inv.total, paid, credited: inv.credited });
  await tx.update(invoices).set({ paid, status, updatedAt: new Date() }).where(and(eq(invoices.id, inv.id), eq(invoices.businessId, b.id)));
  const how = cheque && p.chequeNumber ? `cheque ${p.chequeNumber}` : (p.method === p.method.toUpperCase() ? p.method : p.method.toLowerCase());
  await logActivity(tx, b.id, `${money(b, p.amount)} received from ${c.name} for ${inv.number} by ${how}${status === "paid" ? ", now paid in full" : ""}`, { actorId: userId, link: invoiceLink(inv.id) });
  return rec.id;
}

export async function voidPayment(tx: Exec, b: BusinessRow, invoiceId: string, receiptId: string, userId: string | null) {
  const inv = await getInvoiceRow(tx, b.id, invoiceId, { forUpdate: true });
  const [rec] = await tx.select().from(receipts).where(and(eq(receipts.id, idOr404(receiptId, "That payment")), eq(receipts.invoiceId, inv.id), eq(receipts.businessId, b.id)));
  if (!rec) throw notFound("That payment");
  if (rec.voidedAt) throw conflict("That payment was already removed.");
  if (rec.journalEntryId) await reverseEntry(tx, b.id, rec.journalEntryId, { createdBy: userId, memo: `Payment removed: ${inv.number}` });
  await tx.update(receipts).set({ voidedAt: new Date() }).where(eq(receipts.id, rec.id));
  const paid = inv.paid - rec.amount;
  await tx.update(invoices).set({ paid, status: statusFor({ total: inv.total, paid, credited: inv.credited }), updatedAt: new Date() })
    .where(and(eq(invoices.id, inv.id), eq(invoices.businessId, b.id)));
  await logActivity(tx, b.id, `Payment of ${money(b, rec.amount)} on ${inv.number} removed`, { actorId: userId, link: invoiceLink(inv.id) });
}

export async function voidInvoice(tx: Exec, b: BusinessRow, invoiceId: string, userId: string | null, reason?: string | null) {
  const inv = await getInvoiceRow(tx, b.id, invoiceId, { forUpdate: true });
  if (inv.status === "draft") throw conflict("A draft can be deleted instead.");
  if (inv.status === "void") throw conflict("This invoice was already voided.");
  if (inv.kind !== "invoice") throw conflict("Credit notes can't be voided.");
  const [{ live }] = await tx.select({ live: sql<number>`count(*)::int` }).from(receipts).where(and(eq(receipts.invoiceId, inv.id), eq(receipts.businessId, b.id), sql`${receipts.voidedAt} is null`));
  if (live > 0 || inv.paid > 0) throw conflict("This invoice has payments recorded. Remove them first, or give a credit note.");
  if (inv.credited > 0) throw conflict("This invoice has a credit note against it, so it can't be voided.");
  if (inv.journalEntryId) await reverseEntry(tx, b.id, inv.journalEntryId, { createdBy: userId, memo: `Void: invoice ${inv.number}` });
  await tx.update(invoices).set({ status: "void", voidedAt: new Date(), updatedAt: new Date() }).where(and(eq(invoices.id, inv.id), eq(invoices.businessId, b.id)));
  await logActivity(tx, b.id, `Invoice ${inv.number} voided${reason ? `: ${reason}` : ""}`, { actorId: userId, link: invoiceLink(inv.id) });
}

/** A credit note against an issued invoice: whole or in part, never more than is still owed. */
export async function createCreditNote(
  tx: Exec, services: Services, b: BusinessRow, invoiceId: string, userId: string | null,
  body: { full: boolean; lines: { lineId: string; quantityMilli: number; unitPrice?: number }[]; issueDate?: string; reason?: string | null; email: boolean },
) {
  const inv = await getInvoiceRow(tx, b.id, invoiceId, { forUpdate: true });
  if (inv.kind !== "invoice" || inv.status === "draft" || inv.status === "void") throw conflict("Credit notes are given against a sent invoice.");
  const orig = await tx.select().from(invoiceLines).where(and(eq(invoiceLines.invoiceId, inv.id), eq(invoiceLines.businessId, b.id))).orderBy(asc(invoiceLines.position));
  let picked: NormalLine[];
  if (body.full) {
    picked = storedLines(orig);
  } else {
    if (!body.lines.length) throw badRequest("Pick at least one line to credit.", { lines: "Pick a line" });
    picked = body.lines.map((x, i) => {
      const l = orig.find((o) => o.id === x.lineId);
      if (!l) throw badRequest(`Line ${i + 1} isn't on this invoice.`);
      if (x.quantityMilli > l.quantityMilli) throw badRequest(`You can't credit more than the ${l.quantityMilli / 1000} on "${l.description}".`, { [`lines.${i}.quantityMilli`]: "More than invoiced" });
      const unitPrice = x.unitPrice ?? l.unitPrice;
      if (unitPrice > l.unitPrice) throw badRequest(`The price can't be more than on the invoice.`, { [`lines.${i}.unitPrice`]: "More than invoiced" });
      // A whole line keeps its discount; part of a line takes its share of it.
      const gross = l.quantityMilli * l.unitPrice;
      const discount = gross ? Math.round((l.discount * x.quantityMilli * unitPrice) / gross) : 0;
      return { itemId: l.itemId, description: l.description, quantityMilli: x.quantityMilli, unitPrice, discount, vatRateId: l.vatRateId, sscl: l.ssclApplies };
    });
  }
  // Tax as on the original invoice.
  const asIssued = { ...b, vatRegistered: inv.vatRegistered, ssclRegistered: inv.sscl > 0 || (b.country === "lk" && b.ssclRegistered) };
  const { totals, rows } = computeLines(asIssued, picked);
  if (totals.total <= 0) throw badRequest("The credit note comes to nothing.");
  const open = openOf(inv);
  if (totals.total > open) {
    throw new AppError(409, "too_much", `That's ${money(b, totals.total)}, more than the ${money(b, open)} still owed. Money you pay back for a paid invoice goes in Going out.`);
  }
  const issueDate = body.issueDate ?? today();
  if (issueDate < inv.issueDate) throw badRequest("The credit note can't be dated before the invoice.", { issueDate: "On or after the invoice date" });
  const [c] = await tx.select().from(customers).where(and(eq(customers.id, inv.customerId), eq(customers.businessId, b.id)));
  if (body.email && !c.email) throw badRequest(`Add an email address for ${c.name} to email it.`, { email: "No email for this customer" });
  const number = await nextNumber(tx, b.id, "credit");
  const snapshot = { ...snapshotFor(b, c, inv.vatRegistered), title: "Credit note" };
  const [cn] = await tx.insert(invoices).values({
    businessId: b.id, kind: "credit_note", number, customerId: inv.customerId, status: "sent", issueDate, dueDate: issueDate,
    reference: inv.number, notes: body.reason ?? null, net: totals.net, vat: totals.vat, sscl: totals.sscl, total: totals.total,
    vatRegistered: inv.vatRegistered, creditForId: inv.id, snapshot, publicToken: newToken(), sentAt: new Date(),
  }).returning({ id: invoices.id });
  await tx.insert(invoiceLines).values(rows.map((r) => ({ ...r, invoiceId: cn.id })));
  const entryId = await postEntry(tx, {
    businessId: b.id, date: issueDate, memo: `Credit note ${number} against ${inv.number}`, sourceType: "credit_note", sourceId: cn.id, createdBy: userId,
    lines: posting.creditNote(totals),
  });
  await tx.update(invoices).set({ journalEntryId: entryId }).where(eq(invoices.id, cn.id));
  const credited = inv.credited + totals.total;
  await tx.update(invoices).set({ credited, status: statusFor({ total: inv.total, paid: inv.paid, credited }), updatedAt: new Date() })
    .where(and(eq(invoices.id, inv.id), eq(invoices.businessId, b.id)));
  let emailId: string | null = null;
  if (body.email && c.email) {
    emailId = await services.email.queue(tx, {
      businessId: b.id, to: c.email, replyTo: b.email, subject: `Credit note ${number} from ${b.name}`, attachInvoiceId: cn.id,
      text: [greeting(c), "", `Here is credit note ${number} for ${money(b, totals.total)}, taken off invoice ${inv.number}. The PDF is attached.`, "", "Thank you,", b.name].join("\n"),
    });
  }
  const msg = `Credit note ${number} for ${money(b, totals.total)} against ${inv.number}${emailId ? `, emailed to ${c.email}` : ""}`;
  await logActivity(tx, b.id, msg, { actorId: userId, link: invoiceLink(inv.id) });
  await logActivity(tx, b.id, msg, { actorId: userId, link: invoiceLink(cn.id) });
  return { id: cn.id, emailId };
}
