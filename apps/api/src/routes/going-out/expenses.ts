import { ExpenseBody, goingOut } from "@billingease/contracts";
import { formatDate } from "@billingease/core";
import type { Exec } from "@billingease/db";
import { attachments, expenses } from "@billingease/db/schema";
import { and, desc, eq, gte, isNull, lte, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { z } from "zod";
import { logActivity } from "../../lib/activity";
import type { BizCtx } from "../../lib/context";
import { badRequest, notFound } from "../../lib/errors";
import { route } from "../../lib/route";
import {
  categoryFor, checkMethod, checkVat, chequeFields, expenseOut, expensesOut, money, postExpense, reverseExpense,
  supplierByName, supplierOf, type ExpenseRow,
} from "./shared";

type Body = z.output<typeof ExpenseBody>;

/** Checks an expense against the business's country and settings, and works out its row. */
export async function expenseValues(db: Exec, ctx: BizCtx, body: Body) {
  const b = ctx.business;
  const method = checkMethod(b, body.method);
  if (body.categoryId) categoryFor(b, body.categoryId);
  checkVat(b, body.gross, body.vat);
  let supplierId: string | null = null;
  let payee = body.payee;
  if (body.supplierId) {
    const s = await supplierOf(db, b.id, body.supplierId);
    supplierId = s.id;
    payee = payee ?? s.name;
  } else if (payee) {
    supplierId = (await supplierByName(db, b.id, payee))?.id ?? null;
  }
  if (!payee) throw badRequest("Who did you pay?", { payee: "Who did you pay?" });
  return {
    spentOn: body.spentOn, supplierId, payee, categoryId: body.categoryId,
    gross: body.gross, vat: b.vatRegistered ? body.vat : 0,
    // Business use is a UK idea: in Sri Lanka the whole expense is the business's.
    bizPct: b.country === "uk" ? body.bizPct : 100,
    method, ...chequeFields(method, body, body.spentOn), note: body.note,
  };
}

export async function createExpense(tx: Exec, ctx: BizCtx, values: Awaited<ReturnType<typeof expenseValues>>, extra: { monthlyCostId?: string | null } = {}) {
  const [row] = await tx.insert(expenses).values({ ...values, businessId: ctx.business.id, monthlyCostId: extra.monthlyCostId ?? null, createdBy: ctx.user.id }).returning();
  const entryId = await postExpense(tx, ctx, row);
  const [done] = await tx.update(expenses).set({ journalEntryId: entryId }).where(eq(expenses.id, row.id)).returning();
  await logActivity(tx, ctx.business.id, `Expense ${money(ctx.business, row.gross)} to ${row.payee} recorded${row.categoryId ? "" : " (to sort)"}`, { actorId: ctx.user.id, link: `/app/out/expenses/${row.id}` });
  return done;
}

export async function expenseRow(db: Exec, businessId: string, id: string) {
  const [e] = await db.select().from(expenses).where(and(eq(expenses.id, id), eq(expenses.businessId, businessId)));
  if (!e) throw notFound("That expense");
  return e;
}

/** A change never edits the ledger: it reverses the old entry and posts a new one. */
async function rewrite(tx: Exec, ctx: BizCtx, old: ExpenseRow, next: Partial<ExpenseRow>) {
  await reverseExpense(tx, ctx, old);
  const [row] = await tx.update(expenses).set({ ...next, updatedAt: new Date() }).where(and(eq(expenses.id, old.id), eq(expenses.businessId, ctx.business.id))).returning();
  const entryId = await postExpense(tx, ctx, row);
  const [done] = await tx.update(expenses).set({ journalEntryId: entryId }).where(eq(expenses.id, row.id)).returning();
  return done;
}

export async function expenseRoutes(app: FastifyInstance) {
  route(app, goingOut.expenses, async ({ query, ctx }) => {
    const b = ctx.business;
    const where: (SQL | undefined)[] = [eq(expenses.businessId, b.id)];
    if (query.from) where.push(gte(expenses.spentOn, query.from));
    if (query.to) where.push(lte(expenses.spentOn, query.to));
    if (query.category) where.push(eq(expenses.categoryId, query.category));
    if (query.uncategorised === "true") where.push(isNull(expenses.categoryId));
    if (query.supplierId) where.push(eq(expenses.supplierId, query.supplierId));
    const rows = await ctx.db.select().from(expenses).where(and(...where)).orderBy(desc(expenses.spentOn), desc(expenses.createdAt)).limit(query.limit ?? 500);
    const list = await expensesOut(ctx.db, b, rows);
    return {
      expenses: list,
      totals: {
        count: list.length,
        gross: list.reduce((a, e) => a + e.gross, 0),
        vat: list.reduce((a, e) => a + e.vat, 0),
        businessShare: list.reduce((a, e) => a + e.businessShare, 0),
      },
    };
  });

  route(app, goingOut.expense, async ({ params, ctx }) => {
    const e = await expenseRow(ctx.db, ctx.business.id, params.id);
    const [out] = await expensesOut(ctx.db, ctx.business, [e]);
    const files = await ctx.db.select().from(attachments)
      .where(and(eq(attachments.businessId, ctx.business.id), eq(attachments.ownerType, "expense"), eq(attachments.ownerId, e.id))).orderBy(attachments.createdAt);
    return { expense: out, attachments: files.map((f) => ({ ...f, ownerType: "expense" as const, createdAt: f.createdAt.toISOString() })) };
  });

  route(app, goingOut.createExpense, async ({ body, ctx }) => {
    const values = await expenseValues(ctx.db, ctx, body);
    const row = await ctx.db.transaction((tx) => createExpense(tx, ctx, values));
    return expenseOut(ctx.business, row, { createdByName: ctx.user.name });
  });

  route(app, goingOut.updateExpense, async ({ params, body, ctx }) => {
    const old = await expenseRow(ctx.db, ctx.business.id, params.id);
    const values = await expenseValues(ctx.db, ctx, body);
    const row = await ctx.db.transaction(async (tx) => {
      const done = await rewrite(tx, ctx, old, values);
      await logActivity(tx, ctx.business.id, `Expense to ${done.payee} on ${formatDate(done.spentOn)} changed`, { actorId: ctx.user.id, link: `/app/out/expenses/${done.id}` });
      return done;
    });
    const [out] = await expensesOut(ctx.db, ctx.business, [row]);
    return out;
  });

  route(app, goingOut.categoriseExpense, async ({ params, body, ctx }) => {
    const b = ctx.business;
    const old = await expenseRow(ctx.db, b.id, params.id);
    const cat = categoryFor(b, body.categoryId);
    const bizPct = b.country === "uk" ? body.bizPct ?? old.bizPct : 100;
    const row = await ctx.db.transaction(async (tx) => {
      const done = await rewrite(tx, ctx, old, { categoryId: cat.id, bizPct });
      await logActivity(tx, b.id, `${done.payee} ${money(b, done.gross)} sorted into ${cat.name}`, { actorId: ctx.user.id, link: `/app/out/expenses/${done.id}` });
      return done;
    });
    const [out] = await expensesOut(ctx.db, b, [row]);
    return out;
  });

  route(app, goingOut.deleteExpense, async ({ params, ctx }) => {
    const e = await expenseRow(ctx.db, ctx.business.id, params.id);
    const keys = await ctx.db.transaction(async (tx) => {
      await reverseExpense(tx, ctx, e);
      const files = await tx.delete(attachments)
        .where(and(eq(attachments.businessId, ctx.business.id), eq(attachments.ownerType, "expense"), eq(attachments.ownerId, e.id))).returning({ key: attachments.storageKey });
      await tx.delete(expenses).where(and(eq(expenses.id, e.id), eq(expenses.businessId, ctx.business.id)));
      await logActivity(tx, ctx.business.id, `Expense ${money(ctx.business, e.gross)} to ${e.payee} on ${formatDate(e.spentOn)} deleted`, { actorId: ctx.user.id });
      return files.map((f) => f.key);
    });
    for (const k of keys) await ctx.services.storage.remove(k).catch(() => {});
    return { ok: true as const };
  });
}
