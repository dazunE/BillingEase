import { balanced, chartOfAccounts, type CountryCode, type PostingLine } from "@billingease/core";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Exec } from "./client";
import { accounts, journalEntries, journalLines } from "./schema";

export class LockedPeriodError extends Error {
  constructor(public label: string) {
    super(`${label} is filed and locked.`);
  }
}

/** Gives a new business its country's chart of accounts. */
export async function seedAccounts(db: Exec, businessId: string, country: CountryCode) {
  await db.insert(accounts).values(chartOfAccounts(country).map((a) => ({ businessId, ...a })));
}

async function accountIds(db: Exec, businessId: string, codes: string[]) {
  const rows = await db.select({ id: accounts.id, code: accounts.code }).from(accounts)
    .where(and(eq(accounts.businessId, businessId), inArray(accounts.code, codes)));
  const map = new Map(rows.map((r) => [r.code, r.id]));
  for (const c of codes) if (!map.has(c)) throw new Error(`This business has no account ${c}.`);
  return map;
}

/** Rewrites the database's PERIOD_LOCKED error as a LockedPeriodError the API can explain. */
function lockedFrom(err: unknown): never {
  const msg = String((err as { message?: string })?.message ?? "") + String((err as { cause?: { message?: string } })?.cause?.message ?? "");
  const m = /PERIOD_LOCKED: (.*) is filed and locked/.exec(msg);
  if (m) throw new LockedPeriodError(m[1]);
  throw err;
}

/**
 * Posts one balanced journal entry. This is the only way money moves: invoices, receipts,
 * expenses, bills and payments all end up here. The database also checks balance, that the
 * period is open, and that every account belongs to the business.
 */
export async function postEntry(
  db: Exec,
  e: { businessId: string; date: string; memo: string; sourceType: string; sourceId?: string | null; createdBy?: string | null; lines: PostingLine[] },
): Promise<string> {
  const lines = balanced(e.lines);
  const ids = await accountIds(db, e.businessId, [...new Set(lines.map((l) => l.code))]);
  let entryId: string;
  try {
    const [row] = await db.insert(journalEntries).values({
      businessId: e.businessId, entryDate: e.date, memo: e.memo, sourceType: e.sourceType, sourceId: e.sourceId ?? null, createdBy: e.createdBy ?? null,
    }).returning({ id: journalEntries.id });
    entryId = row.id;
  } catch (err) {
    lockedFrom(err);
  }
  await db.insert(journalLines).values(lines.map((l) => ({ entryId, businessId: e.businessId, accountId: ids.get(l.code)!, debit: l.debit, credit: l.credit })));
  return entryId;
}

/** Undoes an entry by posting its mirror image, dated `date` (default: the original date). */
export async function reverseEntry(db: Exec, businessId: string, entryId: string, opts: { date?: string; memo?: string; createdBy?: string | null } = {}) {
  const [entry] = await db.select().from(journalEntries).where(and(eq(journalEntries.id, entryId), eq(journalEntries.businessId, businessId)));
  if (!entry) throw new Error("No such entry.");
  if (entry.reversedAt) return null;
  const lines = await db.select({ accountId: journalLines.accountId, debit: journalLines.debit, credit: journalLines.credit, code: accounts.code })
    .from(journalLines).innerJoin(accounts, eq(accounts.id, journalLines.accountId)).where(eq(journalLines.entryId, entryId));
  let id: string;
  try {
    const [row] = await db.insert(journalEntries).values({
      businessId, entryDate: opts.date ?? entry.entryDate, memo: opts.memo ?? `Reversal: ${entry.memo}`,
      sourceType: entry.sourceType, sourceId: entry.sourceId, reversesEntryId: entry.id, createdBy: opts.createdBy ?? null,
    }).returning({ id: journalEntries.id });
    id = row.id;
  } catch (err) {
    lockedFrom(err);
  }
  await db.insert(journalLines).values(lines.map((l) => ({ entryId: id, businessId, accountId: l.accountId, debit: l.credit, credit: l.debit })));
  await db.update(journalEntries).set({ reversedAt: new Date() }).where(eq(journalEntries.id, entryId));
  return id;
}

export type AccountBalance = { code: string; name: string; type: string; role: string | null; categoryId: string | null; debit: number; credit: number };

/** Debit and credit totals per account for entries dated from..to (inclusive). */
export async function accountTotals(db: Exec, businessId: string, from: string, to: string): Promise<AccountBalance[]> {
  const rows = await db
    .select({
      code: accounts.code, name: accounts.name, type: accounts.type, role: accounts.role, categoryId: accounts.categoryId,
      debit: sql<string>`coalesce(sum(${journalLines.debit}), 0)`,
      credit: sql<string>`coalesce(sum(${journalLines.credit}), 0)`,
    })
    .from(journalLines)
    .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
    .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
    .where(and(eq(journalLines.businessId, businessId), sql`${journalEntries.entryDate} between ${from} and ${to}`))
    .groupBy(accounts.code, accounts.name, accounts.type, accounts.role, accounts.categoryId)
    .orderBy(accounts.code);
  return rows.map((r) => ({ ...r, debit: Number(r.debit), credit: Number(r.credit) }));
}

/** Across the whole ledger, debits equal credits. */
export async function trialBalance(db: Exec, businessId: string) {
  const [row] = await db.select({
    debit: sql<string>`coalesce(sum(${journalLines.debit}), 0)`,
    credit: sql<string>`coalesce(sum(${journalLines.credit}), 0)`,
  }).from(journalLines).where(eq(journalLines.businessId, businessId));
  return { debit: Number(row.debit), credit: Number(row.credit) };
}

/** Allows the cascade delete of a whole business's ledger, inside the current transaction only. */
export async function allowPurge(db: Exec) {
  await db.execute(sql`select set_config('be.purge', 'on', true)`);
}
