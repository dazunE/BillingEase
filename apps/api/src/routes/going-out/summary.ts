import { goingOut as goingOutApi } from "@billingease/contracts";
import { addDays, formatDate, periodsFor, today, type PeriodKey } from "@billingease/core";
import { billPayments, bills, expenses, monthlyCosts, suppliers } from "@billingease/db/schema";
import { and, between, eq, gte, inArray, isNull, lt, lte, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { BizCtx } from "../../lib/context";
import { route } from "../../lib/route";
import { goingOut } from "../../services/summary";
import { monthlyOut } from "./monthly";
import { billDue, businessShare, categoryName, money } from "./shared";

function periodOf(ctx: BizCtx, key?: PeriodKey) {
  const b = ctx.business;
  const now = today();
  const all = periodsFor({ country: b.country, quarterType: b.quarterType }, now);
  const keys: PeriodKey[] = b.country === "uk" ? ["month", "quarter", "year"] : ["month", "year"];
  const k = key && keys.includes(key) ? key : all.default;
  return { now, key: k, period: all[k], periods: keys.map((x) => ({ key: x, label: all[x].label })) };
}

const count = (v: unknown) => Number(v ?? 0);

export async function summaryRoutes(app: FastifyInstance) {
  route(app, goingOutApi.summary, async ({ query, ctx }) => {
    const b = ctx.business;
    const { now, key, period, periods } = periodOf(ctx, query.period);
    const g = await goingOut(ctx.db, b.id, period.from, period.to, now);
    const [unc] = await ctx.db.select({ n: sql<string>`count(*)` }).from(expenses).where(and(eq(expenses.businessId, b.id), isNull(expenses.categoryId)));
    const open = and(eq(bills.businessId, b.id), inArray(bills.status, ["unpaid", "part_paid"]));
    const [soon] = await ctx.db.select({ n: sql<string>`count(*)` }).from(bills).where(and(open, gte(bills.dueDate, now), lte(bills.dueDate, addDays(now, 7))));
    const [late] = await ctx.db.select({ n: sql<string>`count(*)` }).from(bills).where(and(open, lt(bills.dueDate, now)));
    const [openAll] = await ctx.db.select({ n: sql<string>`count(*)`, sum: sql<string>`coalesce(sum(${bills.total} - ${bills.paid}), 0)` }).from(bills).where(open);
    const [sup] = await ctx.db.select({ n: sql<string>`count(*)` }).from(suppliers).where(and(eq(suppliers.businessId, b.id), isNull(suppliers.archivedAt)));
    const costs = await monthlyOut(ctx.db, b, await ctx.db.select().from(monthlyCosts).where(eq(monthlyCosts.businessId, b.id)), now);
    return {
      today: now,
      period: { key, from: period.from, to: period.to, label: period.label },
      periods,
      ...g,
      needs: { uncategorised: count(unc.n), dueSoonBills: count(soon.n), overdueBills: count(late.n) },
      counts: {
        suppliers: count(sup.n), openBills: count(openAll.n), openBillsTotal: count(openAll.sum),
        monthlyCosts: costs.filter((c) => c.active).length,
        monthlyToPay: costs.filter((c) => c.state === "due" || c.state === "late").reduce((a, c) => a + c.amount, 0),
      },
    };
  });

  route(app, goingOutApi.moneyOut, async ({ query, ctx }) => {
    const b = ctx.business;
    const { now, period } = periodOf(ctx, query.period);
    const ex = await ctx.db.select().from(expenses).where(and(eq(expenses.businessId, b.id), between(expenses.spentOn, period.from, period.to)));
    const pays = await ctx.db.select({ p: billPayments, bill: bills, supplier: suppliers.name }).from(billPayments)
      .innerJoin(bills, eq(bills.id, billPayments.billId)).innerJoin(suppliers, eq(suppliers.id, bills.supplierId))
      .where(and(eq(billPayments.businessId, b.id), isNull(billPayments.voidedAt), between(billPayments.paidOn, period.from, period.to)));
    const openBills = await ctx.db.select({ bill: bills, supplier: suppliers.name }).from(bills).innerJoin(suppliers, eq(suppliers.id, bills.supplierId))
      .where(and(eq(bills.businessId, b.id), inArray(bills.status, ["unpaid", "part_paid"])));
    const costs = await monthlyOut(ctx.db, b, await ctx.db.select().from(monthlyCosts).where(eq(monthlyCosts.businessId, b.id)), now);
    const base = { billId: null, monthlyCostId: null, uncategorised: false, due: null };
    const paid = [
      ...ex.map((e) => ({
        ...base, kind: "expense" as const, id: e.id, date: e.spentOn, name: e.payee,
        detail: [categoryName(b, e.categoryId).name ?? "To sort", e.chequeNumber ? `Cheque ${e.chequeNumber}` : e.method, e.bizPct < 100 ? `${e.bizPct}% business` : null].filter(Boolean).join(" · "),
        amount: businessShare(e.gross, e.bizPct), href: `/app/out/expenses/${e.id}`, uncategorised: !e.categoryId,
      })),
      ...pays.map(({ p, bill, supplier }) => ({
        ...base, kind: "bill_payment" as const, id: p.id, date: p.paidOn, name: supplier,
        detail: [`Bill${bill.reference ? ` ${bill.reference}` : ""}`, p.chequeNumber ? `Cheque ${p.chequeNumber}` : p.method].join(" · "),
        amount: p.amount, href: `/app/out/bills/${bill.id}`, billId: bill.id,
      })),
    ].sort((x, y) => y.date.localeCompare(x.date));
    const toPay = [
      ...openBills.map(({ bill, supplier }) => {
        const d = billDue(bill, now);
        return {
          ...base, kind: "bill" as const, id: bill.id, date: bill.dueDate, name: supplier,
          detail: `${bill.description}${bill.paid > 0 ? ` · ${money(b, bill.paid)} paid` : ""}`,
          amount: bill.total - bill.paid, href: `/app/out/bills/${bill.id}`, billId: bill.id,
          due: d === "overdue" || d === "due_soon" ? d : ("due" as const),
        };
      }),
      ...costs.filter((c) => c.state === "due" || c.state === "late").map((c) => ({
        ...base, kind: "monthly" as const, id: c.id, date: c.dueOn, name: c.name,
        detail: `Every month · ${c.categoryName} · ${c.method} · on ${formatDate(c.dueOn)}`,
        amount: c.amount, href: "/app/out/monthly", monthlyCostId: c.id, due: c.state === "late" ? ("late" as const) : ("due" as const),
      })),
    ].sort((x, y) => x.date.localeCompare(y.date));
    return { paid, toPay };
  });
}
