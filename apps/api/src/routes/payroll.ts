import { payroll, type PayLine, type PayRun } from "@billingease/contracts";
import { addMonths, daysBetween, dueAccount, lastWorkingDay, lkPay, moneyAccountFor, monthLabel, PAYROLL_RULES, payrollDues, payrollPosting, rulesFor, today, ukLine } from "@billingease/core";
import { postEntry } from "@billingease/db";
import { accounts, employees, payRunLines, payRuns, payrollDues as duesTable, users } from "@billingease/db/schema";
import { and, asc, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { logActivity } from "../lib/activity";
import type { BizCtx } from "../lib/context";
import { AppError, badRequest, notFound } from "../lib/errors";
import { route } from "../lib/route";

type Exec = import("@billingease/db").Exec;
type RunRow = typeof payRuns.$inferSelect;
type LineRow = typeof payRunLines.$inferSelect;
type DueRow = typeof duesTable.$inferSelect;

const empOut = (e: typeof employees.$inferSelect) => ({
  id: e.id, name: e.name, job: e.job, startedOn: e.startedOn, endedOn: e.endedOn, idNumber: e.idNumber, epfNumber: e.epfNumber,
  taxCode: e.taxCode, basic: e.basic, allowances: e.allowances, pension: e.pension, bankDetails: e.bankDetails,
  bankName: e.bankName, bankBranch: e.bankBranch, bankAccount: e.bankAccount,
});

const lineOut = (l: LineRow): PayLine => ({
  id: l.id, employeeId: l.employeeId, name: l.name, job: l.job, basic: l.basic, allowances: l.allowances, overtime: l.overtime, gross: l.gross,
  epfBase: l.epfBase, epfEe: l.epfEe, epfEr: l.epfEr, etf: l.etf, apit: l.apit, paye: l.paye, eeNi: l.eeNi, erNi: l.erNi, pensionEe: l.pensionEe, pensionEr: l.pensionEr, net: l.net,
});

const KEYS = ["epfEe", "epfEr", "etf", "apit", "paye", "eeNi", "erNi", "pensionEe", "pensionEr", "gross", "net"] as const;
function totals(lines: LineRow[]) {
  const t = Object.fromEntries(KEYS.map((k) => [k, lines.reduce((a, l) => a + l[k], 0)])) as Record<(typeof KEYS)[number], number>;
  const employer = t.epfEr + t.etf + t.erNi + t.pensionEr;
  return { ...t, employer, cost: t.gross + employer };
}

const dueOut = (d: DueRow, month: string, t: string) => ({
  id: d.id, runId: d.runId, month, kind: d.kind, label: d.label, payTo: d.payTo, amount: d.amount, dueOn: d.dueOn,
  daysToDue: daysBetween(t, d.dueOn), paidOn: d.paidOn, reference: d.reference,
});

function runOut(run: RunRow, lines: LineRow[], dues: DueRow[], approver: string | null): PayRun {
  const t = totals(lines);
  return {
    id: run.id, month: run.month, label: `${monthLabel(run.month + "-01")} payroll`, payDate: run.payDate, status: run.status,
    approvedBy: approver, approvedAt: run.approvedAt?.toISOString() ?? null, people: lines.length,
    ...t, settled: run.status === "approved" && dues.every((d) => !!d.paidOn),
  };
}

async function detail(ctx: BizCtx, id: string) {
  const [run] = await ctx.db.select().from(payRuns).where(and(eq(payRuns.id, id), eq(payRuns.businessId, ctx.business.id)));
  if (!run) throw notFound("That pay run");
  const lines = await ctx.db.select().from(payRunLines).where(eq(payRunLines.runId, run.id)).orderBy(asc(payRunLines.name));
  const dues = await ctx.db.select().from(duesTable).where(eq(duesTable.runId, run.id)).orderBy(asc(duesTable.dueOn), asc(duesTable.kind));
  const [by] = run.approvedBy ? await ctx.db.select({ name: users.name }).from(users).where(eq(users.id, run.approvedBy)) : [];
  const t = today();
  return { ...runOut(run, lines, dues, by?.name ?? null), lines: lines.map(lineOut), dues: dues.map((d) => dueOut(d, run.month, t)) };
}

/** Works each person's line out (Sri Lanka) or takes the software's figures (UK). */
async function buildLines(ctx: BizCtx, body: { lines: { employeeId: string; overtime: number; gross: number; paye: number; eeNi: number; erNi: number; pensionEe: number; pensionEr: number }[] }) {
  const ids = [...new Set(body.lines.map((l) => l.employeeId))];
  if (ids.length !== body.lines.length) throw badRequest("Each person can only be on a run once.");
  const people = await ctx.db.select().from(employees).where(and(eq(employees.businessId, ctx.business.id), inArray(employees.id, ids)));
  if (people.length !== ids.length) throw badRequest("Someone on the run isn't on your payroll.");
  const byId = new Map(people.map((p) => [p.id, p]));
  const lk = ctx.business.country === "lk";
  return body.lines.map((l) => {
    const e = byId.get(l.employeeId)!;
    const base = { employeeId: e.id, name: e.name, job: e.job };
    if (lk) {
      const p = lkPay({ basic: e.basic, allowances: e.allowances }, l.overtime);
      return { ...base, ...p, paye: 0, eeNi: 0, erNi: 0, pensionEe: 0, pensionEr: 0 };
    }
    if (l.gross <= 0) throw badRequest(`Enter ${e.name}'s gross pay.`, { gross: "More than 0" });
    const u = ukLine({ gross: l.gross, paye: l.paye, eeNi: l.eeNi, erNi: l.erNi, pensionEe: l.pensionEe, pensionEr: l.pensionEr });
    if (u.net < 0) throw badRequest(`${e.name}'s deductions are more than their gross pay.`);
    return { ...base, basic: 0, allowances: 0, overtime: 0, epfBase: 0, epfEe: 0, epfEr: 0, etf: 0, apit: 0, ...u };
  });
}

async function saveLines(db: Exec, ctx: BizCtx, runId: string, lines: Awaited<ReturnType<typeof buildLines>>) {
  await db.delete(payRunLines).where(eq(payRunLines.runId, runId));
  await db.insert(payRunLines).values(lines.map((l) => ({ ...l, runId, businessId: ctx.business.id })));
  const gross = lines.reduce((a, l) => a + l.gross, 0), net = lines.reduce((a, l) => a + l.net, 0);
  const employer = lines.reduce((a, l) => a + l.epfEr + l.etf + l.erNi + l.pensionEr, 0);
  await db.update(payRuns).set({ gross, net, employer }).where(eq(payRuns.id, runId));
}

export async function payrollRoutes(app: FastifyInstance) {
  route(app, payroll.overview, async ({ ctx }) => {
    const b = ctx.business;
    const t = today();
    const lk = b.country === "lk";
    const emps = await ctx.db.select().from(employees).where(eq(employees.businessId, b.id)).orderBy(asc(employees.name));
    const runs = await ctx.db.select().from(payRuns).where(eq(payRuns.businessId, b.id)).orderBy(desc(payRuns.month));
    const runIds = runs.map((r) => r.id);
    const lines = runIds.length ? await ctx.db.select().from(payRunLines).where(inArray(payRunLines.runId, runIds)) : [];
    const dues = runIds.length ? await ctx.db.select().from(duesTable).where(inArray(duesTable.runId, runIds)).orderBy(asc(duesTable.dueOn)) : [];
    const monthOf = new Map(runs.map((r) => [r.id, r.month]));
    const out = runs.map((r) => runOut(r, lines.filter((l) => l.runId === r.id), dues.filter((d) => d.runId === r.id), null));
    // The month to run next: this month, unless it's already run.
    const thisMonth = t.slice(0, 7);
    const has = new Set(runs.map((r) => r.month));
    const next = has.has(thisMonth) && runs.find((r) => r.month === thisMonth)?.status === "approved" ? addMonths(thisMonth + "-01", 1).slice(0, 7) : thisMonth;
    const year = rulesFor(b.country).taxYearOf(t);
    const ytdRuns = new Set(runs.filter((r) => r.status === "approved" && r.payDate >= year.from && r.payDate <= year.to).map((r) => r.id));
    const ytd = lines.filter((l) => ytdRuns.has(l.runId));
    const byPerson = new Map<string, { employeeId: string; name: string; gross: number; tax: number }>();
    for (const l of ytd) {
      const p = byPerson.get(l.employeeId) ?? { employeeId: l.employeeId, name: l.name, gross: 0, tax: 0 };
      p.gross += l.gross; p.tax += l.apit + l.paye;
      byPerson.set(l.employeeId, p);
    }
    return {
      mode: lk ? "full" as const : "records" as const,
      verified: lk ? PAYROLL_RULES.lk.verified : PAYROLL_RULES.uk.verified,
      employees: emps.map(empOut),
      runs: out,
      open: dues.filter((d) => !d.paidOn).map((d) => dueOut(d, monthOf.get(d.runId)!, t)),
      next: { month: next, label: monthLabel(next + "-01"), payDate: lastWorkingDay(next + "-01"), exists: has.has(next) },
      yearToDate: {
        label: year.label,
        gross: ytd.reduce((a, l) => a + l.gross, 0), net: ytd.reduce((a, l) => a + l.net, 0),
        apit: ytd.reduce((a, l) => a + l.apit, 0), paye: ytd.reduce((a, l) => a + l.paye, 0),
        byPerson: [...byPerson.values()].sort((a, c) => a.name.localeCompare(c.name)),
      },
    };
  });

  route(app, payroll.createEmployee, async ({ body, ctx }) => {
    const [row] = await ctx.db.insert(employees).values({ ...body, businessId: ctx.business.id }).returning();
    await logActivity(ctx.db, ctx.business.id, `${row.name} added to payroll`, { actorId: ctx.user.id, link: "/app/out/payroll" });
    return empOut(row);
  });

  route(app, payroll.updateEmployee, async ({ params, body, ctx }) => {
    const [row] = await ctx.db.update(employees).set(body).where(and(eq(employees.id, params.id), eq(employees.businessId, ctx.business.id))).returning();
    if (!row) throw notFound("That person");
    return empOut(row);
  });

  route(app, payroll.run, ({ params, ctx }) => detail(ctx, params.id));

  route(app, payroll.schedules, async ({ params, ctx }) => {
    const b = ctx.business;
    if (b.country !== "lk") throw new AppError(404, "not_here", "EPF, ETF and APIT schedules are for Sri Lankan payroll.");
    const [run] = await ctx.db.select().from(payRuns).where(and(eq(payRuns.id, params.id), eq(payRuns.businessId, b.id)));
    if (!run) throw notFound("That pay run");
    if (run.status !== "approved") throw badRequest("Approve the run first. The schedules come from its approved figures.");
    const lines = await ctx.db.select().from(payRunLines).where(eq(payRunLines.runId, run.id)).orderBy(asc(payRunLines.name));
    const people = lines.length ? await ctx.db.select().from(employees).where(inArray(employees.id, lines.map((l) => l.employeeId))) : [];
    const emp = new Map(people.map((p) => [p.id, p]));
    // APIT deducted so far in the year of assessment, from approved runs paid up to this one.
    const year = rulesFor(b.country).taxYearOf(run.payDate);
    const yearRuns = await ctx.db.select({ id: payRuns.id }).from(payRuns)
      .where(and(eq(payRuns.businessId, b.id), eq(payRuns.status, "approved"), gte(payRuns.payDate, year.from), lte(payRuns.payDate, run.payDate)));
    const yearLines = await ctx.db.select({ employeeId: payRunLines.employeeId, apit: payRunLines.apit }).from(payRunLines).where(inArray(payRunLines.runId, yearRuns.map((r) => r.id)));
    const apitYear = new Map<string, number>();
    for (const l of yearLines) apitYear.set(l.employeeId, (apitYear.get(l.employeeId) ?? 0) + l.apit);
    const dues = await ctx.db.select().from(duesTable).where(eq(duesTable.runId, run.id));
    const dueOn = (k: "epf" | "etf" | "apit") => dues.find((d) => d.kind === k)?.dueOn ?? null;
    const rows = lines.map((l) => {
      const e = emp.get(l.employeeId);
      return {
        employeeId: l.employeeId, name: l.name, nic: e?.idNumber ?? null, epfNumber: e?.epfNumber ?? null,
        bankName: e?.bankName ?? (e?.bankDetails || null), bankBranch: e?.bankBranch ?? null, bankAccount: e?.bankAccount ?? null,
        gross: l.gross, epfBase: l.epfBase, epfEe: l.epfEe, epfEr: l.epfEr, etf: l.etf, taxable: l.gross, apit: l.apit,
        apitYear: apitYear.get(l.employeeId) ?? l.apit, net: l.net,
      };
    });
    const sum = (k: "gross" | "epfBase" | "epfEe" | "epfEr" | "etf" | "taxable" | "apit" | "net") => rows.reduce((a, r) => a + r[k], 0);
    return {
      runId: run.id, month: run.month, label: monthLabel(run.month + "-01"), payDate: run.payDate,
      employer: { name: b.legalName || b.name, tin: b.taxId }, yearLabel: year.label,
      due: { epf: dueOn("epf"), etf: dueOn("etf"), apit: dueOn("apit") },
      payTo: PAYROLL_RULES.lk.payTo,
      rows,
      totals: { gross: sum("gross"), epfBase: sum("epfBase"), epfEe: sum("epfEe"), epfEr: sum("epfEr"), etf: sum("etf"), taxable: sum("taxable"), apit: sum("apit"), net: sum("net") },
    };
  });

  route(app, payroll.createRun, async ({ body, ctx }) => {
    const lines = await buildLines(ctx, body);
    const [exists] = await ctx.db.select({ id: payRuns.id }).from(payRuns).where(and(eq(payRuns.businessId, ctx.business.id), eq(payRuns.month, body.month)));
    if (exists) throw new AppError(409, "run_exists", `There's already a pay run for ${monthLabel(body.month + "-01")}.`);
    const id = await ctx.db.transaction(async (tx) => {
      const [run] = await tx.insert(payRuns).values({ businessId: ctx.business.id, month: body.month, payDate: body.payDate }).returning();
      await saveLines(tx, ctx, run.id, lines);
      return run.id;
    });
    return detail(ctx, id);
  });

  route(app, payroll.updateRun, async ({ params, body, ctx }) => {
    const [run] = await ctx.db.select().from(payRuns).where(and(eq(payRuns.id, params.id), eq(payRuns.businessId, ctx.business.id)));
    if (!run) throw notFound("That pay run");
    if (run.status !== "draft") throw badRequest("That run is approved. Its figures can't change.");
    if (body.month !== run.month) throw badRequest("A run's month can't change. Delete the draft and start again.");
    const lines = await buildLines(ctx, body);
    await ctx.db.transaction(async (tx) => {
      await tx.update(payRuns).set({ payDate: body.payDate }).where(eq(payRuns.id, run.id));
      await saveLines(tx, ctx, run.id, lines);
    });
    return detail(ctx, run.id);
  });

  route(app, payroll.deleteRun, async ({ params, ctx }) => {
    const [run] = await ctx.db.select().from(payRuns).where(and(eq(payRuns.id, params.id), eq(payRuns.businessId, ctx.business.id)));
    if (!run) throw notFound("That pay run");
    if (run.status !== "draft") throw badRequest("Only a draft can be deleted.");
    await ctx.db.delete(payRuns).where(eq(payRuns.id, run.id));
    return { ok: true as const };
  });

  route(app, payroll.approveRun, async ({ params, ctx }) => {
    const b = ctx.business;
    const [run] = await ctx.db.select().from(payRuns).where(and(eq(payRuns.id, params.id), eq(payRuns.businessId, b.id)));
    if (!run) throw notFound("That pay run");
    if (run.status !== "draft") throw badRequest("That run is already approved.");
    const lines = await ctx.db.select().from(payRunLines).where(eq(payRunLines.runId, run.id));
    if (!lines.length) throw badRequest("Add at least one person to the run.");
    const t = totals(lines);
    const [staff] = await ctx.db.select({ code: accounts.code }).from(accounts).where(and(eq(accounts.businessId, b.id), eq(accounts.categoryId, "staff")));
    if (!staff) throw new AppError(500, "no_staff_account", "This business has no staff costs category.");
    const label = monthLabel(run.month + "-01");
    await ctx.db.transaction(async (tx) => {
      const entryId = await postEntry(tx, { businessId: b.id, date: run.payDate, memo: `${label} payroll`, sourceType: "payroll", sourceId: run.id, createdBy: ctx.user.id, lines: payrollPosting(staff.code, t) });
      await tx.update(payRuns).set({ status: "approved", entryId, approvedBy: ctx.user.id, approvedAt: new Date() }).where(eq(payRuns.id, run.id));
      const dues = payrollDues(b.country, run.month, run.payDate, t);
      if (dues.length) await tx.insert(duesTable).values(dues.map((d) => ({ businessId: b.id, runId: run.id, kind: d.kind, label: d.label, payTo: d.payTo, amount: d.amount, dueOn: d.due })));
      await logActivity(tx, b.id, `${label} payroll approved for ${lines.length} ${lines.length === 1 ? "person" : "people"}`, { actorId: ctx.user.id, link: `/app/out/payroll/${run.id}` });
    });
    return detail(ctx, run.id);
  });

  route(app, payroll.payDue, async ({ params, body, ctx }) => {
    const b = ctx.business;
    const [d] = await ctx.db.select({ due: duesTable, month: payRuns.month }).from(duesTable).innerJoin(payRuns, eq(payRuns.id, duesTable.runId))
      .where(and(eq(duesTable.id, params.id), eq(duesTable.businessId, b.id)));
    if (!d) throw notFound("That payment");
    if (d.due.paidOn) throw badRequest("That's already marked paid.");
    if (body.paidOn > today()) throw badRequest("The date it was paid can't be in the future.", { paidOn: "In the future" });
    const row = await ctx.db.transaction(async (tx) => {
      const entryId = await postEntry(tx, {
        businessId: b.id, date: body.paidOn, memo: `Paid: ${d.due.label}`, sourceType: "payroll_payment", sourceId: d.due.id, createdBy: ctx.user.id,
        lines: [{ code: dueAccount(d.due.kind), debit: d.due.amount }, { code: moneyAccountFor(body.method), credit: d.due.amount }],
      });
      const [r] = await tx.update(duesTable).set({ paidOn: body.paidOn, method: body.method, reference: body.reference, entryId })
        .where(and(eq(duesTable.id, d.due.id), isNull(duesTable.paidOn))).returning();
      await logActivity(tx, b.id, `${d.due.label} paid to ${d.due.payTo}`, { actorId: ctx.user.id, link: "/app/out/payroll" });
      return r;
    });
    return dueOut(row, d.month, today());
  });
}

