import { and, asc, count, desc, eq, gt, gte, ilike, inArray, lte, notInArray, or, sql } from "drizzle-orm";
import { accounts, bankFeeds, bankTransactions, bills, invoices, journalEntries, journalLines, payrollRuns, vendors } from "@/db/schema";
import { logActivity } from "./activity";
import { formatDate } from "./dates";
import { accountBySubtype, expenseCategories, listAccounts, type Exec } from "./ledger";
import { formatMoney } from "./money";
import { createBill, importTransactions, OpError, recordExpense } from "./ops";
import { bankProvider } from "./providers";

/**
 * Going out: read models and checked operations for the "Going out" screens
 * (sorting card charges, bills, payroll, expenses, vendors, transactions).
 * Money still only moves through the ledger operations in ops.ts.
 */

// ---------------------------------------------------------------------------
// Category suggestions

/**
 * Plain keyword rules from what someone typed ("client lunch", "printer ink")
 * to an expense category code in DEFAULT_ACCOUNTS. First match wins.
 */
export const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/\b(coffee|lunch|dinner|breakfast|meals?|cafe|café|restaurant|starbucks|blue bottle|snacks?|catering)\b/i, "6030"],
  [/\b(uber|lyft|taxi|cab|flights?|airfare|airlines?|delta|train|hotel|parking|airbnb|travel|tolls?)\b/i, "6070"],
  [/\b(gas|fuel|petrol|shell|chevron|exxon|mileage|car wash|oil change)\b/i, "6090"],
  [/\b(software|subscriptions?|apps?|licen[cs]e|canva|figma|adobe|notion|dropbox|slack|zoom|hosting|domain)\b/i, "6060"],
  [/\b(ads?|advert\w*|facebook|instagram|promo\w*|marketing|flyers?|billboard)\b/i, "6000"],
  [/\b(paper|ink|printer|pens?|staples|amazon|amzn|supplies|toner|stationery|office)\b/i, "6040"],
  [/\b(phone|internet|wifi|comcast|verizon|electric\w*|utilit\w*|water bill)\b/i, "6080"],
  [/\b(rent|wework|lease|coworking)\b/i, "6050"],
  [/\b(contractors?|freelancer?s?|upwork|fiverr|illustrat\w*)\b/i, "6020"],
  [/\binsurance\b/i, "6100"],
  [/\b(bank fees?|fees?|stripe|paypal)\b/i, "6010"],
  [/\b(materials|inventory|stock|wholesale)\b/i, "5000"],
];

