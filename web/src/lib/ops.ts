import { randomBytes } from "node:crypto";
import { and, asc, eq, ilike, sql } from "drizzle-orm";
import {
  accounts,
  bankFeeds,
  bankTransactions,
  bills,
  businesses,
  customers,
  expenses,
  invoiceLines,
  invoices,
  merchantRules,
  payments,
  payrollRuns,
  vendors,
} from "@/db/schema";
import { logActivity, sendEmail } from "./activity";
import { formatDate } from "./dates";
import { accountByCode, accountBySubtype, deleteEntry, LedgerError, postEntry, type Exec } from "./ledger";
import { formatMoney } from "./money";
import { bankProvider, type FeedTransaction, payrollProvider } from "./providers";

/**
 * Business operations. Every function that moves money posts a balanced
 * journal entry through the ledger, then records what happened in the
 * "Handled for you" log. Callers wrap these in a transaction where several
 * steps must succeed together.
 */

export class OpError extends Error {}

// ---------------------------------------------------------------------------
// Customers and vendors

export async function createCustomer(db: Exec, businessId: string, input: { name: string; email?: string | null; phone?: string | null; address?: string | null }) {
  const name = input.name.trim();
  if (!name) throw new OpError("Customer name is required.");
  const [row] = await db
    .insert(customers)
    .values({ businessId, name, email: input.email?.trim() || null, phone: input.phone?.trim() || null, address: input.address?.trim() || null })
    .returning();
  return row;
}

export async function findOrCreateVendor(db: Exec, businessId: string, name: string) {
  const clean = name.trim();
  if (!clean) throw new OpError("Vendor name is required.");
  const [existing] = await db.select().from(vendors).where(and(eq(vendors.businessId, businessId), ilike(vendors.name, clean))).limit(1);
  if (existing) return existing;
  const [row] = await db.insert(vendors).values({ businessId, name: clean }).returning();
  return row;
}

// ---------------------------------------------------------------------------
// Invoices and payments (Coming in)

export type InvoiceLineInput = { description: string; quantity: number; unitCents: number };

export async function createInvoice(
  db: Exec,
  businessId: string,
  input: {
    customerId: string;
    issueDate: string;
    dueDate: string;
    memo?: string | null;
    lines: InvoiceLineInput[];
    allowCard?: boolean;
    allowBank?: boolean;
    repeatMonthly?: boolean;
  },
) {
  const lines = input.lines.filter((l) => l.description.trim() && l.quantity > 0 && l.unitCents >= 0);
  if (!lines.length) throw new OpError("Add at least one line with a description and an amount.");
  if (input.dueDate < input.issueDate) throw new OpError("The due date can't be before the invoice date.");
  const [customer] = await db.select().from(customers).where(and(eq(customers.id, input.customerId), eq(customers.businessId, businessId)));
  if (!customer) throw new OpError("Choose a customer.");

  const [biz] = await db
    .update(businesses)
    .set({ nextInvoiceNo: sql`${businesses.nextInvoiceNo} + 1` })
    .where(eq(businesses.id, businessId))
    .returning({ prefix: businesses.invoicePrefix, next: businesses.nextInvoiceNo });
  const number = `${biz.prefix}${String(biz.next - 1).padStart(4, "0")}`;
  const total = lines.reduce((s, l) => s + l.quantity * l.unitCents, 0);
  if (total <= 0) throw new OpError("The invoice total must be more than $0.");

  const [inv] = await db
    .insert(invoices)
    .values({
      businessId,
      customerId: customer.id,
      number,
      status: "draft",
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      memo: input.memo?.trim() || null,
      totalCents: total,
      publicToken: randomBytes(18).toString("base64url"),
      allowCard: input.allowCard ?? true,
      allowBank: input.allowBank ?? true,
      repeatMonthly: input.repeatMonthly ?? false,
    })
    .returning();
  await db.insert(invoiceLines).values(
    lines.map((l, i) => ({ invoiceId: inv.id, position: i, description: l.description.trim(), quantity: l.quantity, unitCents: l.unitCents, amountCents: l.quantity * l.unitCents })),
  );
  return inv;
}

async function getInvoice(db: Exec, businessId: string, invoiceId: string) {
  const [row] = await db
    .select({ invoice: invoices, customer: customers })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(eq(invoices.id, invoiceId), eq(invoices.businessId, businessId)));
  if (!row) throw new OpError("Invoice not found.");
  return row;
}

