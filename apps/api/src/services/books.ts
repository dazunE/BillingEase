import type { AccountLine, BalanceSheet, PeriodLock, ProfitAndLoss, ReadyCheck } from "@billingease/contracts";
import { daysBetween, filingPeriods, formatDate, rulesFor, type FilingKind, type IsoDate, type TaxPeriod } from "@billingease/core";
import type { Exec } from "@billingease/db";
import { accounts, bankStatements, billLines, bills, expenses, invoices, journalEntries, journalLines, lockedPeriods, users } from "@billingease/db/schema";
import { and, asc, between, eq, gte, isNull, lte, ne, sql } from "drizzle-orm";
import type { BusinessRow } from "../lib/context";
import { vatFor } from "./home";
import { comingIn, goingOut } from "./summary";

const n = (v: unknown) => Number(v ?? 0);

/** Every account's debits and credits for entries dated from..to (from null: since the books began). */
async function totals(db: Exec, businessId: string, from: IsoDate | null, to: IsoDate) {
  const rows = await db
    .select({
      code: accounts.code, name: accounts.name, type: accounts.type, official: accounts.official, allowable: accounts.allowable, scope: accounts.scope,
      debit: sql<string>`coalesce(sum(${journalLines.debit}), 0)`,
      credit: sql<string>`coalesce(sum(${journalLines.credit}), 0)`,
    })
    .from(journalLines)
    .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
    .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
    .where(and(eq(journalLines.businessId, businessId), from ? sql`${journalEntries.entryDate} between ${from} and ${to}` : sql`${journalEntries.entryDate} <= ${to}`))
    .groupBy(accounts.code, accounts.name, accounts.type, accounts.official, accounts.allowable, accounts.scope)
    .orderBy(accounts.code);
  return rows.map((r) => ({ ...r, debit: n(r.debit), credit: n(r.credit) }));
}

const line = (r: Awaited<ReturnType<typeof totals>>[number], amount: number): AccountLine => ({
  code: r.code, name: r.name, official: r.official ?? null, allowable: r.allowable ?? null, scope: (r.scope as AccountLine["scope"]) ?? null, amount,
});

/** Profit and loss from the ledger: income and costs on the dates they were invoiced, billed or paid. */
export async function profitAndLoss(db: Exec, b: BusinessRow, from: IsoDate, to: IsoDate): Promise<ProfitAndLoss> {
  const rows = await totals(db, b.id, from, to);
  const income = rows.filter((r) => r.type === "income").map((r) => line(r, r.credit - r.debit)).filter((l) => l.amount !== 0);
  const exp = rows.filter((r) => r.type === "expense").map((r) => line(r, r.debit - r.credit)).filter((l) => l.amount !== 0);
  const totalIncome = income.reduce((a, l) => a + l.amount, 0);
  const totalExpenses = exp.reduce((a, l) => a + l.amount, 0);
  return {
    from, to, income, expenses: exp, totalIncome, totalExpenses, profit: totalIncome - totalExpenses,
    disallowed: exp.filter((l) => l.allowable === false).reduce((a, l) => a + l.amount, 0),
  };
}

/** What the business owns and owes on a date, from every entry up to it. */
export async function balanceSheet(db: Exec, b: BusinessRow, at: IsoDate): Promise<BalanceSheet> {
  const rows = await totals(db, b.id, null, at);
  const pick = (type: string, sign: 1 | -1) => rows.filter((r) => r.type === type).map((r) => ({ code: r.code, name: r.name, amount: sign * (r.debit - r.credit) })).filter((l) => l.amount !== 0);
  const assets = pick("asset", 1), liabilities = pick("liability", -1), equity = pick("equity", -1);
  const income = rows.filter((r) => r.type === "income").reduce((a, r) => a + r.credit - r.debit, 0);
  const spent = rows.filter((r) => r.type === "expense").reduce((a, r) => a + r.debit - r.credit, 0);
  const sum = (ls: { amount: number }[]) => ls.reduce((a, l) => a + l.amount, 0);
  const profitToDate = income - spent;
  return { at, assets, liabilities, equity, profitToDate, totalAssets: sum(assets), totalLiabilities: sum(liabilities), totalEquity: sum(equity) + profitToDate };
}