/** The category code our keyword rules suggest for a description, or null. */
export function suggestCategory(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  return CATEGORY_KEYWORDS.find(([re]) => re.test(t))?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// Sorting bank and card transactions

/** Codes offered as one-tap chips beside our guess. */
const COMMON_OUT = ["6030", "6040", "6070", "6060", "6000"];
const COMMON_IN = ["4000", "4100"];
/** "Personal" money: not a business cost, so it goes to the owner's equity. */
const PERSONAL_OUT = "3100";
const PERSONAL_IN = "3000";

export type CategoryOption = { id: string; name: string; code: string };

/** Transactions waiting for a category, newest first, with our guess and quick choices. */
export async function sortQueue(db: Exec, businessId: string) {
  const rows = await db
    .select({ tx: bankTransactions, feed: bankFeeds })
    .from(bankTransactions)
    .innerJoin(bankFeeds, eq(bankTransactions.feedId, bankFeeds.id))
    .where(and(eq(bankTransactions.businessId, businessId), eq(bankTransactions.status, "needs_review")))
    .orderBy(desc(bankTransactions.postedOn), asc(bankTransactions.externalId));
  const all = await listAccounts(db, businessId);
  const byCode = new Map(all.map((a) => [a.code, a]));
  const byId = new Map(all.map((a) => [a.id, a]));
  const opt = (a: (typeof all)[number]): CategoryOption => ({ id: a.id, name: a.name, code: a.code });

  return rows.map(({ tx, feed }) => {
    const moneyIn = tx.amountCents > 0;
    const suggested = tx.suggestedAccountId ? byId.get(tx.suggestedAccountId) : undefined;
    const commonCodes = (moneyIn ? COMMON_IN : COMMON_OUT).filter((c) => c !== suggested?.code);
    const common = commonCodes
      .slice(0, 3)
      .map((c) => byCode.get(c))
      .filter((a): a is NonNullable<typeof a> => !!a)
      .map(opt);
    const personal = byCode.get(moneyIn ? PERSONAL_IN : PERSONAL_OUT);
    return {
      id: tx.id,
      description: tx.description,
      postedOn: tx.postedOn,
      amountCents: tx.amountCents,
      moneyIn,
      account: `${feed.institution} ••${feed.mask}`,
      suggested: suggested ? opt(suggested) : null,
      common,
      personal: personal ? { ...opt(personal), name: "Personal" } : null,
    };
  });
}

export type SortItem = Awaited<ReturnType<typeof sortQueue>>[number];

/** Expense and income categories for the "Other…" picker. */
export async function categoryChoices(db: Exec, businessId: string) {
  const out = await expenseCategories(db, businessId);
  const income = (await listAccounts(db, businessId, ["income"])).filter((a) => a.subtype !== "uncategorized_in");
  const equity = await listAccounts(db, businessId, ["equity"]);
  const opt = (a: { id: string; name: string; code: string }): CategoryOption => ({ id: a.id, name: a.name, code: a.code });
  const personal = (code: string) => equity.filter((a) => a.code === code).map((a) => ({ ...opt(a), name: "Personal (not a business cost)" }));
  return { out: [...out.map(opt), ...personal(PERSONAL_OUT)], in: [...income.map(opt), ...personal(PERSONAL_IN)] };
}

/** How many transactions BillingEase has already filed on its own. */
export async function autoSortedCount(db: Exec, businessId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(bankTransactions)
    .where(and(eq(bankTransactions.businessId, businessId), inArray(bankTransactions.status, ["categorized", "matched"])));
  return row?.n ?? 0;
}

/**
 * Checks a category is a sensible choice for a transaction: money out goes to
 * an expense (or owner drawings), money in to income (or owner investment).
 */
export async function assertCategoryFits(db: Exec, businessId: string, txId: string, categoryAccountId: string) {
  const [tx] = await db
    .select()
    .from(bankTransactions)
    .where(and(eq(bankTransactions.id, txId), eq(bankTransactions.businessId, businessId)));
  if (!tx) throw new OpError("Transaction not found.");
  const [cat] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, categoryAccountId), eq(accounts.businessId, businessId)));
  if (!cat) throw new OpError("Choose a category.");
  const ok = tx.amountCents > 0 ? cat.type === "income" || cat.code === PERSONAL_IN : cat.type === "expense" || cat.code === PERSONAL_OUT;
  if (!ok) throw new OpError(tx.amountCents > 0 ? "Money in goes under an income category." : "Money out goes under an expense category.");
}

// ---------------------------------------------------------------------------
// Coming up: payroll and bills

export async function upcomingPayroll(db: Exec, businessId: string, today: string) {
  return db
    .select()
    .from(payrollRuns)
    .where(
      and(
        eq(payrollRuns.businessId, businessId),
        or(eq(payrollRuns.status, "pending"), and(eq(payrollRuns.status, "approved"), gte(payrollRuns.payDate, today))),
      ),
    )
    .orderBy(asc(payrollRuns.payDate));
}

export async function listBills(db: Exec, businessId: string, status: "unpaid" | "paid") {
  return db
    .select({
      id: bills.id,
      description: bills.description,
      amountCents: bills.amountCents,
      billDate: bills.billDate,
      dueDate: bills.dueDate,
      paidOn: bills.paidOn,
      status: bills.status,
      vendorId: vendors.id,
      vendorName: vendors.name,
      categoryName: accounts.name,
    })
    .from(bills)
    .innerJoin(vendors, eq(bills.vendorId, vendors.id))
    .innerJoin(accounts, eq(bills.categoryAccountId, accounts.id))
    .where(and(eq(bills.businessId, businessId), eq(bills.status, status)))
    .orderBy(status === "unpaid" ? asc(bills.dueDate) : desc(bills.paidOn), asc(vendors.name));
}

export type BillRow = Awaited<ReturnType<typeof listBills>>[number];

/** Creates a bill after checking the category belongs to this business and is an expense. */
export async function addBill(
  db: Exec,
  businessId: string,
  input: { vendorName: string; description: string; categoryAccountId: string; amountCents: number; billDate: string; dueDate: string },
) {
  if (!input.vendorName.trim()) throw new OpError("Who is the bill from?");
  if (input.dueDate < input.billDate) throw new OpError("The due date can't be before the bill date.");
  const [cat] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, input.categoryAccountId), eq(accounts.businessId, businessId), eq(accounts.type, "expense")));
  if (!cat) throw new OpError("Choose a category.");
  const bill = await createBill(db, businessId, input);
  const [v] = await db.select().from(vendors).where(eq(vendors.id, bill.vendorId));
  await logActivity(db, businessId, `Added a ${formatMoney(input.amountCents)} bill from ${v?.name ?? input.vendorName.trim()}, due ${formatDate(input.dueDate)}`);
  return bill;
}

// ---------------------------------------------------------------------------
// Expenses

