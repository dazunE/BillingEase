import { goingOut } from "@billingease/contracts";
import { addMonths, monthLabel, monthPeriod, today } from "@billingease/core";
import type { Exec } from "@billingease/db";
import { expenses, monthlyCosts, suppliers } from "@billingease/db/schema";
import { and, asc, between, eq, inArray } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { logActivity } from "../../lib/activity";
import type { BizCtx, BusinessRow } from "../../lib/context";
import { conflict, notFound } from "../../lib/errors";
import { route } from "../../lib/route";
import { createExpense, expenseValues } from "./expenses";
import { categoryFor, categoryName, checkMethod, checkVat, expenseOut, money, supplierOf } from "./shared";

type CostRow = typeof monthlyCosts.$inferSelect;

const dayIn = (monthFrom: string, day: number) => `${monthFrom.slice(0, 8)}${String(day).padStart(2, "0")}`;

/** Each cost with where it stands this month. */
export async function monthlyOut(db: Exec, b: BusinessRow, rows: CostRow[], now = today()) {
  const month = monthPeriod(now);
  const ids = rows.map((r) => r.id);
  const recorded = ids.length
    ? await db.select({ id: expenses.id, costId: expenses.monthlyCostId, spentOn: expenses.spentOn }).from(expenses)
      .where(and(eq(expenses.businessId, b.id), inArray(expenses.monthlyCostId, ids), between(expenses.spentOn, month.from, month.to)))
    : [];
  const supIds = [...new Set(rows.map((r) => r.supplierId).filter((x): x is string => !!x))];
  const sups = supIds.length ? await db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers).where(and(eq(suppliers.businessId, b.id), inArray(suppliers.id, supIds))) : [];
  const supName = new Map(sups.map((s) => [s.id, s.name]));
  return rows.map((r) => {
    const rec = recorded.find((x) => x.costId === r.id) ?? null;
    const dueOn = dayIn(month.from, r.dayOfMonth);
    const state = rec ? "recorded" as const : !r.active ? "paused" as const : now > dueOn ? "late" as const : "due" as const;
    const nextOn = rec || !r.active ? dayIn(addMonths(month.from, 1), r.dayOfMonth) : dueOn;
    return {
      id: r.id, name: r.name, supplierId: r.supplierId, supplierName: r.supplierId ? supName.get(r.supplierId) ?? null : null,
      categoryId: r.categoryId, categoryName: categoryName(b, r.categoryId).name ?? r.categoryId,
      amount: r.amount, vat: r.vat, method: r.method, dayOfMonth: r.dayOfMonth, active: r.active,
      state, dueOn, recordedOn: rec?.spentOn ?? null, recordedExpenseId: rec?.id ?? null, nextOn,
    };
  });
}

async function costRow(db: Exec, businessId: string, id: string) {
  const [c] = await db.select().from(monthlyCosts).where(and(eq(monthlyCosts.id, id), eq(monthlyCosts.businessId, businessId)));
  if (!c) throw notFound("That every-month cost");
  return c;
}

