import { goingOut } from "@billingease/contracts";
import { rulesFor, today } from "@billingease/core";
import type { Exec } from "@billingease/db";
import { billPayments, bills, expenses, monthlyCosts, suppliers } from "@billingease/db/schema";
import { and, asc, between, desc, eq, ilike, inArray, isNotNull, isNull, ne, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { logActivity } from "../../lib/activity";
import type { BusinessRow } from "../../lib/context";
import { conflict } from "../../lib/errors";
import { route } from "../../lib/route";
import { billOut, categoryFor, categoryName, expensesOut, supplierOf } from "./shared";
import { monthlyOut } from "./monthly";

type SupplierRow = typeof suppliers.$inferSelect;

/** Paid this tax year and still owed, per supplier. */
async function supplierStats(db: Exec, b: BusinessRow, ids: string[]) {
  const stats = new Map<string, { paid: number; owed: number; open: number }>();
  if (ids.length === 0) return stats;
  const year = rulesFor(b.country).taxYearOf(today());
  const get = (id: string) => stats.get(id) ?? stats.set(id, { paid: 0, owed: 0, open: 0 }).get(id)!;
  const ex = await db.select({ id: expenses.supplierId, sum: sql<string>`sum(${expenses.gross})` }).from(expenses)
    .where(and(eq(expenses.businessId, b.id), inArray(expenses.supplierId, ids), between(expenses.spentOn, year.from, year.to))).groupBy(expenses.supplierId);
  for (const r of ex) if (r.id) get(r.id).paid += Number(r.sum);
  const pay = await db.select({ id: bills.supplierId, sum: sql<string>`sum(${billPayments.amount})` }).from(billPayments)
    .innerJoin(bills, eq(bills.id, billPayments.billId))
    .where(and(eq(billPayments.businessId, b.id), inArray(bills.supplierId, ids), isNull(billPayments.voidedAt), between(billPayments.paidOn, year.from, year.to))).groupBy(bills.supplierId);
  for (const r of pay) get(r.id).paid += Number(r.sum);
  const owed = await db.select({ id: bills.supplierId, sum: sql<string>`sum(${bills.total} - ${bills.paid})`, n: sql<string>`count(*)` }).from(bills)
    .where(and(eq(bills.businessId, b.id), inArray(bills.supplierId, ids), ne(bills.status, "void"), ne(bills.status, "paid"))).groupBy(bills.supplierId);
  for (const r of owed) Object.assign(get(r.id), { owed: Number(r.sum), open: Number(r.n) });
  return stats;
}

function supplierOut(b: BusinessRow, s: SupplierRow, st?: { paid: number; owed: number; open: number }) {
  return {
    id: s.id, name: s.name, contactName: s.contactName, email: s.email, phone: s.phone, address: s.address, vatNumber: s.vatNumber,
    defaultCategoryId: s.defaultCategoryId, defaultCategoryName: categoryName(b, s.defaultCategoryId).name, notes: s.notes,
    archived: !!s.archivedAt, paidThisYear: st?.paid ?? 0, owed: st?.owed ?? 0, openBills: st?.open ?? 0,
  };
}

export async function supplierRoutes(app: FastifyInstance) {
  route(app, goingOut.suppliers, async ({ query, ctx }) => {
    const b = ctx.business;
    const rows = await ctx.db.select().from(suppliers).where(and(
      eq(suppliers.businessId, b.id),
      query.archived === "true" ? isNotNull(suppliers.archivedAt) : isNull(suppliers.archivedAt),
      query.q ? ilike(suppliers.name, `%${query.q.replace(/[%_\\]/g, "\\$&")}%`) : undefined,
    )).orderBy(asc(suppliers.name));
    const stats = await supplierStats(ctx.db, b, rows.map((r) => r.id));
    const list = rows.map((r) => supplierOut(b, r, stats.get(r.id))).sort((x, y) => y.paidThisYear - x.paidThisYear || x.name.localeCompare(y.name));
    return {
      suppliers: list,
      taxYear: rulesFor(b.country).taxYearOf(today()).label,
      paidThisYear: list.reduce((a, s) => a + s.paidThisYear, 0),
      owed: list.reduce((a, s) => a + s.owed, 0),
      openBills: list.reduce((a, s) => a + s.openBills, 0),
    };
  });

  route(app, goingOut.supplier, async ({ params, ctx }) => {
    const b = ctx.business;
    const s = await supplierOf(ctx.db, b.id, params.id);
    const stats = await supplierStats(ctx.db, b, [s.id]);
    const ex = await ctx.db.select().from(expenses).where(and(eq(expenses.businessId, b.id), eq(expenses.supplierId, s.id))).orderBy(desc(expenses.spentOn)).limit(200);
    const billRows = await ctx.db.select().from(bills).where(and(eq(bills.businessId, b.id), eq(bills.supplierId, s.id))).orderBy(desc(bills.billDate));
    const pays = await ctx.db.select({ p: billPayments, ref: bills.reference }).from(billPayments).innerJoin(bills, eq(bills.id, billPayments.billId))
      .where(and(eq(billPayments.businessId, b.id), eq(bills.supplierId, s.id), isNull(billPayments.voidedAt))).orderBy(desc(billPayments.paidOn));
    const costs = await ctx.db.select().from(monthlyCosts).where(and(eq(monthlyCosts.businessId, b.id), eq(monthlyCosts.supplierId, s.id)));
    return {
      supplier: supplierOut(b, s, stats.get(s.id)),
      expenses: await expensesOut(ctx.db, b, ex),
      bills: billRows.map((x) => billOut(x, { supplierName: s.name })),
      payments: pays.map(({ p, ref }) => ({ id: p.id, billId: p.billId, billReference: ref, amount: p.amount, paidOn: p.paidOn, method: p.method, chequeNumber: p.chequeNumber, chequeDate: p.chequeDate, chequeBank: p.chequeBank, reference: p.reference })),
      monthlyCosts: await monthlyOut(ctx.db, b, costs),
      taxYear: rulesFor(b.country).taxYearOf(today()).label,
    };
  });

  route(app, goingOut.createSupplier, async ({ body, ctx }) => {
    const b = ctx.business;
    if (body.defaultCategoryId) categoryFor(b, body.defaultCategoryId, "defaultCategoryId");
    const [row] = await ctx.db.insert(suppliers).values({ ...body, businessId: b.id }).returning();
    await logActivity(ctx.db, b.id, `Supplier ${row.name} added`, { actorId: ctx.user.id, link: `/app/out/suppliers/${row.id}` });
    return supplierOut(b, row);
  });

  route(app, goingOut.updateSupplier, async ({ params, body, ctx }) => {
    const b = ctx.business;
    await supplierOf(ctx.db, b.id, params.id);
    if (body.defaultCategoryId) categoryFor(b, body.defaultCategoryId, "defaultCategoryId");
    const [row] = await ctx.db.update(suppliers).set(body).where(and(eq(suppliers.id, params.id), eq(suppliers.businessId, b.id))).returning();
    const stats = await supplierStats(ctx.db, b, [row.id]);
    return supplierOut(b, row, stats.get(row.id));
  });

  route(app, goingOut.archiveSupplier, async ({ params, body, ctx }) => {
    const b = ctx.business;
    const s = await supplierOf(ctx.db, b.id, params.id);
    const stats = await supplierStats(ctx.db, b, [s.id]);
    if (body.archived && (stats.get(s.id)?.open ?? 0) > 0) throw conflict(`${s.name} still has bills to pay. Mark them paid first.`);
    const [row] = await ctx.db.update(suppliers).set({ archivedAt: body.archived ? new Date() : null }).where(and(eq(suppliers.id, s.id), eq(suppliers.businessId, b.id))).returning();
    await logActivity(ctx.db, b.id, `Supplier ${row.name} ${body.archived ? "archived" : "brought back"}`, { actorId: ctx.user.id, link: `/app/out/suppliers/${row.id}` });
    return supplierOut(b, row, stats.get(row.id));
  });
}
