import { and, count, desc, eq, gte, ilike, inArray, lte, notInArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { accounts, bankFeeds, bankTransactions, bills, businesses, customers, invoices, journalEntries, journalLines, vendors } from "@/db/schema";
import { addDays, daysBetween, endOfMonth, endOfQuarter, endOfYear, formatDate, nextEstimatedTaxDue, startOfMonth, startOfQuarter, startOfYear } from "./dates";
import { balancesAsOf, type Exec } from "./ledger";
import { shareOf } from "./money";
import { threeNumbers } from "./numbers";
import { OpError } from "./ops";

/**
 * "Yours to keep" and the full books: monthly keep series, safe to spend,
 * tax estimate, balance sheet, ledger listing, search and settings.
 */

// Moving money between your own accounts isn't coming in or going out (same rule as numbers.ts).
const NOT_FLOW = ["transfer", "opening"];

/** First day of the month `n` months after the month containing `iso` (n may be negative). */
export function shiftMonth(iso: string, n: number): string {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7)) - 1 + n;
  const yy = y + Math.floor(m / 12);
  const mm = ((m % 12) + 12) % 12;
  return `${yy}-${String(mm + 1).padStart(2, "0")}-01`;
}

/** Money in and out of cash and card accounts per month ("YYYY-MM"), between two dates. */
export async function monthlyCashFlows(db: Exec, businessId: string, from: string, to: string) {
  const month = sql<string>`to_char(${journalEntries.entryDate}, 'YYYY-MM')`;
  const rows = await db
    .select({
      month,
      inflow: sql<string>`coalesce(sum(${journalLines.debitCents}), 0)`,
      outflow: sql<string>`coalesce(sum(${journalLines.creditCents}), 0)`,
    })
    .from(journalLines)
    .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
    .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
    .where(
      and(
        eq(journalLines.businessId, businessId),
        inArray(accounts.subtype, ["cash", "card"]),
        notInArray(journalEntries.sourceType, NOT_FLOW),
        gte(journalEntries.entryDate, from),
        lte(journalEntries.entryDate, to),
      ),
    )
    .groupBy(month);
  const map = new Map<string, { inflow: number; outflow: number }>();
  for (const r of rows) map.set(r.month, { inflow: Number(r.inflow), outflow: Number(r.outflow) });
  return map;
}

export type KeepMonth = {
  /** First day of the month. */
  month: string;
  label: string;
  comingIn: number;
  goingOut: number;
  profit: number;
  tax: number;
  keep: number;
  /** The current month: counts money on the way and bills still to pay. */
  current: boolean;
};

/**
 * Yours to keep, month by month. Finished months use the money that actually
 * moved in and out of your bank and card accounts; the current month uses the
 * same numbers as Home (including money on the way and bills still to pay).
 * Tax is set aside on positive profit only.
 */
export async function monthlyKeepSeries(db: Exec, businessId: string, today: string, months = 6) {
  const [biz] = await db.select({ taxRateBps: businesses.taxRateBps }).from(businesses).where(eq(businesses.id, businessId));
  const rate = biz?.taxRateBps ?? 2500;
  const thisMonth = startOfMonth(today);
  const first = shiftMonth(thisMonth, -(months - 1));
  const yearStart = startOfYear(today);
  const from = first < yearStart ? first : yearStart;
  const flows = await monthlyCashFlows(db, businessId, from, addDays(thisMonth, -1));
  const current = await threeNumbers(db, businessId, "month", today);

  const pastMonth = (m: string): KeepMonth => {
    const f = flows.get(m.slice(0, 7)) ?? { inflow: 0, outflow: 0 };
    const profit = f.inflow - f.outflow;
    const tax = profit > 0 ? shareOf(profit, rate) : 0;
    return { month: m, label: formatDate(m, { month: "short" }), comingIn: f.inflow, goingOut: f.outflow, profit, tax, keep: profit - tax, current: false };
  };
  const currentMonth: KeepMonth = {
    month: thisMonth,
    label: formatDate(thisMonth, { month: "short" }),
    comingIn: current.comingIn,
    goingOut: current.goingOut,
    profit: current.profit,
    tax: current.taxSetAside,
    keep: current.yoursToKeep,
    current: true,
  };

  const series: KeepMonth[] = [];
  for (let i = 0; i < months - 1; i++) series.push(pastMonth(shiftMonth(first, i)));
  series.push(currentMonth);

  // Kept this calendar year: finished months plus the current month so far.
  let ytd = currentMonth.keep;
  for (let m = yearStart; m < thisMonth; m = shiftMonth(m, 1)) ytd += pastMonth(m).keep;

  const finished = series.filter((s) => !s.current);
  const average = finished.length ? Math.round(finished.reduce((s, m) => s + m.keep, 0) / finished.length) : 0;
  return { series, ytd, average, taxRateBps: rate };
}

