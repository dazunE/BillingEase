import { and, asc, desc, eq, gte, ilike, inArray, like, lt, lte, or, sql, type SQL } from "drizzle-orm";
import { activity, businesses, customers, invoiceLines, invoices, outboxEmails, payments } from "@/db/schema";
import { logActivity } from "./activity";
import { addDays, daysBetween, startOfMonth } from "./dates";
import { accountBySubtype, postEntry, type Exec } from "./ledger";
import { formatMoney } from "./money";
import { createCustomer, createInvoice, OpError, recordPayment, sendInvoice, voidInvoice, type InvoiceLineInput } from "./ops";
import { paymentsProvider } from "./providers";

/**
 * "Coming in": customers, invoices and getting paid. Operations that change
 * things build on lib/ops.ts; the rest are read models for the screens.
 */

const firstLine = sql<string | null>`(select ${invoiceLines.description} from ${invoiceLines} where ${invoiceLines.invoiceId} = ${invoices.id} order by ${invoiceLines.position} limit 1)`;

// ---------------------------------------------------------------------------
// Customers

export type CustomerInput = { name: string; email?: string | null; phone?: string | null; address?: string | null };

export async function updateCustomer(db: Exec, businessId: string, customerId: string, input: CustomerInput) {
  const name = input.name.trim();
  if (!name) throw new OpError("Customer name is required.");
  const [row] = await db
    .update(customers)
    .set({ name, email: input.email?.trim() || null, phone: input.phone?.trim() || null, address: input.address?.trim() || null })
    .where(and(eq(customers.id, customerId), eq(customers.businessId, businessId)))
    .returning();
  if (!row) throw new OpError("Customer not found.");
  return row;
}

export async function listCustomers(db: Exec, businessId: string, opts: { q?: string; today: string }) {
  const q = opts.q?.trim();
  const owed = sql`${invoices.totalCents} - ${invoices.paidCents}`;
  const rows = await db
    .select({
      customer: customers,
      open: sql<string>`coalesce(sum(${owed}), 0)`,
      late: sql<string>`coalesce(sum(case when ${invoices.dueDate} < ${opts.today} then ${owed} else 0 end), 0)`,
    })
    .from(customers)
    .leftJoin(invoices, and(eq(invoices.customerId, customers.id), eq(invoices.status, "sent")))
    .where(and(eq(customers.businessId, businessId), q ? or(ilike(customers.name, `%${q}%`), ilike(customers.email, `%${q}%`)) : undefined))
    .groupBy(customers.id)
    .orderBy(asc(customers.name));
  return rows.map((r) => ({ ...r.customer, openCents: Number(r.open), lateCents: Number(r.late) }));
}

export async function getCustomer(db: Exec, businessId: string, customerId: string) {
  const [row] = await db.select().from(customers).where(and(eq(customers.id, customerId), eq(customers.businessId, businessId)));
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Bill someone: one sentence → a sent invoice

export type BillInput = {
  /** An existing customer, or… */
  customerId?: string | null;
  /** …a new one, created on the spot. */
  newCustomer?: { name: string; email?: string | null } | null;
  lines: InvoiceLineInput[];
  issueDate: string;
  dueInDays: number;
  allowCard?: boolean;
  allowBank?: boolean;
  repeatMonthly?: boolean;
};

/**
 * Creates the invoice (and the customer, if new) and sends it. Call inside a
 * transaction so nothing is left half-done. `emailed` is false when the
 * customer has no email address: the invoice is still sent (it's on the books
 * and has a pay link), but nobody was emailed.
 */
export async function createAndSendInvoice(db: Exec, businessId: string, input: BillInput, opts: { appUrl: string; businessName: string }) {
  if (!input.customerId && !input.newCustomer?.name.trim()) throw new OpError("Choose a customer or type a new name.");
  if (!Number.isInteger(input.dueInDays) || input.dueInDays < 0 || input.dueInDays > 365) throw new OpError("Choose when it's due.");
  const customer = input.customerId
    ? await getCustomer(db, businessId, input.customerId)
    : await createCustomer(db, businessId, { name: input.newCustomer!.name, email: input.newCustomer!.email });
  if (!customer) throw new OpError("Choose a customer.");
  const invoice = await createInvoice(db, businessId, {
    customerId: customer.id,
    issueDate: input.issueDate,
    dueDate: addDays(input.issueDate, input.dueInDays),
    lines: input.lines,
    allowCard: input.allowCard,
    allowBank: input.allowBank,
    repeatMonthly: input.repeatMonthly,
  });
  await sendInvoice(db, businessId, invoice.id, opts);
  return { invoice, customer, emailed: !!customer.email, createdCustomer: !input.customerId };
}

/** Voids an invoice and notes it in the log. */
export async function voidInvoiceAndLog(db: Exec, businessId: string, invoiceId: string) {
  const [inv] = await db.select().from(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.businessId, businessId)));
  if (!inv) throw new OpError("Invoice not found.");
  if (inv.status === "void") throw new OpError("This invoice is already void.");
  await voidInvoice(db, businessId, invoiceId);
  await logActivity(db, businessId, inv.status === "draft" ? `Discarded draft ${inv.number}` : `Voided invoice ${inv.number}`);
  return inv.status === "draft";
}