/** Costs by the country's categories for a period: the ledger's totals, and how many expenses and bill lines. */
export async function categoryTotals(db: Exec, b: BusinessRow, from: IsoDate, to: IsoDate) {
  const rows = await totals(db, b.id, from, to);
  const byCode = new Map(rows.map((r) => [r.code, r.debit - r.credit]));
  const cats = await db.select().from(accounts).where(and(eq(accounts.businessId, b.id), sql`${accounts.categoryId} is not null`)).orderBy(asc(accounts.code));
  const exp = await db.select({ cat: expenses.categoryId, c: sql<string>`count(*)` }).from(expenses)
    .where(and(eq(expenses.businessId, b.id), between(expenses.spentOn, from, to))).groupBy(expenses.categoryId);
  const bl = await db.select({ cat: billLines.categoryId, c: sql<string>`count(*)` }).from(billLines).innerJoin(bills, eq(bills.id, billLines.billId))
    .where(and(eq(bills.businessId, b.id), ne(bills.status, "void"), between(bills.billDate, from, to))).groupBy(billLines.categoryId);
  const count = new Map<string | null, number>();
  for (const r of [...exp, ...bl]) count.set(r.cat, (count.get(r.cat) ?? 0) + n(r.c));
  const [unc] = await db.select({ c: sql<string>`count(*)`, s: sql<string>`coalesce(sum(${expenses.gross} - ${expenses.vat}), 0)` }).from(expenses)
    .where(and(eq(expenses.businessId, b.id), isNull(expenses.categoryId), between(expenses.spentOn, from, to)));
  return {
    from, to,
    categories: cats.map((a) => ({
      categoryId: a.categoryId!, code: a.code, name: a.name, official: a.official ?? a.name, allowable: a.allowable ?? true,
      scope: (a.scope ?? "business") as "business" | "property", amount: byCode.get(a.code) ?? 0, count: count.get(a.categoryId) ?? 0,
    })),
    toSort: { count: n(unc.c), amount: n(unc.s) },
  };
}

async function locks(db: Exec, businessId: string): Promise<PeriodLock[]> {
  const rows = await db.select({ l: lockedPeriods, by: users.name }).from(lockedPeriods).leftJoin(users, eq(users.id, lockedPeriods.lockedBy))
    .where(eq(lockedPeriods.businessId, businessId)).orderBy(asc(lockedPeriods.fromDate));
  return rows.map(({ l, by }) => ({ from: l.fromDate, to: l.toDate, label: l.label, reference: l.reference, lockedAt: l.lockedAt.toISOString(), lockedBy: by }));
}

/** The lock that covers a whole period, if it's been sent. */
const lockFor = (all: PeriodLock[], p: { from: string; to: string }) => all.find((l) => l.from <= p.from && l.to >= p.to) ?? null;

function stateOf(p: { from: string; to: string }, lock: PeriodLock | null, today: IsoDate) {
  if (lock) return "sent" as const;
  if (p.from > today) return "upcoming" as const;
  if (p.to >= today) return "open" as const;
  return "closed" as const;
}

/** What has to be true before a period's figures go to the tax office. */
async function checks(db: Exec, b: BusinessRow, p: { from: string; to: string }, practitioner: string): Promise<ReadyCheck[]> {
  const [unc] = await db.select({ c: sql<string>`count(*)` }).from(expenses)
    .where(and(eq(expenses.businessId, b.id), isNull(expenses.categoryId), between(expenses.spentOn, p.from, p.to)));
  const [dr] = await db.select({ c: sql<string>`count(*)` }).from(invoices)
    .where(and(eq(invoices.businessId, b.id), eq(invoices.status, "draft"), between(invoices.issueDate, p.from, p.to)));
  const [st] = await db.select({ to: sql<string | null>`max(${bankStatements.periodTo})` }).from(bankStatements)
    .where(and(eq(bankStatements.businessId, b.id), eq(bankStatements.status, "done")));
  const u = n(unc.c), d = n(dr.c);
  const lastStatement = st?.to ? String(st.to).slice(0, 10) : null;
  return [
    { id: "categories", label: "Every cost has a category", ok: u === 0, href: u ? "/app/out?sort=1" : null,
      detail: u ? `${u} ${u === 1 ? "expense needs" : "expenses need"} a category so ${u === 1 ? "it lands" : "they land"} in the right box.` : "Each one is in a category your " + practitioner + " can send." },
    { id: "drafts", label: "No invoices left as drafts", ok: d === 0, href: d ? "/app/in/invoices?status=draft" : null,
      detail: d ? `${d} draft ${d === 1 ? "invoice is" : "invoices are"} dated in this period. Send or delete ${d === 1 ? "it" : "them"}.` : "Every invoice dated in this period has been sent." },
    { id: "bank", label: "Checked against your bank statement", ok: !!lastStatement && lastStatement >= p.to, href: "/app/statements",
      detail: lastStatement ? (lastStatement >= p.to ? `Your statements are checked to ${formatDate(lastStatement, { year: true })}.` : `Your last statement checked ends ${formatDate(lastStatement, { year: true })}. Upload one to ${formatDate(p.to, { year: true })}.`) : "Upload a statement that runs to the end of the period, and match it." },
  ];
}