/** Accounts an expense can be paid from: bank, cash and cards. */
export async function paymentAccounts(db: Exec, businessId: string) {
  const rows = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.businessId, businessId), inArray(accounts.subtype, ["cash", "card"])))
    .orderBy(asc(accounts.code));
  return rows;
}

/** Records an expense after checking both accounts belong to this business and fit their role. */
export async function addExpense(
  db: Exec,
  businessId: string,
  input: { description: string; amountCents: number; spentOn: string; paidFromAccountId: string; categoryAccountId: string },
) {
  const [from] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, input.paidFromAccountId), eq(accounts.businessId, businessId), inArray(accounts.subtype, ["cash", "card"])));
  if (!from) throw new OpError("Choose what you paid with.");
  const [cat] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, input.categoryAccountId), eq(accounts.businessId, businessId), eq(accounts.type, "expense")));
  if (!cat) throw new OpError("Choose a category.");
  const row = await recordExpense(db, businessId, input);
  return { expense: row, category: cat, from };
}

// ---------------------------------------------------------------------------
// Paid this period

// Moving money between your own accounts isn't going out (matches numbers.ts).
const NOT_FLOW = ["transfer", "opening"];

export type PaidRow = {
  lineId: string;
  entryId: string;
  date: string;
  who: string;
  category: string;
  paidWith: string;
  sourceType: string;
  amountCents: number;
};

/**
 * Everything that left your bank, cash and card accounts between `from` and
 * `to`: credits to those accounts, excluding transfers and opening balances.
 * The total equals "paid" in the three numbers for the same dates.
 */
export async function paidThisPeriod(db: Exec, businessId: string, from: string, to: string): Promise<{ rows: PaidRow[]; totalCents: number }> {
  const lines = await db
    .select({
      lineId: journalLines.id,
      entryId: journalEntries.id,
      date: journalEntries.entryDate,
      memo: journalEntries.memo,
      sourceType: journalEntries.sourceType,
      sourceId: journalEntries.sourceId,
      cents: journalLines.creditCents,
      paidWith: accounts.name,
    })
    .from(journalLines)
    .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
    .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
    .where(
      and(
        eq(journalLines.businessId, businessId),
        inArray(accounts.subtype, ["cash", "card"]),
        notInArray(journalEntries.sourceType, NOT_FLOW),
        gt(journalLines.creditCents, 0),
        gte(journalEntries.entryDate, from),
        lte(journalEntries.entryDate, to),
      ),
    )
    .orderBy(desc(journalEntries.entryDate), desc(journalEntries.createdAt));
  if (!lines.length) return { rows: [], totalCents: 0 };

  // What each payment was for: the debit side of the same entry.
  const entryIds = [...new Set(lines.map((l) => l.entryId))];
  const debits = await db
    .select({ entryId: journalLines.entryId, name: accounts.name, subtype: accounts.subtype })
    .from(journalLines)
    .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
    .where(and(inArray(journalLines.entryId, entryIds), gt(journalLines.debitCents, 0)));
  const categoryByEntry = new Map<string, string>();
  for (const d of debits) if (!categoryByEntry.has(d.entryId)) categoryByEntry.set(d.entryId, d.name);

  // Bill payments debit "Bills you owe"; show the bill's own category and vendor instead.
  const billIds = lines.filter((l) => l.sourceType === "bill_payment" && l.sourceId).map((l) => l.sourceId!);
  const billInfo = new Map<string, { vendor: string; category: string }>();
  if (billIds.length) {
    const rows = await db
      .select({ id: bills.id, vendor: vendors.name, category: accounts.name })
      .from(bills)
      .innerJoin(vendors, eq(bills.vendorId, vendors.id))
      .innerJoin(accounts, eq(bills.categoryAccountId, accounts.id))
      .where(and(eq(bills.businessId, businessId), inArray(bills.id, billIds)));
    for (const r of rows) billInfo.set(r.id, { vendor: r.vendor, category: r.category });
  }

  const rows: PaidRow[] = lines.map((l) => {
    const bill = l.sourceType === "bill_payment" && l.sourceId ? billInfo.get(l.sourceId) : undefined;
    return {
      lineId: l.lineId,
      entryId: l.entryId,
      date: l.date,
      who: bill?.vendor ?? l.memo,
      category: bill?.category ?? categoryByEntry.get(l.entryId) ?? "Other",
      paidWith: l.paidWith,
      sourceType: l.sourceType,
      amountCents: l.cents,
    };
  });
  return { rows, totalCents: rows.reduce((s, r) => s + r.amountCents, 0) };
}

// ---------------------------------------------------------------------------
// Transactions

export const TX_STATUSES = ["needs_review", "categorized", "matched"] as const;
export type TxStatus = (typeof TX_STATUSES)[number];