// ---------------------------------------------------------------------------
// The Coming in screen

export async function comingInOverview(db: Exec, businessId: string, today: string) {
  const withCustomer = () =>
    db
      .select({ invoice: invoices, customer: customers, what: firstLine })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id));
  const [late, onTheWay, drafts, received, viewedSet] = await Promise.all([
    withCustomer().where(and(eq(invoices.businessId, businessId), eq(invoices.status, "sent"), lt(invoices.dueDate, today))).orderBy(asc(invoices.dueDate)),
    withCustomer().where(and(eq(invoices.businessId, businessId), eq(invoices.status, "sent"), gte(invoices.dueDate, today))).orderBy(asc(invoices.dueDate)),
    withCustomer().where(and(eq(invoices.businessId, businessId), eq(invoices.status, "draft"))).orderBy(desc(invoices.createdAt)),
    receivedBetween(db, businessId, startOfMonth(today), today),
    viewedInvoices(db, businessId),
  ]);
  const withOpen = <T extends { invoice: typeof invoices.$inferSelect }>(r: T) => ({ ...r, openCents: r.invoice.totalCents - r.invoice.paidCents });
  return {
    late: late.map((r) => ({ ...withOpen(r), daysLate: daysBetween(r.invoice.dueDate, today) })),
    onTheWay: onTheWay.map((r) => ({ ...withOpen(r), daysLeft: daysBetween(today, r.invoice.dueDate), viewedAt: viewedSet.get(r.invoice.number) ?? null })),
    drafts: drafts.map(withOpen),
    received,
  };
}

export async function receivedBetween(db: Exec, businessId: string, from: string, to: string) {
  return db
    .select({ payment: payments, invoice: invoices, customer: customers })
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(eq(payments.businessId, businessId), gte(payments.receivedOn, from), lte(payments.receivedOn, to)))
    .orderBy(desc(payments.receivedOn), desc(payments.createdAt));
}

const VIEWED = " opened invoice ";

