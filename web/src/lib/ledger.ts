import { and, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { accounts, journalEntries, journalLines, type AccountType } from "@/db/schema";

/** A database handle or an open transaction. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type Exec = Db | Tx;

export type LineInput = { accountId: string; debit?: number; credit?: number };

export class LedgerError extends Error {}

/**
 * Posts one balanced journal entry. This is the only way money moves in
 * BillingEase: invoices, payments, bills, expenses, bank activity and payroll
 * all end up here. The database also rejects unbalanced entries at commit.
 */
export async function postEntry(
  db: Exec,
  entry: { businessId: string; date: string; memo: string; sourceType: string; sourceId?: string | null; lines: LineInput[] },
): Promise<string> {
  const lines = entry.lines
    .map((l) => ({ accountId: l.accountId, debit: Math.round(l.debit ?? 0), credit: Math.round(l.credit ?? 0) }))
    .filter((l) => l.debit !== 0 || l.credit !== 0);
  if (lines.length < 2) throw new LedgerError("A journal entry needs at least two lines.");
  for (const l of lines) {
    if (l.debit < 0 || l.credit < 0) throw new LedgerError("Debits and credits must be positive.");
    if (l.debit > 0 && l.credit > 0) throw new LedgerError("A line is either a debit or a credit, not both.");
  }
  const debits = lines.reduce((s, l) => s + l.debit, 0);
  const credits = lines.reduce((s, l) => s + l.credit, 0);
  if (debits !== credits) throw new LedgerError(`Unbalanced entry: debits ${debits} ≠ credits ${credits}.`);

  const [row] = await db
    .insert(journalEntries)
    .values({
      businessId: entry.businessId,
      entryDate: entry.date,
      memo: entry.memo,
      sourceType: entry.sourceType,
      sourceId: entry.sourceId ?? null,
    })
    .returning({ id: journalEntries.id });
  await db.insert(journalLines).values(
    lines.map((l) => ({
      entryId: row.id,
      businessId: entry.businessId,
      accountId: l.accountId,
      debitCents: l.debit,
      creditCents: l.credit,
    })),
  );
  return row.id;
}

/** Removes an entry and its lines (used to undo, e.g. re-categorizing a transaction). */
export async function deleteEntry(db: Exec, entryId: string) {
  await db.delete(journalEntries).where(eq(journalEntries.id, entryId));
}

// ---------------------------------------------------------------------------
// Chart of accounts

type AccountSeed = { code: string; name: string; type: AccountType; subtype?: string; isSystem?: boolean };

export const DEFAULT_ACCOUNTS: AccountSeed[] = [
  { code: "1000", name: "Business checking", type: "asset", subtype: "cash", isSystem: true },
  { code: "1050", name: "Cash on hand", type: "asset", subtype: "cash" },
  { code: "1100", name: "Money customers owe you", type: "asset", subtype: "ar", isSystem: true },
  { code: "2000", name: "Bills you owe", type: "liability", subtype: "ap", isSystem: true },
  { code: "2100", name: "Business credit card", type: "liability", subtype: "card" },
  { code: "3000", name: "Owner investment", type: "equity", subtype: "owner" },
  { code: "3100", name: "Owner drawings", type: "equity" },
  { code: "3900", name: "Opening balance", type: "equity", subtype: "opening", isSystem: true },
  { code: "4000", name: "Sales", type: "income", subtype: "sales", isSystem: true },
  { code: "4100", name: "Other income", type: "income" },
  { code: "4900", name: "Uncategorized income", type: "income", subtype: "uncategorized_in", isSystem: true },
  { code: "5000", name: "Cost of goods sold", type: "expense" },
  { code: "6000", name: "Advertising", type: "expense" },
  { code: "6010", name: "Bank & payment fees", type: "expense", subtype: "fees" },
  { code: "6020", name: "Contractors", type: "expense" },
  { code: "6030", name: "Meals", type: "expense" },
  { code: "6040", name: "Office supplies", type: "expense" },
  { code: "6050", name: "Rent", type: "expense" },
  { code: "6060", name: "Software & subscriptions", type: "expense" },
  { code: "6070", name: "Travel", type: "expense" },
  { code: "6080", name: "Utilities & phone", type: "expense" },
  { code: "6090", name: "Vehicle & fuel", type: "expense" },
  { code: "6100", name: "Insurance", type: "expense" },
  { code: "6110", name: "Payroll wages", type: "expense", subtype: "payroll" },
  { code: "6120", name: "Payroll taxes", type: "expense", subtype: "payroll_tax" },
  { code: "6900", name: "Uncategorized expense", type: "expense", subtype: "uncategorized_out", isSystem: true },
];

export async function createDefaultAccounts(db: Exec, businessId: string) {
  await db.insert(accounts).values(DEFAULT_ACCOUNTS.map((a) => ({ businessId, ...a, isSystem: a.isSystem ?? false })));
}

export async function accountBySubtype(db: Exec, businessId: string, subtype: string) {
  const [row] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.businessId, businessId), eq(accounts.subtype, subtype)))
    .orderBy(accounts.code)
    .limit(1);
  if (!row) throw new LedgerError(`No account with subtype ${subtype}.`);
  return row;
}