/** Sends a draft: posts the sale (money customers owe you ↑, sales ↑) and emails the customer a pay link. */
export async function sendInvoice(db: Exec, businessId: string, invoiceId: string, opts: { appUrl: string; businessName: string }) {
  const { invoice, customer } = await getInvoice(db, businessId, invoiceId);
  if (invoice.status !== "draft") throw new OpError("Only drafts can be sent.");
  const ar = await accountBySubtype(db, businessId, "ar");
  const sales = await accountBySubtype(db, businessId, "sales");
  await postEntry(db, {
    businessId,
    date: invoice.issueDate,
    memo: `Invoice ${invoice.number} to ${customer.name}`,
    sourceType: "invoice",
    sourceId: invoice.id,
    lines: [
      { accountId: ar.id, debit: invoice.totalCents },
      { accountId: sales.id, credit: invoice.totalCents },
    ],
  });
  await db.update(invoices).set({ status: "sent", sentAt: new Date() }).where(eq(invoices.id, invoice.id));
  const link = `${opts.appUrl}/i/${invoice.publicToken}`;
  if (customer.email) {
    await sendEmail(db, {
      businessId,
      to: customer.email,
      subject: `${opts.businessName} sent you invoice ${invoice.number} for ${formatMoney(invoice.totalCents)}`,
      text: `Hi ${customer.name},\n\nHere's invoice ${invoice.number} for ${formatMoney(invoice.totalCents)}, due ${formatDate(invoice.dueDate, { month: "long", day: "numeric" })}.\n\nView and pay it online: ${link}\n\nThanks,\n${opts.businessName}`,
      link,
    });
  }
  await logActivity(db, businessId, `Sent invoice ${invoice.number} to ${customer.name} for ${formatMoney(invoice.totalCents)}`);
}

/** Records money received against an invoice (money customers owe you ↓, cash ↑). */
export async function recordPayment(
  db: Exec,
  businessId: string,
  invoiceId: string,
  input: { amountCents: number; method: string; receivedOn: string; depositAccountId?: string; providerRef?: string | null },
) {
  const { invoice, customer } = await getInvoice(db, businessId, invoiceId);
  if (invoice.status !== "sent") throw new OpError("This invoice isn't waiting for payment.");
  const open = invoice.totalCents - invoice.paidCents;
  if (input.amountCents <= 0) throw new OpError("Enter an amount more than $0.");
  if (input.amountCents > open) throw new OpError(`That's more than the ${formatMoney(open)} still owed.`);
  const deposit = input.depositAccountId ? { id: input.depositAccountId } : await accountBySubtype(db, businessId, "cash");
  const ar = await accountBySubtype(db, businessId, "ar");

  const [payment] = await db
    .insert(payments)
    .values({ businessId, invoiceId, amountCents: input.amountCents, method: input.method, receivedOn: input.receivedOn, providerRef: input.providerRef ?? null })
    .returning();
  const entryId = await postEntry(db, {
    businessId,
    date: input.receivedOn,
    memo: `Payment from ${customer.name} for ${invoice.number}`,
    sourceType: "payment",
    sourceId: payment.id,
    lines: [
      { accountId: deposit.id, debit: input.amountCents },
      { accountId: ar.id, credit: input.amountCents },
    ],
  });
  const paid = invoice.paidCents + input.amountCents;
  await db
    .update(invoices)
    .set({ paidCents: paid, status: paid >= invoice.totalCents ? "paid" : "sent" })
    .where(eq(invoices.id, invoice.id));
  await logActivity(db, businessId, `${customer.name} paid ${formatMoney(input.amountCents)} on ${invoice.number}`);
  return { payment, entryId };
}

export async function sendReminder(db: Exec, businessId: string, invoiceId: string, opts: { appUrl: string; businessName: string; personalNote?: string }) {
  const { invoice, customer } = await getInvoice(db, businessId, invoiceId);
  if (invoice.status !== "sent") throw new OpError("Only unpaid invoices need reminders.");
  if (!customer.email) throw new OpError(`Add an email address for ${customer.name} first.`);
  const open = invoice.totalCents - invoice.paidCents;
  const link = `${opts.appUrl}/i/${invoice.publicToken}`;
  await sendEmail(db, {
    businessId,
    to: customer.email,
    subject: `A friendly reminder: ${invoice.number} for ${formatMoney(open)}`,
    text: `Hi ${customer.name},\n\n${opts.personalNote?.trim() || `Just a friendly note that invoice ${invoice.number} for ${formatMoney(open)} was due ${formatDate(invoice.dueDate, { month: "long", day: "numeric" })}.`}\n\nYou can pay it online here: ${link}\n\nThanks,\n${opts.businessName}`,
    link,
  });
  await db
    .update(invoices)
    .set({ remindersSent: invoice.remindersSent + 1, lastReminderAt: new Date() })
    .where(eq(invoices.id, invoice.id));
  await logActivity(db, businessId, `Sent a reminder to ${customer.name} about ${invoice.number}`);
}