/** Invoice number → when the customer first opened the pay page. */
async function viewedInvoices(db: Exec, businessId: string) {
  const rows = await db
    .select({ message: activity.message, at: activity.createdAt })
    .from(activity)
    .where(and(eq(activity.businessId, businessId), like(activity.message, `%${VIEWED}%`)))
    .orderBy(asc(activity.createdAt));
  const map = new Map<string, Date>();
  for (const r of rows) {
    const number = r.message.split(VIEWED).pop()!;
    if (!map.has(number)) map.set(number, r.at);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Invoice list and detail

export const INVOICE_FILTERS = ["unpaid", "draft", "paid", "all"] as const;
export type InvoiceFilter = (typeof INVOICE_FILTERS)[number];

export async function listInvoices(db: Exec, businessId: string, opts: { status: InvoiceFilter; q?: string; customerId?: string }) {
  const conds: (SQL | undefined)[] = [eq(invoices.businessId, businessId)];
  if (opts.status === "unpaid") conds.push(eq(invoices.status, "sent"));
  if (opts.status === "draft") conds.push(eq(invoices.status, "draft"));
  if (opts.status === "paid") conds.push(eq(invoices.status, "paid"));
  if (opts.customerId) conds.push(eq(invoices.customerId, opts.customerId));
  const q = opts.q?.trim();
  if (q) conds.push(or(ilike(invoices.number, `%${q}%`), ilike(customers.name, `%${q}%`), sql`exists (select 1 from ${invoiceLines} where ${invoiceLines.invoiceId} = ${invoices.id} and ${invoiceLines.description} ilike ${"%" + q + "%"})`));
  return db
    .select({ invoice: invoices, customer: customers, what: firstLine })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(...conds))
    .orderBy(opts.status === "unpaid" ? asc(invoices.dueDate) : desc(invoices.issueDate), desc(invoices.number));
}

export async function invoiceCounts(db: Exec, businessId: string) {
  const rows = await db
    .select({ status: invoices.status, n: sql<string>`count(*)` })
    .from(invoices)
    .where(eq(invoices.businessId, businessId))
    .groupBy(invoices.status);
  const by = Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
  return { unpaid: by.sent ?? 0, draft: by.draft ?? 0, paid: by.paid ?? 0, all: rows.reduce((s, r) => s + Number(r.n), 0) };
}

export type TimelineEvent = { at: Date; label: string; detail?: string };

export async function invoiceDetail(db: Exec, businessId: string, invoiceId: string) {
  const [row] = await db
    .select({ invoice: invoices, customer: customers, business: businesses })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .innerJoin(businesses, eq(invoices.businessId, businesses.id))
    .where(and(eq(invoices.id, invoiceId), eq(invoices.businessId, businessId)));
  if (!row) return null;
  const [lines, paid, mail, log] = await Promise.all([
    db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, invoiceId)).orderBy(asc(invoiceLines.position)),
    db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).orderBy(asc(payments.receivedOn), asc(payments.createdAt)),
    db
      .select()
      .from(outboxEmails)
      .where(and(eq(outboxEmails.businessId, businessId), like(outboxEmails.link, `%/i/${row.invoice.publicToken}`)))
      .orderBy(asc(outboxEmails.createdAt)),
    db
      .select()
      .from(activity)
      .where(and(eq(activity.businessId, businessId), inArray(activity.message, [`Voided invoice ${row.invoice.number}`, `Discarded draft ${row.invoice.number}`, `${row.customer.name}${VIEWED}${row.invoice.number}`])))
      .orderBy(asc(activity.createdAt)),
  ]);

  const timeline: TimelineEvent[] = [{ at: row.invoice.createdAt, label: "Created" }];
  if (row.invoice.sentAt) {
    const first = mail.find((m) => !m.subject.startsWith("A friendly reminder"));
    timeline.push({ at: row.invoice.sentAt, label: "Sent", detail: first ? `Emailed to ${first.toEmail}` : "No email on file, so nothing was emailed" });
  }
  for (const m of mail.filter((m) => m.subject.startsWith("A friendly reminder"))) timeline.push({ at: m.createdAt, label: "Reminder sent", detail: `Emailed to ${m.toEmail}` });
  for (const a of log) timeline.push({ at: a.createdAt, label: a.message.includes(VIEWED) ? "Opened by your customer" : a.message.startsWith("Discarded") ? "Discarded" : "Voided" });
  for (const p of paid) {
    timeline.push({ at: new Date(p.receivedOn + "T12:00:00"), label: `Payment of ${formatMoney(p.amountCents)}`, detail: `${methodLabel(p.method)}${p.providerRef ? ` · ref ${p.providerRef}` : ""}` });
  }
  // Created and sent always come first; the rest in the order they happened.
  const rank = (e: TimelineEvent) => (e.label === "Created" ? 0 : e.label === "Sent" ? 1 : 2);
  timeline.sort((a, b) => rank(a) - rank(b) || a.at.getTime() - b.at.getTime());
  return { ...row, lines, payments: paid, timeline, openCents: row.invoice.totalCents - row.invoice.paidCents };
}

export function methodLabel(method: string) {
  return ({ card: "Card", bank: "Bank transfer", cash: "Cash", check: "Check", apple_pay: "Apple Pay" } as Record<string, string>)[method] ?? method;
}