export async function accountByCode(db: Exec, businessId: string, code: string) {
  const [row] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.businessId, businessId), eq(accounts.code, code)))
    .limit(1);
  if (!row) throw new LedgerError(`No account ${code}.`);
  return row;
}

export async function listAccounts(db: Exec, businessId: string, types?: AccountType[]) {
  const where = types?.length
    ? and(eq(accounts.businessId, businessId), inArray(accounts.type, types))
    : eq(accounts.businessId, businessId);
  return db.select().from(accounts).where(where).orderBy(accounts.code);
}

/** Expense categories a user can pick (excludes payroll and the catch-all). */
export async function expenseCategories(db: Exec, businessId: string) {
  const rows = await listAccounts(db, businessId, ["expense"]);
  return rows.filter((a) => !["payroll", "payroll_tax", "uncategorized_out"].includes(a.subtype ?? ""));
}

// ---------------------------------------------------------------------------
// Reporting queries

export type AccountTotal = { accountId: string; code: string; name: string; type: AccountType; subtype: string | null; debit: number; credit: number };

/** Debit/credit totals per account for entries dated within [from, to]. */
export async function accountTotals(db: Exec, businessId: string, from: string, to: string): Promise<AccountTotal[]> {
  const rows = await db
    .select({
      accountId: accounts.id,
      code: accounts.code,
      name: accounts.name,
      type: accounts.type,
      subtype: accounts.subtype,
      debit: sql<string>`coalesce(sum(${journalLines.debitCents}), 0)`,
      credit: sql<string>`coalesce(sum(${journalLines.creditCents}), 0)`,
    })
    .from(journalLines)
    .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
    .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
    .where(
      and(
        eq(journalLines.businessId, businessId),
        sql`${journalEntries.entryDate} >= ${from}`,
        sql`${journalEntries.entryDate} <= ${to}`,
      ),
    )
    .groupBy(accounts.id, accounts.code, accounts.name, accounts.type, accounts.subtype)
    .orderBy(accounts.code);
  return rows.map((r) => ({ ...r, debit: Number(r.debit), credit: Number(r.credit) }));
}

export type ProfitAndLoss = {
  income: { accountId: string; name: string; cents: number }[];
  expenses: { accountId: string; name: string; cents: number }[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
};

/** Accrual-basis profit & loss for a date range, straight from the ledger. */
export async function profitAndLoss(db: Exec, businessId: string, from: string, to: string): Promise<ProfitAndLoss> {
  const totals = await accountTotals(db, businessId, from, to);
  const income = totals
    .filter((t) => t.type === "income")
    .map((t) => ({ accountId: t.accountId, name: t.name, cents: t.credit - t.debit }))
    .filter((t) => t.cents !== 0);
  const expenses = totals
    .filter((t) => t.type === "expense")
    .map((t) => ({ accountId: t.accountId, name: t.name, cents: t.debit - t.credit }))
    .filter((t) => t.cents !== 0);
  const totalIncome = income.reduce((s, r) => s + r.cents, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.cents, 0);
  return { income, expenses, totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses };
}

/** Balance of each account as of a date (assets/expenses debit-normal, others credit-normal). */
export async function balancesAsOf(db: Exec, businessId: string, asOf: string) {
  const totals = await accountTotals(db, businessId, "0001-01-01", asOf);
  return totals.map((t) => ({
    ...t,
    balance: t.type === "asset" || t.type === "expense" ? t.debit - t.credit : t.credit - t.debit,
  }));
}

/** Trial balance check: across the whole ledger, debits equal credits. */
export async function trialBalance(db: Exec, businessId: string) {
  const [row] = await db
    .select({
      debit: sql<string>`coalesce(sum(${journalLines.debitCents}), 0)`,
      credit: sql<string>`coalesce(sum(${journalLines.creditCents}), 0)`,
    })
    .from(journalLines)
    .where(eq(journalLines.businessId, businessId));
  return { debit: Number(row.debit), credit: Number(row.credit) };
}
