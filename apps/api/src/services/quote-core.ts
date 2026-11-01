import type { QuoteDetail, QuoteRow } from "@billingease/contracts";
import { addDays, toHome, type Rate } from "@billingease/core";
import type { Exec } from "@billingease/db";
import { activity, customers, invoices, quoteLines, quotes } from "@billingease/db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { BusinessRow } from "../lib/context";
import { badRequest, notFound } from "../lib/errors";
import { checkRefs, computeLines, idOr404, lineOut, quoteLink, type NormalLine } from "./invoice-core";
import { shownRate } from "./doc-currency";

export type QuoteDb = typeof quotes.$inferSelect;

const firstLine = sql<string | null>`(select ${quoteLines.description} from ${quoteLines} where ${quoteLines.quoteId} = ${quotes.id} order by ${quoteLines.position} limit 1)`;
const invoiceNumber = sql<string | null>`(select ${invoices.number} from ${invoices} where ${invoices.id} = ${quotes.invoiceId})`;

export function quoteRowsQuery(db: Exec) {
  return db.select({ q: quotes, customerName: customers.name, summary: firstLine, invoiceNumber }).from(quotes).innerJoin(customers, eq(customers.id, quotes.customerId));
}

export function toQuoteRow(r: { q: QuoteDb; customerName: string; summary: string | null; invoiceNumber: string | null }): QuoteRow {
  const q = r.q;
  return {
    id: q.id, number: q.number, status: q.status, customerId: q.customerId, customerName: r.customerName, issueDate: q.issueDate, expiryDate: q.expiryDate,
    summary: r.summary ?? "", currency: q.currency, fxRate: shownRate(q.fxRate), net: q.net, vat: q.vat, sscl: q.sscl, total: q.total, homeTotal: q.homeTotal, invoiceId: q.invoiceId, invoiceNumber: r.invoiceNumber,
    sentAt: q.sentAt?.toISOString() ?? null, decidedAt: q.decidedAt?.toISOString() ?? null,
  };
}

export async function getQuoteRow(db: Exec, businessId: string, id: string): Promise<QuoteDb> {
  const [q] = await db.select().from(quotes).where(and(eq(quotes.id, idOr404(id, "That quote")), eq(quotes.businessId, businessId)));
  if (!q) throw notFound("That quote");
  return q;
}

export async function quoteDetail(db: Exec, b: BusinessRow, id: string): Promise<QuoteDetail> {
  const [r] = await quoteRowsQuery(db).where(and(eq(quotes.id, idOr404(id, "That quote")), eq(quotes.businessId, b.id)));
  if (!r) throw notFound("That quote");
  const [c] = await db.select().from(customers).where(and(eq(customers.id, r.q.customerId), eq(customers.businessId, b.id)));
  const lines = await db.select().from(quoteLines).where(and(eq(quoteLines.quoteId, r.q.id), eq(quoteLines.businessId, b.id))).orderBy(asc(quoteLines.position));
  const acts = await db.select({ message: activity.message, at: activity.createdAt }).from(activity)
    .where(and(eq(activity.businessId, b.id), eq(activity.link, quoteLink(r.q.id)))).orderBy(desc(activity.createdAt)).limit(50);
  return {
    ...toQuoteRow(r),
    notes: r.q.notes,
    vatRegistered: r.q.status === "draft" ? b.vatRegistered : r.q.vatRegistered,
    customer: { id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address, taxId: c.taxId, vatNumber: c.vatNumber, currency: c.currency },
    lines: lines.map(lineOut),
    activity: acts.map((a) => ({ message: a.message, at: a.at.toISOString() })),
  };
}

export async function writeQuote(
  db: Exec, b: BusinessRow,
  data: { id?: string; customerId: string; issueDate: string; expiryDate?: string | null; notes?: string | null; lines: NormalLine[]; currency: string; fxRate: Rate },
) {
  await checkRefs(db, b, data.customerId, data.lines);
  const { totals, rows } = computeLines(b, data.lines);
  const home = toHome(totals, data.currency, b.currency, data.fxRate);
  const expiryDate = data.expiryDate ?? addDays(data.issueDate, 30);
  if (expiryDate < data.issueDate) throw badRequest("The quote can't expire before it's dated.", { expiryDate: "Pick a date after the quote date" });
  const values = {
    customerId: data.customerId, issueDate: data.issueDate, expiryDate, notes: data.notes ?? null,
    currency: data.currency, fxRate: data.fxRate, homeTotal: home.total,
    net: totals.net, vat: totals.vat, sscl: totals.sscl, total: totals.total, vatRegistered: b.vatRegistered, updatedAt: new Date(),
  };
  let id = data.id;
  if (id) {
    await db.update(quotes).set(values).where(and(eq(quotes.id, id), eq(quotes.businessId, b.id)));
    await db.delete(quoteLines).where(and(eq(quoteLines.quoteId, id), eq(quoteLines.businessId, b.id)));
  } else {
    const [row] = await db.insert(quotes).values({ ...values, businessId: b.id, status: "draft" }).returning({ id: quotes.id });
    id = row.id;
  }
  if (rows.length) await db.insert(quoteLines).values(rows.map((r) => ({ ...r, quoteId: id! })));
  return id;
}