export async function voidInvoice(db: Exec, businessId: string, invoiceId: string) {
  const { invoice } = await getInvoice(db, businessId, invoiceId);
  if (invoice.paidCents > 0) throw new OpError("This invoice has payments on it, so it can't be voided.");
  if (invoice.status === "sent") {
    const ar = await accountBySubtype(db, businessId, "ar");
    const sales = await accountBySubtype(db, businessId, "sales");
    await postEntry(db, {
      businessId,
      date: invoice.issueDate,
      memo: `Void invoice ${invoice.number}`,
      sourceType: "invoice",
      sourceId: invoice.id,
      lines: [
        { accountId: sales.id, debit: invoice.totalCents },
        { accountId: ar.id, credit: invoice.totalCents },
      ],
    });
  }
  await db.update(invoices).set({ status: "void" }).where(eq(invoices.id, invoice.id));
}

// ---------------------------------------------------------------------------
// Bills and expenses (Going out)

export async function createBill(
  db: Exec,
  businessId: string,
  input: { vendorName: string; description: string; categoryAccountId: string; amountCents: number; billDate: string; dueDate: string },
) {
  if (input.amountCents <= 0) throw new OpError("Enter an amount more than $0.");
  const vendor = await findOrCreateVendor(db, businessId, input.vendorName);
  const ap = await accountBySubtype(db, businessId, "ap");
  const [bill] = await db
    .insert(bills)
    .values({ businessId, vendorId: vendor.id, description: input.description.trim() || vendor.name, categoryAccountId: input.categoryAccountId, amountCents: input.amountCents, billDate: input.billDate, dueDate: input.dueDate })
    .returning();
  await postEntry(db, {
    businessId,
    date: input.billDate,
    memo: `Bill from ${vendor.name}: ${bill.description}`,
    sourceType: "bill",
    sourceId: bill.id,
    lines: [
      { accountId: input.categoryAccountId, debit: input.amountCents },
      { accountId: ap.id, credit: input.amountCents },
    ],
  });
  return bill;
}

export async function payBill(db: Exec, businessId: string, billId: string, input: { paidOn: string; fromAccountId?: string }) {
  const [row] = await db
    .select({ bill: bills, vendor: vendors })
    .from(bills)
    .innerJoin(vendors, eq(bills.vendorId, vendors.id))
    .where(and(eq(bills.id, billId), eq(bills.businessId, businessId)));
  if (!row) throw new OpError("Bill not found.");
  if (row.bill.status === "paid") throw new OpError("This bill is already paid.");
  const ap = await accountBySubtype(db, businessId, "ap");
  const from = input.fromAccountId ? { id: input.fromAccountId } : await accountBySubtype(db, businessId, "cash");
  await postEntry(db, {
    businessId,
    date: input.paidOn,
    memo: `Paid ${row.vendor.name}: ${row.bill.description}`,
    sourceType: "bill_payment",
    sourceId: row.bill.id,
    lines: [
      { accountId: ap.id, debit: row.bill.amountCents },
      { accountId: from.id, credit: row.bill.amountCents },
    ],
  });
  await db.update(bills).set({ status: "paid", paidOn: input.paidOn }).where(eq(bills.id, row.bill.id));
  await logActivity(db, businessId, `Paid ${row.vendor.name} ${formatMoney(row.bill.amountCents)}`);
}

export async function recordExpense(
  db: Exec,
  businessId: string,
  input: { description: string; amountCents: number; spentOn: string; paidFromAccountId: string; categoryAccountId: string },
) {
  if (!input.description.trim()) throw new OpError("Say what it was for.");
  if (input.amountCents <= 0) throw new OpError("Enter an amount more than $0.");
  const entryId = await postEntry(db, {
    businessId,
    date: input.spentOn,
    memo: input.description.trim(),
    sourceType: "expense",
    lines: [
      { accountId: input.categoryAccountId, debit: input.amountCents },
      { accountId: input.paidFromAccountId, credit: input.amountCents },
    ],
  });
  const [row] = await db
    .insert(expenses)
    .values({ businessId, description: input.description.trim(), amountCents: input.amountCents, spentOn: input.spentOn, paidFromAccountId: input.paidFromAccountId, categoryAccountId: input.categoryAccountId, journalEntryId: entryId })
    .returning();
  return row;
}