export type SafeToSpend = {
  cash: number;
  cashAccounts: { name: string; balance: number }[];
  cardsOwed: number;
  cardAccounts: { name: string; balance: number }[];
  unpaidBills: number;
  unpaidBillCount: number;
  taxSetAside: number;
  taxRateBps: number;
  safe: number;
};

/**
 * Safe to spend today = cash and bank balances − card balances owed − unpaid
 * bills − this month's tax set-aside.
 */
export async function safeToSpend(db: Exec, businessId: string, today: string): Promise<SafeToSpend> {
  const balances = await balancesAsOf(db, businessId, today);
  const all = await db.select().from(accounts).where(and(eq(accounts.businessId, businessId), inArray(accounts.subtype, ["cash", "card"]))).orderBy(accounts.code);
  const bal = (id: string) => balances.find((b) => b.accountId === id)?.balance ?? 0;
  const cashAccounts = all.filter((a) => a.subtype === "cash").map((a) => ({ name: a.name, balance: bal(a.id) }));
  const cardAccounts = all.filter((a) => a.subtype === "card").map((a) => ({ name: a.name, balance: bal(a.id) }));
  const cash = cashAccounts.reduce((s, a) => s + a.balance, 0);
  // Card accounts are liabilities: a positive balance is money owed.
  const cardsOwed = cardAccounts.reduce((s, a) => s + Math.max(0, a.balance), 0);

  const [unpaid] = await db
    .select({ cents: sql<string>`coalesce(sum(${bills.amountCents}), 0)`, n: count() })
    .from(bills)
    .where(and(eq(bills.businessId, businessId), eq(bills.status, "unpaid")));
  const unpaidBills = Number(unpaid?.cents ?? 0);
  const n = await threeNumbers(db, businessId, "month", today);
  return {
    cash,
    cashAccounts: cashAccounts.filter((a) => a.balance !== 0 || cashAccounts.length === 1),
    cardsOwed,
    cardAccounts: cardAccounts.filter((a) => a.balance !== 0),
    unpaidBills,
    unpaidBillCount: Number(unpaid?.n ?? 0),
    taxSetAside: n.taxSetAside,
    taxRateBps: n.taxRateBps,
    safe: cash - cardsOwed - unpaidBills - n.taxSetAside,
  };
}

/** The next estimated tax payment and an estimate for the quarter so far (profit × rate). */
export async function taxEstimate(db: Exec, businessId: string, today: string) {
  const [biz] = await db.select({ taxRateBps: businesses.taxRateBps }).from(businesses).where(eq(businesses.id, businessId));
  const rate = biz?.taxRateBps ?? 2500;
  const qStart = startOfQuarter(today);
  const flows = await monthlyCashFlows(db, businessId, qStart, today);
  let profit = 0;
  for (const f of flows.values()) profit += f.inflow - f.outflow;
  return {
    dueDate: nextEstimatedTaxDue(today),
    quarterStart: qStart,
    quarterProfit: profit,
    estimate: profit > 0 ? shareOf(profit, rate) : 0,
    taxRateBps: rate,
  };
}

// ---------------------------------------------------------------------------
// Reports

export type RangePreset = "this-month" | "last-month" | "this-quarter" | "this-year" | "last-year" | "custom";
export const RANGE_PRESETS: { key: Exclude<RangePreset, "custom">; label: string }[] = [
  { key: "this-month", label: "This month" },
  { key: "last-month", label: "Last month" },
  { key: "this-quarter", label: "This quarter" },
  { key: "this-year", label: "This year" },
  { key: "last-year", label: "Last year" },
];

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const validIso = (s: string | undefined): s is string => !!s && ISO.test(s) && !Number.isNaN(new Date(s + "T12:00:00").getTime()) && new Date(s + "T12:00:00").toISOString().slice(0, 10) === s;