export async function listFeeds(db: Exec, businessId: string) {
  return db.select().from(bankFeeds).where(eq(bankFeeds.businessId, businessId)).orderBy(asc(bankFeeds.createdAt));
}

export async function listTransactions(db: Exec, businessId: string, filters: { status?: TxStatus; feedId?: string; q?: string } = {}) {
  const where = [eq(bankTransactions.businessId, businessId)];
  if (filters.status) where.push(eq(bankTransactions.status, filters.status));
  if (filters.feedId) where.push(eq(bankTransactions.feedId, filters.feedId));
  const q = filters.q?.trim();
  if (q) where.push(ilike(bankTransactions.description, `%${q.replace(/[%_\\]/g, (c) => "\\" + c)}%`));
  return db
    .select({
      id: bankTransactions.id,
      postedOn: bankTransactions.postedOn,
      description: bankTransactions.description,
      amountCents: bankTransactions.amountCents,
      status: bankTransactions.status,
      categoryAccountId: bankTransactions.categoryAccountId,
      suggestedAccountId: bankTransactions.suggestedAccountId,
      categoryName: accounts.name,
      invoiceNumber: invoices.number,
      invoiceId: invoices.id,
      feedId: bankFeeds.id,
      account: sql<string>`${bankFeeds.institution} || ' ••' || ${bankFeeds.mask}`,
    })
    .from(bankTransactions)
    .innerJoin(bankFeeds, eq(bankTransactions.feedId, bankFeeds.id))
    .leftJoin(accounts, eq(bankTransactions.categoryAccountId, accounts.id))
    .leftJoin(invoices, eq(bankTransactions.matchedInvoiceId, invoices.id))
    .where(and(...where))
    .orderBy(desc(bankTransactions.postedOn), desc(bankTransactions.externalId));
}

/**
 * Pulls the latest transactions from the bank provider for every connected
 * feed. Safe to run any time: transactions already imported are skipped.
 */
export async function syncFeeds(db: Exec, businessId: string, today: string) {
  const feeds = await listFeeds(db, businessId);
  if (!feeds.length) throw new OpError("Connect a bank first.");
  const provided = await bankProvider().connect(today);
  let imported = 0;
  for (const feed of feeds) {
    const match = provided.find((p) => p.institution === feed.institution && p.mask === feed.mask);
    if (!match) continue;
    imported += (await importTransactions(db, businessId, feed.id, match.transactions)).imported;
    await db.update(bankFeeds).set({ lastSyncedAt: new Date() }).where(eq(bankFeeds.id, feed.id));
  }
  if (imported) await logActivity(db, businessId, `Imported ${imported} new transaction${imported === 1 ? "" : "s"} from your bank`);
  return { imported };
}

// ---------------------------------------------------------------------------
// Vendors

export async function vendorSummaries(db: Exec, businessId: string) {
  return db
    .select({
      id: vendors.id,
      name: vendors.name,
      email: vendors.email,
      paidCents: sql<number>`coalesce(sum(case when ${bills.status} = 'paid' then ${bills.amountCents} else 0 end), 0)::bigint`.mapWith(Number),
      owedCents: sql<number>`coalesce(sum(case when ${bills.status} = 'unpaid' then ${bills.amountCents} else 0 end), 0)::bigint`.mapWith(Number),
      billCount: sql<number>`count(${bills.id})`.mapWith(Number),
      nextDue: sql<string | null>`min(case when ${bills.status} = 'unpaid' then ${bills.dueDate} end)::text`,
    })
    .from(vendors)
    .leftJoin(bills, eq(bills.vendorId, vendors.id))
    .where(eq(vendors.businessId, businessId))
    .groupBy(vendors.id, vendors.name, vendors.email)
    .orderBy(asc(vendors.name));
}

export async function vendorNames(db: Exec, businessId: string) {
  const rows = await db.select({ name: vendors.name }).from(vendors).where(eq(vendors.businessId, businessId)).orderBy(asc(vendors.name));
  return rows.map((r) => r.name);
}

export async function addVendor(db: Exec, businessId: string, input: { name: string; email?: string | null }) {
  const name = input.name.trim();
  if (!name) throw new OpError("Add the vendor's name.");
  const email = input.email?.trim() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new OpError("That email address doesn't look right.");
  const [existing] = await db.select().from(vendors).where(and(eq(vendors.businessId, businessId), ilike(vendors.name, name.replace(/[%_\\]/g, (c) => "\\" + c))));
  if (existing) throw new OpError(`${existing.name} is already in your vendors.`);
  const [row] = await db.insert(vendors).values({ businessId, name, email }).returning();
  return row;
}

/** The account bills are paid from by default ("main cash account"). */
export async function mainCashAccount(db: Exec, businessId: string) {
  return accountBySubtype(db, businessId, "cash");
}