// ---------------------------------------------------------------------------
// Bank feeds and sorting

/** Merchants we already know, so the user isn't asked about them. Codes refer to DEFAULT_ACCOUNTS. */
const KNOWN_MERCHANTS: [RegExp, string][] = [
  [/WEWORK|RENT/i, "6050"],
  [/COMCAST|VERIZON|AT&T/i, "6080"],
  [/ADOBE|FIGMA|GOOGLE \*WORKSPACE|NOTION|DROPBOX/i, "6060"],
  [/DELTA|UNITED AIR|AMERICAN AIR/i, "6070"],
  [/STAPLES|OFFICE DEPOT/i, "6040"],
  [/SHELL|CHEVRON|EXXON/i, "6090"],
  [/GUSTO CONTRACTOR|UPWORK/i, "6020"],
  [/INTEREST/i, "4100"],
];

/** First guesses for merchants we don't know yet. */
const GUESSES: [RegExp, string][] = [
  [/COFFEE|CAFE|RESTAURANT|BLUE BOTTLE|SQ \*/i, "6030"],
  [/AMZN|AMAZON/i, "6040"],
  [/UBER|LYFT|TAXI/i, "6070"],
  [/CANVA|SOFTWARE|\.COM/i, "6060"],
];

const merchantKey = (description: string) => description.replace(/[0-9#*]+/g, " ").replace(/\s+/g, " ").trim().toUpperCase().slice(0, 40);

/** Connects the sandbox bank (or a real provider) and imports its transactions. */
export async function connectBank(db: Exec, businessId: string, today: string) {
  const connected = await bankProvider().connect(today);
  let imported = 0;
  for (const acct of connected) {
    const ledgerAccount =
      acct.kind === "checking" ? await accountBySubtype(db, businessId, "cash") : await accountBySubtype(db, businessId, "card");
    await db.update(accounts).set({ name: `${acct.institution} ••${acct.mask}` }).where(eq(accounts.id, ledgerAccount.id));
    const [feed] = await db
      .insert(bankFeeds)
      .values({ businessId, accountId: ledgerAccount.id, provider: bankProvider().name, institution: acct.institution, mask: acct.mask, lastSyncedAt: new Date() })
      .returning();
    imported += (await importTransactions(db, businessId, feed.id, acct.transactions)).imported;
  }
  await logActivity(db, businessId, `Connected your bank and imported ${imported} transactions`);
  return { imported };
}

export async function importTransactions(db: Exec, businessId: string, feedId: string, txns: FeedTransaction[]) {
  const [feed] = await db.select().from(bankFeeds).where(and(eq(bankFeeds.id, feedId), eq(bankFeeds.businessId, businessId)));
  if (!feed) throw new OpError("Bank feed not found.");
  const rules = await db.select().from(merchantRules).where(eq(merchantRules.businessId, businessId));
  let imported = 0;
  let autoSorted = 0;
  for (const t of txns) {
    const [tx] = await db
      .insert(bankTransactions)
      .values({ businessId, feedId, externalId: t.externalId, postedOn: t.postedOn, description: t.description, amountCents: t.amountCents })
      .onConflictDoNothing()
      .returning();
    if (!tx) continue;
    imported++;

    // 1. A deposit that exactly matches an open invoice is that invoice's payment.
    if (t.amountCents > 0) {
      const [inv] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.businessId, businessId), eq(invoices.status, "sent"), sql`${invoices.totalCents} - ${invoices.paidCents} = ${t.amountCents}`))
        .orderBy(asc(invoices.dueDate))
        .limit(1);
      if (inv) {
        const { entryId } = await recordPayment(db, businessId, inv.id, { amountCents: t.amountCents, method: "bank", receivedOn: t.postedOn, depositAccountId: feed.accountId });
        await db.update(bankTransactions).set({ status: "matched", matchedInvoiceId: inv.id, journalEntryId: entryId }).where(eq(bankTransactions.id, tx.id));
        autoSorted++;
        continue;
      }
    }

    // 2. A merchant the user taught us, or one we already know.
    const key = merchantKey(t.description);
    const rule = rules.find((r) => key.includes(r.pattern));
    const known = KNOWN_MERCHANTS.find(([re]) => re.test(t.description));
    const accountId = rule?.accountId ?? (known ? (await accountByCode(db, businessId, known[1])).id : null);
    if (accountId) {
      await categorizeTransaction(db, businessId, tx.id, accountId, { remember: false, quiet: true });
      autoSorted++;
      continue;
    }

    // 3. Otherwise ask, with our best guess.
    const guess = GUESSES.find(([re]) => re.test(t.description));
    const fallback = t.amountCents > 0 ? "4000" : "6900";
    const suggested = await accountByCode(db, businessId, guess ? guess[1] : fallback);
    await db.update(bankTransactions).set({ suggestedAccountId: suggested.id }).where(eq(bankTransactions.id, tx.id));
  }
  if (autoSorted) await logActivity(db, businessId, `Sorted ${autoSorted} transactions into the right categories`);
  return { imported, autoSorted };
}