/**
 * Resolves a report range from ?range / ?from&to, plus the previous period of
 * the same length for comparison.
 */
export function reportRange(params: { range?: string; from?: string; to?: string }, today: string) {
  let preset: RangePreset = (RANGE_PRESETS.find((p) => p.key === params.range)?.key ?? "this-month") as RangePreset;
  let from: string;
  let to: string;
  if (validIso(params.from) && validIso(params.to) && params.from <= params.to) {
    preset = "custom";
    from = params.from;
    to = params.to;
  } else if (preset === "last-month") {
    from = shiftMonth(today, -1);
    to = endOfMonth(from);
  } else if (preset === "this-quarter") {
    from = startOfQuarter(today);
    to = endOfQuarter(today);
  } else if (preset === "this-year") {
    from = startOfYear(today);
    to = endOfYear(today);
  } else if (preset === "last-year") {
    from = `${Number(today.slice(0, 4)) - 1}-01-01`;
    to = `${Number(today.slice(0, 4)) - 1}-12-31`;
  } else {
    from = startOfMonth(today);
    to = endOfMonth(today);
  }
  // Previous period of the same length; whole months/years compare to the previous whole month/quarter/year.
  let prevFrom: string;
  let prevTo: string;
  if (preset === "this-month" || preset === "last-month") {
    prevFrom = shiftMonth(from, -1);
    prevTo = endOfMonth(prevFrom);
  } else if (preset === "this-quarter") {
    prevFrom = shiftMonth(from, -3);
    prevTo = endOfQuarter(prevFrom);
  } else if (preset === "this-year" || preset === "last-year") {
    prevFrom = `${Number(from.slice(0, 4)) - 1}-01-01`;
    prevTo = `${Number(from.slice(0, 4)) - 1}-12-31`;
  } else {
    const days = daysBetween(from, to) + 1;
    prevTo = addDays(from, -1);
    prevFrom = addDays(prevTo, -(days - 1));
  }
  return { preset, from, to, prevFrom, prevTo };
}

export type SheetLine = { accountId: string | null; code: string; name: string; cents: number };

/** Assets, liabilities and equity as of a date. Retained earnings = cumulative net profit, so it balances. */
export async function balanceSheet(db: Exec, businessId: string, asOf: string) {
  const balances = await balancesAsOf(db, businessId, asOf);
  const pick = (type: string): SheetLine[] =>
    balances.filter((b) => b.type === type && b.balance !== 0).map((b) => ({ accountId: b.accountId, code: b.code, name: b.name, cents: b.balance }));
  const assets = pick("asset");
  const liabilities = pick("liability");
  const equity = pick("equity");
  const income = balances.filter((b) => b.type === "income").reduce((s, b) => s + b.balance, 0);
  // expense balances are debit-normal in balancesAsOf
  const expense = balances.filter((b) => b.type === "expense").reduce((s, b) => s + b.balance, 0);
  const retainedEarnings = income - expense;
  if (retainedEarnings !== 0) equity.push({ accountId: null, code: "", name: "Profit kept in the business (retained earnings)", cents: retainedEarnings });
  const totalAssets = assets.reduce((s, l) => s + l.cents, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.cents, 0);
  const totalEquity = equity.reduce((s, l) => s + l.cents, 0);
  return {
    asOf,
    assets,
    liabilities,
    equity,
    retainedEarnings,
    totalAssets,
    totalLiabilities,
    totalEquity,
    balanced: totalAssets === totalLiabilities + totalEquity,
  };
}

// ---------------------------------------------------------------------------
// Ledger