const yearOf = (b: BusinessRow, date: IsoDate) => {
  const y = rulesFor(b.country).taxYearOf(date);
  return { label: y.label, from: y.from, to: y.to };
};

const currentOf = (ps: TaxPeriod[], today: IsoDate) => ps.find((p) => p.from <= today && p.to >= today)?.id ?? null;

export async function quarters(db: Exec, b: BusinessRow, date: IsoDate, today: IsoDate) {
  const rules = rulesFor(b.country);
  const ps = filingPeriods({ country: b.country, quarterType: b.quarterType }, "mtd", date);
  const all = await locks(db, b.id);
  const list = [];
  for (const p of ps) {
    const lock = lockFor(all, p);
    const state = stateOf(p, lock, today);
    const nums = state === "upcoming"
      ? { income: 0, expenses: 0 }
      : await Promise.all([comingIn(db, b.id, p.from, p.to, today), goingOut(db, b.id, p.from, p.to, today)]).then(([i, o]) => ({ income: i.total, expenses: o.total }));
    const cats = state === "upcoming" ? [] : (await profitAndLoss(db, b, p.from, p.to)).expenses;
    list.push({
      id: p.id, label: p.label, from: p.from, to: p.to, due: p.due, daysToDue: daysBetween(today, p.due), state, lock,
      checks: state === "upcoming" ? [] : await checks(db, b, p, rules.wording.practitionerNoun),
      income: nums.income, expenses: nums.expenses, profit: nums.income - nums.expenses, categories: cats,
    });
  }
  return { taxYear: yearOf(b, date), current: currentOf(ps, today), quarters: list };
}

export async function taxPeriods(db: Exec, b: BusinessRow, date: IsoDate, today: IsoDate) {
  const rules = rulesFor(b.country);
  const ps = filingPeriods({ country: b.country, quarterType: b.quarterType }, "vat", date);
  const all = await locks(db, b.id);
  const list = [];
  for (const p of ps) {
    const lock = lockFor(all, p);
    const state = stateOf(p, lock, today);
    const sign = sql`case when ${invoices.kind} = 'credit_note' then -1 else 1 end`;
    const [s] = await db.select({ net: sql<string>`coalesce(sum(${invoices.homeNet} * ${sign}), 0)` }).from(invoices)
      .where(and(eq(invoices.businessId, b.id), ne(invoices.status, "draft"), ne(invoices.status, "void"), gte(invoices.issueDate, p.from), lte(invoices.issueDate, p.to)));
    const v = state === "upcoming" ? { outputVat: 0, inputVat: 0, vatPayable: 0, sscl: 0 } : await vatFor(db, b.id, p.from, p.to);
    list.push({
      id: p.id, label: p.label, from: p.from, to: p.to, due: p.due, daysToDue: daysBetween(today, p.due), state, lock,
      checks: state === "upcoming" ? [] : await checks(db, b, p, rules.wording.practitionerNoun),
      sales: state === "upcoming" ? 0 : n(s.net), ...v,
    });
  }
  return { taxYear: yearOf(b, date), vat: b.vatRegistered, sscl: b.ssclRegistered, current: currentOf(ps, today), periods: list };
}

/** The periods a business may mark as sent: its filing periods and tax years. */
export function lockable(b: BusinessRow, from: IsoDate, to: IsoDate): { label: string } | null {
  const rules = rulesFor(b.country);
  const kinds: FilingKind[] = ["mtd", "vat"];
  for (const k of kinds) {
    const p = filingPeriods({ country: b.country, quarterType: b.quarterType }, k, from).find((x) => x.from === from && x.to === to);
    if (p) return { label: k === "mtd" ? `${p.label} update` : `${p.label} ${b.country === "lk" ? "VAT and SSCL return" : "VAT return"}` };
  }
  const y = rules.taxYearOf(from);
  if (y.from === from && y.to === to) return { label: `Tax year ${y.label}` };
  return null;
}

export { locks, lockFor, checks, yearOf };