export async function monthlyRoutes(app: FastifyInstance) {
  route(app, goingOut.monthly, async ({ ctx }) => {
    const b = ctx.business;
    const rows = await ctx.db.select().from(monthlyCosts).where(eq(monthlyCosts.businessId, b.id)).orderBy(asc(monthlyCosts.dayOfMonth), asc(monthlyCosts.name));
    const costs = await monthlyOut(ctx.db, b, rows);
    const live = costs.filter((c) => c.active);
    const toPay = live.filter((c) => c.state !== "recorded");
    return {
      month: monthPeriod(today()),
      costs,
      totals: {
        perMonth: live.reduce((a, c) => a + c.amount, 0),
        recorded: costs.filter((c) => c.state === "recorded").reduce((a, c) => a + c.amount, 0),
        toPay: toPay.reduce((a, c) => a + c.amount, 0),
        toPayCount: toPay.length,
      },
    };
  });

  const values = async (ctx: BizCtx, body: { supplierId: string | null; categoryId: string; amount: number; vat: number; method: string }) => {
    const b = ctx.business;
    if (body.supplierId) await supplierOf(ctx.db, b.id, body.supplierId);
    categoryFor(b, body.categoryId);
    checkVat(b, body.amount, body.vat);
    return { method: checkMethod(b, body.method), vat: b.vatRegistered ? body.vat : 0 };
  };

  route(app, goingOut.createMonthly, async ({ body, ctx }) => {
    const v = await values(ctx, body);
    const [row] = await ctx.db.insert(monthlyCosts).values({ ...body, ...v, businessId: ctx.business.id }).returning();
    await logActivity(ctx.db, ctx.business.id, `Every-month cost ${row.name} (${money(ctx.business, row.amount)}) set up`, { actorId: ctx.user.id, link: "/app/out/monthly" });
    return (await monthlyOut(ctx.db, ctx.business, [row]))[0];
  });

  route(app, goingOut.updateMonthly, async ({ params, body, ctx }) => {
    await costRow(ctx.db, ctx.business.id, params.id);
    const v = await values(ctx, body);
    const [row] = await ctx.db.update(monthlyCosts).set({ ...body, ...v }).where(and(eq(monthlyCosts.id, params.id), eq(monthlyCosts.businessId, ctx.business.id))).returning();
    return (await monthlyOut(ctx.db, ctx.business, [row]))[0];
  });

  route(app, goingOut.pauseMonthly, async ({ params, body, ctx }) => {
    const c = await costRow(ctx.db, ctx.business.id, params.id);
    const [row] = await ctx.db.update(monthlyCosts).set({ active: body.active }).where(and(eq(monthlyCosts.id, c.id), eq(monthlyCosts.businessId, ctx.business.id))).returning();
    await logActivity(ctx.db, ctx.business.id, `Every-month cost ${row.name} ${body.active ? "resumed" : "paused"}`, { actorId: ctx.user.id, link: "/app/out/monthly" });
    return (await monthlyOut(ctx.db, ctx.business, [row]))[0];
  });

  route(app, goingOut.deleteMonthly, async ({ params, ctx }) => {
    const c = await costRow(ctx.db, ctx.business.id, params.id);
    // Expenses already recorded from it stay in the books.
    await ctx.db.delete(monthlyCosts).where(and(eq(monthlyCosts.id, c.id), eq(monthlyCosts.businessId, ctx.business.id)));
    await logActivity(ctx.db, ctx.business.id, `Every-month cost ${c.name} stopped`, { actorId: ctx.user.id });
    return { ok: true as const };
  });

  route(app, goingOut.recordMonthly, async ({ params, body, ctx }) => {
    const b = ctx.business;
    const c = await costRow(ctx.db, b.id, params.id);
    const month = monthPeriod(body.spentOn);
    const [already] = await ctx.db.select({ id: expenses.id }).from(expenses)
      .where(and(eq(expenses.businessId, b.id), eq(expenses.monthlyCostId, c.id), between(expenses.spentOn, month.from, month.to))).limit(1);
    if (already) throw conflict(`${c.name} is already recorded for ${monthLabel(body.spentOn)}.`);
    const gross = body.gross ?? c.amount;
    const v = await expenseValues(ctx.db, ctx, {
      spentOn: body.spentOn, supplierId: c.supplierId, payee: c.supplierId ? null : c.name, categoryId: c.categoryId,
      gross, vat: gross === c.amount ? c.vat : 0, bizPct: 100, method: body.method ?? c.method,
      chequeNumber: body.chequeNumber, chequeDate: body.chequeDate, chequeBank: body.chequeBank,
      note: c.supplierId ? `${c.name}, ${monthLabel(body.spentOn)}` : monthLabel(body.spentOn),
    });
    const row = await ctx.db.transaction((tx) => createExpense(tx, ctx, v, { monthlyCostId: c.id }));
    return expenseOut(b, row, { createdByName: ctx.user.name });
  });
}
