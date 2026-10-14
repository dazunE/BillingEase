import { categoryById, formatMoney, posting, rulesFor, today, addDays, type Category } from "@billingease/core";
import { postEntry, reverseEntry, type Exec } from "@billingease/db";
import { attachments, bills, expenses, suppliers, users } from "@billingease/db/schema";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { BizCtx, BusinessRow } from "../../lib/context";
import { badRequest, notFound } from "../../lib/errors";

export type ExpenseRow = typeof expenses.$inferSelect;
export type BillRow = typeof bills.$inferSelect;

export const UNCATEGORISED_CODE = "6990";

/** UK landlords (and sole traders who also let property) keep property costs apart. */
export function hasProperty(b: BusinessRow) {
  return b.country === "uk" && (b.kind === "landlord" || b.kind === "both");
}

/** The country's categories this business can use. */
export function categoriesFor(b: BusinessRow): Category[] {
  return rulesFor(b.country).categories.filter((c) => c.scope === "business" || hasProperty(b));
}

export function categoryFor(b: BusinessRow, id: string, field = "categoryId"): Category {
  const c = categoryById(b.country, id);
  if (!c || (c.scope === "property" && !hasProperty(b))) throw badRequest("Pick one of the categories on the list.", { [field]: "Pick one of the categories on the list" });
  return c;
}

export function categoryName(b: BusinessRow, id: string | null) {
  if (!id) return { name: null, official: null };
  const c = categoryById(b.country, id);
  return { name: c?.name ?? id, official: c?.official ?? null };
}

export function checkMethod(b: BusinessRow, method: string, field = "method") {
  const m = rulesFor(b.country).payMethods.find((x) => x.toLowerCase() === method.trim().toLowerCase());
  if (!m) throw badRequest("Pick how you paid from the list.", { [field]: "Pick one of the ways to pay" });
  return m;
}

export const isCheque = (method: string) => method.toLowerCase() === "cheque";

/** Cheque details are kept only for cheques, and a cheque needs its number. */
export function chequeFields(method: string, f: { chequeNumber?: string | null; chequeDate?: string | null; chequeBank?: string | null }, date: string) {
  if (!isCheque(method)) return { chequeNumber: null, chequeDate: null, chequeBank: null };
  if (!f.chequeNumber) throw badRequest("Enter the cheque number.", { chequeNumber: "Enter the cheque number" });
  return { chequeNumber: f.chequeNumber, chequeDate: f.chequeDate ?? date, chequeBank: f.chequeBank ?? null };
}

/** Business share of an expense (what counts in Going out), as summary.ts works it out. */
export const businessShare = (gross: number, bizPct: number) => Math.round((gross * bizPct) / 100);

export const money = (b: BusinessRow, minor: number) => formatMoney(minor, b.currency);

export async function supplierOf(db: Exec, businessId: string, id: string) {
  const [s] = await db.select().from(suppliers).where(and(eq(suppliers.id, id), eq(suppliers.businessId, businessId)));
  if (!s) throw notFound("That supplier");
  return s;
}

/** Finds a live supplier by name (any case). */
export async function supplierByName(db: Exec, businessId: string, name: string) {
  const [s] = await db.select().from(suppliers)
    .where(and(eq(suppliers.businessId, businessId), isNull(suppliers.archivedAt), sql`lower(${suppliers.name}) = lower(${name.trim()})`)).limit(1);
  return s ?? null;
}

export async function attachmentCounts(db: Exec, businessId: string, ownerType: "expense" | "bill", ids: string[]) {
  if (ids.length === 0) return new Map<string, number>();
  const rows = await db.select({ ownerId: attachments.ownerId, n: sql<string>`count(*)` }).from(attachments)
    .where(and(eq(attachments.businessId, businessId), eq(attachments.ownerType, ownerType), inArray(attachments.ownerId, ids)))
    .groupBy(attachments.ownerId);
  return new Map(rows.map((r) => [r.ownerId, Number(r.n)]));
}

export async function userNames(db: Exec, ids: (string | null)[]) {
  const list = [...new Set(ids.filter((x): x is string => !!x))];
  if (list.length === 0) return new Map<string, string>();
  const rows = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, list));
  return new Map(rows.map((r) => [r.id, r.name]));
}