/** Display status for an invoice, never by color alone. */
export function invoiceStatus(inv: { status: string; dueDate: string; paidCents: number; totalCents: number }, today: string) {
  if (inv.status === "draft") return { label: "Draft", tone: "neutral" as const };
  if (inv.status === "void") return { label: "Void", tone: "neutral" as const };
  if (inv.status === "paid") return { label: "Paid", tone: "pos" as const };
  const days = daysBetween(inv.dueDate, today);
  if (days > 0) return { label: `${days} day${days === 1 ? "" : "s"} late`, tone: "late" as const };
  if (inv.paidCents > 0) return { label: "Partly paid", tone: "pos" as const };
  if (days >= -3) return { label: days === 0 ? "Due today" : "Due soon", tone: "due" as const };
  return { label: "Waiting", tone: "info" as const };
}

// ---------------------------------------------------------------------------
// Public pay page (no login: looked up by the unguessable token)

export async function invoiceByToken(db: Exec, token: string) {
  if (!token || token.length > 64) return null;
  const [row] = await db
    .select({ invoice: invoices, customer: customers, business: businesses })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .innerJoin(businesses, eq(invoices.businessId, businesses.id))
    .where(eq(invoices.publicToken, token));
  // Drafts haven't been sent and voided invoices are gone: neither has a pay page.
  if (!row || row.invoice.status === "draft" || row.invoice.status === "void") return null;
  const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, row.invoice.id)).orderBy(asc(invoiceLines.position));
  const paid = await db.select().from(payments).where(eq(payments.invoiceId, row.invoice.id)).orderBy(desc(payments.createdAt));
  return { ...row, lines, payments: paid, openCents: row.invoice.totalCents - row.invoice.paidCents };
}

/** Notes (once) that the customer opened their invoice, which shows as "Viewed". */
export async function markViewed(db: Exec, businessId: string, customerName: string, number: string) {
  const message = `${customerName}${VIEWED}${number}`;
  const [seen] = await db.select({ id: activity.id }).from(activity).where(and(eq(activity.businessId, businessId), eq(activity.message, message))).limit(1);
  if (!seen) await logActivity(db, businessId, message);
}

/**
 * The customer pays the full open balance online. Charges through the
 * payments provider (sandbox until one is configured), records the payment,
 * and books the processing fee. Run in a transaction.
 */
export async function payInvoiceOnline(
  db: Exec,
  token: string,
  input: { method: "card" | "bank"; cardNumber?: string; receivedOn: string },
) {
  const found = await invoiceByToken(db, token);
  if (!found) throw new OpError("This invoice isn't available.");
  const { invoice, customer } = found;
  if (invoice.status !== "sent" || found.openCents <= 0) throw new OpError("This invoice is already paid.");
  if (input.method === "card" && !invoice.allowCard) throw new OpError("This invoice can't be paid by card.");
  if (input.method === "bank" && !invoice.allowBank) throw new OpError("This invoice can't be paid by bank transfer.");

  const result = await paymentsProvider().charge({ amountCents: found.openCents, method: input.method, cardNumber: input.cardNumber, description: `Invoice ${invoice.number}` });
  if (!result.ok) throw new OpError(result.message);

  const { payment } = await recordPayment(db, invoice.businessId, invoice.id, {
    amountCents: found.openCents,
    method: input.method,
    receivedOn: input.receivedOn,
    providerRef: result.reference,
  });
  if (result.feeCents > 0) {
    const fees = await accountBySubtype(db, invoice.businessId, "fees");
    const cash = await accountBySubtype(db, invoice.businessId, "cash");
    await postEntry(db, {
      businessId: invoice.businessId,
      date: input.receivedOn,
      memo: `${input.method === "card" ? "Card" : "Bank"} processing fee for ${invoice.number} (${customer.name})`,
      sourceType: "expense",
      sourceId: payment.id,
      lines: [
        { accountId: fees.id, debit: result.feeCents },
        { accountId: cash.id, credit: result.feeCents },
      ],
    });
  }
  return { payment, feeCents: result.feeCents };
}

// ---------------------------------------------------------------------------
// Dev outbox

export async function listOutbox(db: Exec, businessId: string, limit = 100) {
  return db.select().from(outboxEmails).where(eq(outboxEmails.businessId, businessId)).orderBy(desc(outboxEmails.createdAt)).limit(limit);
}

export async function nextInvoiceNumber(db: Exec, businessId: string) {
  const [b] = await db.select({ prefix: businesses.invoicePrefix, next: businesses.nextInvoiceNo }).from(businesses).where(eq(businesses.id, businessId));
  return `${b.prefix}${String(b.next).padStart(4, "0")}`;
}