/**
 * Puts a bank or card transaction in a category and posts it. Money out:
 * category ↑, bank/card ↓. Money in: bank ↑, category (income) ↑.
 * Re-categorizing replaces the earlier entry.
 */
export async function categorizeTransaction(
  db: Exec,
  businessId: string,
  txId: string,
  categoryAccountId: string,
  opts: { remember?: boolean; quiet?: boolean } = {},
) {
  const [row] = await db
    .select({ tx: bankTransactions, feed: bankFeeds })
    .from(bankTransactions)
    .innerJoin(bankFeeds, eq(bankTransactions.feedId, bankFeeds.id))
    .where(and(eq(bankTransactions.id, txId), eq(bankTransactions.businessId, businessId)));
  if (!row) throw new OpError("Transaction not found.");
  if (row.tx.status === "matched") throw new OpError("This deposit is matched to an invoice payment.");
  const [category] = await db.select().from(accounts).where(and(eq(accounts.id, categoryAccountId), eq(accounts.businessId, businessId)));
  if (!category) throw new LedgerError("Unknown category.");

  if (row.tx.journalEntryId) await deleteEntry(db, row.tx.journalEntryId);
  const amount = Math.abs(row.tx.amountCents);
  const moneyIn = row.tx.amountCents > 0;
  const entryId = await postEntry(db, {
    businessId,
    date: row.tx.postedOn,
    memo: row.tx.description,
    sourceType: "bank",
    sourceId: row.tx.id,
    lines: moneyIn
      ? [
          { accountId: row.feed.accountId, debit: amount },
          { accountId: category.id, credit: amount },
        ]
      : [
          { accountId: category.id, debit: amount },
          { accountId: row.feed.accountId, credit: amount },
        ],
  });
  await db
    .update(bankTransactions)
    .set({ status: "categorized", categoryAccountId: category.id, journalEntryId: entryId })
    .where(eq(bankTransactions.id, row.tx.id));
  if (opts.remember) {
    await db
      .insert(merchantRules)
      .values({ businessId, pattern: merchantKey(row.tx.description), accountId: category.id })
      .onConflictDoUpdate({ target: [merchantRules.businessId, merchantRules.pattern], set: { accountId: category.id } });
  }
  if (!opts.quiet) await logActivity(db, businessId, `Filed ${row.tx.description} under ${category.name}${opts.remember ? " and remembered it for next time" : ""}`);
}

// ---------------------------------------------------------------------------
// Payroll

export async function approvePayroll(db: Exec, businessId: string, runId: string) {
  const [run] = await db.select().from(payrollRuns).where(and(eq(payrollRuns.id, runId), eq(payrollRuns.businessId, businessId)));
  if (!run) throw new OpError("Payroll run not found.");
  if (run.status !== "pending") throw new OpError("This payroll is already approved.");
  await payrollProvider().submit({ payDate: run.payDate, totalCents: run.totalCents });
  const wages = await accountBySubtype(db, businessId, "payroll");
  const cash = await accountBySubtype(db, businessId, "cash");
  // Dated on pay day: until then it's "still to pay", afterwards it's "paid".
  const entryId = await postEntry(db, {
    businessId,
    date: run.payDate,
    memo: `Payroll for ${run.people.length} people`,
    sourceType: "payroll",
    sourceId: run.id,
    lines: [
      { accountId: wages.id, debit: run.totalCents },
      { accountId: cash.id, credit: run.totalCents },
    ],
  });
  await db.update(payrollRuns).set({ status: "approved", journalEntryId: entryId }).where(eq(payrollRuns.id, run.id));
  await logActivity(db, businessId, `Scheduled ${formatMoney(run.totalCents)} payroll for ${formatDate(run.payDate, { weekday: "long", month: "short", day: "numeric" })}`);
}

// ---------------------------------------------------------------------------
// Settings

export async function setTaxRate(db: Exec, businessId: string, bps: number) {
  if (!Number.isInteger(bps) || bps < 0 || bps > 6000) throw new OpError("Choose a rate between 0% and 60%.");
  await db.update(businesses).set({ taxRateBps: bps }).where(eq(businesses.id, businessId));
}