export function expenseOut(b: BusinessRow, e: ExpenseRow, extra: { attachmentCount?: number; createdByName?: string | null } = {}) {
  const cat = categoryName(b, e.categoryId);
  return {
    id: e.id, spentOn: e.spentOn, supplierId: e.supplierId, payee: e.payee, categoryId: e.categoryId,
    categoryName: cat.name, categoryOfficial: cat.official,
    gross: e.gross, vat: e.vat, bizPct: e.bizPct, businessShare: businessShare(e.gross, e.bizPct),
    method: e.method, chequeNumber: e.chequeNumber, chequeDate: e.chequeDate, chequeBank: e.chequeBank,
    note: e.note, monthlyCostId: e.monthlyCostId,
    attachmentCount: extra.attachmentCount ?? 0, createdByName: extra.createdByName ?? null,
    createdAt: e.createdAt.toISOString(),
  };
}

export async function expensesOut(db: Exec, b: BusinessRow, rows: ExpenseRow[]) {
  const counts = await attachmentCounts(db, b.id, "expense", rows.map((r) => r.id));
  const names = await userNames(db, rows.map((r) => r.createdBy));
  return rows.map((r) => expenseOut(b, r, { attachmentCount: counts.get(r.id) ?? 0, createdByName: r.createdBy ? names.get(r.createdBy) ?? null : null }));
}

/** Posts an expense to the ledger: business share to its category (or Spending to sort), VAT, personal share, money out. */
export async function postExpense(db: Exec, ctx: BizCtx, e: ExpenseRow) {
  const b = ctx.business;
  const code = e.categoryId ? categoryFor(b, e.categoryId).accountCode : UNCATEGORISED_CODE;
  return postEntry(db, {
    businessId: b.id, date: e.spentOn, memo: `${e.payee}${e.note ? ` · ${e.note}` : ""}`.slice(0, 300), sourceType: "expense", sourceId: e.id, createdBy: ctx.user.id,
    lines: posting.expense({ gross: e.gross, vat: e.vat, bizPct: e.bizPct, categoryCode: code, method: e.method, vatRegistered: b.vatRegistered }),
  });
}

/** Undoes an expense's entry (if it has one). */
export async function reverseExpense(db: Exec, ctx: BizCtx, e: ExpenseRow) {
  if (e.journalEntryId) await reverseEntry(db, ctx.business.id, e.journalEntryId, { createdBy: ctx.user.id });
}

/** Where a bill stands against today. */
export function billDue(bill: { status: string; dueDate: string }, now = today()) {
  if (bill.status === "paid") return "paid" as const;
  if (bill.status === "void") return "void" as const;
  if (bill.dueDate < now) return "overdue" as const;
  if (bill.dueDate <= addDays(now, 7)) return "due_soon" as const;
  return "due" as const;
}

export function daysTo(d: string, now = today()) {
  return Math.round((Date.parse(d + "T00:00:00Z") - Date.parse(now + "T00:00:00Z")) / 86400000);
}

export function billOut(bill: BillRow, extra: { supplierName: string; attachmentCount?: number; lastPaidOn?: string | null }) {
  return {
    id: bill.id, supplierId: bill.supplierId, supplierName: extra.supplierName, reference: bill.reference,
    billDate: bill.billDate, dueDate: bill.dueDate, description: bill.description,
    net: bill.net, vat: bill.vat, total: bill.total, paid: bill.paid, left: bill.status === "void" ? 0 : bill.total - bill.paid,
    status: bill.status, due: billDue(bill), daysToDue: daysTo(bill.dueDate), lastPaidOn: extra.lastPaidOn ?? null,
    attachmentCount: extra.attachmentCount ?? 0,
  };
}

/** VAT is only recorded separately by a VAT-registered business, and is always part of the amount. */
export function checkVat(b: BusinessRow, gross: number, vat: number, field = "vat") {
  if (vat > 0 && !b.vatRegistered) throw badRequest("Only VAT-registered businesses record VAT separately. Enter the full amount you paid.", { [field]: "Leave VAT at 0: you're not VAT registered" });
  if (vat >= gross) throw badRequest("The VAT must be less than the amount paid.", { [field]: "VAT must be less than the amount" });
}