export async function ledgerPage(db: Exec, businessId: string, opts: { page?: number; pageSize?: number; accountId?: string | null } = {}) {
  const pageSize = opts.pageSize ?? 25;
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const filter = opts.accountId
    ? and(
        eq(journalEntries.businessId, businessId),
        sql`exists (select 1 from ${journalLines} where ${journalLines.entryId} = ${journalEntries.id} and ${journalLines.accountId} = ${opts.accountId})`,
      )
    : eq(journalEntries.businessId, businessId);
  const [{ total }] = await db.select({ total: count() }).from(journalEntries).where(filter);
  const entries = await db
    .select()
    .from(journalEntries)
    .where(filter)
    .orderBy(desc(journalEntries.entryDate), desc(journalEntries.createdAt), desc(journalEntries.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const ids = entries.map((e) => e.id);
  const lines = ids.length
    ? await db
        .select({
          entryId: journalLines.entryId,
          accountId: journalLines.accountId,
          accountName: accounts.name,
          accountCode: accounts.code,
          debit: journalLines.debitCents,
          credit: journalLines.creditCents,
        })
        .from(journalLines)
        .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
        .where(and(eq(journalLines.businessId, businessId), inArray(journalLines.entryId, ids)))
    : [];
  return {
    page,
    pageSize,
    total: Number(total),
    pages: Math.max(1, Math.ceil(Number(total) / pageSize)),
    entries: entries.map((e) => ({
      ...e,
      // debits first, then credits
      lines: lines.filter((l) => l.entryId === e.id).sort((a, b) => (b.debit > 0 ? 1 : 0) - (a.debit > 0 ? 1 : 0) || a.accountCode.localeCompare(b.accountCode)),
    })),
  };
}

// ---------------------------------------------------------------------------
// Search

const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => "\\" + c);

export async function searchBusiness(db: Exec, businessId: string, rawQuery: string, limit = 10) {
  const q = rawQuery.trim().slice(0, 100);
  if (!q) return { q, customers: [], vendors: [], invoices: [], transactions: [], total: 0 };
  const pat = `%${likeEscape(q)}%`;
  const [cust, vend, inv, txs] = await Promise.all([
    db
      .select({ id: customers.id, name: customers.name, email: customers.email })
      .from(customers)
      .where(and(eq(customers.businessId, businessId), or(ilike(customers.name, pat), ilike(customers.email, pat))))
      .orderBy(customers.name)
      .limit(limit),
    db
      .select({ id: vendors.id, name: vendors.name, email: vendors.email })
      .from(vendors)
      .where(and(eq(vendors.businessId, businessId), ilike(vendors.name, pat)))
      .orderBy(vendors.name)
      .limit(limit),
    db
      .select({
        id: invoices.id,
        number: invoices.number,
        status: invoices.status,
        totalCents: invoices.totalCents,
        paidCents: invoices.paidCents,
        dueDate: invoices.dueDate,
        customerName: customers.name,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(eq(invoices.businessId, businessId), or(ilike(invoices.number, pat), ilike(customers.name, pat))))
      .orderBy(desc(invoices.issueDate))
      .limit(limit),
    db
      .select({
        id: bankTransactions.id,
        description: bankTransactions.description,
        postedOn: bankTransactions.postedOn,
        amountCents: bankTransactions.amountCents,
        status: bankTransactions.status,
        institution: bankFeeds.institution,
        mask: bankFeeds.mask,
      })
      .from(bankTransactions)
      .innerJoin(bankFeeds, eq(bankTransactions.feedId, bankFeeds.id))
      .where(and(eq(bankTransactions.businessId, businessId), ilike(bankTransactions.description, pat)))
      .orderBy(desc(bankTransactions.postedOn))
      .limit(limit),
  ]);
  return { q, customers: cust, vendors: vend, invoices: inv, transactions: txs, total: cust.length + vend.length + inv.length + txs.length };
}

// ---------------------------------------------------------------------------
// Settings

export const settingsSchema = z.object({
  name: z.string().trim().min(1, "Give your business a name.").max(120, "Keep the name under 120 characters."),
  invoicePrefix: z
    .string()
    .trim()
    .min(1, "Add a short prefix, like INV-.")
    .max(12, "Keep the prefix to 12 characters or fewer.")
    .regex(/^[A-Za-z0-9\-_/.#]+$/, "Use letters, numbers and - _ / . # only."),
  taxRatePct: z.coerce.number().int("Use a whole number.").min(0, "Use 0% to 60%.").max(60, "Use 0% to 60%."),
});

export async function updateBusinessSettings(db: Exec, businessId: string, input: { name: string; invoicePrefix: string; taxRatePct: number | string }) {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) throw new OpError(parsed.error.issues[0]?.message ?? "Check the settings and try again.");
  const { name, invoicePrefix, taxRatePct } = parsed.data;
  await db.update(businesses).set({ name, invoicePrefix, taxRateBps: taxRatePct * 100 }).where(eq(businesses.id, businessId));
  return parsed.data;
}
