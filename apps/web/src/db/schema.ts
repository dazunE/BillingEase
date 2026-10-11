import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Money is always stored as whole cents in a bigint, never as a float.
const cents = (name: string) => bigint(name, { mode: "number" });
const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

export const sessions = pgTable("sessions", {
  // sha256 of the cookie token; the raw token never touches the database
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const businesses = pgTable("businesses", {
  id: id(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("other"),
  country: text("country").notNull().default("US"),
  currency: text("currency").notNull().default("USD"),
  // share of profit set aside for tax, in basis points (2500 = 25%)
  taxRateBps: integer("tax_rate_bps").notNull().default(2500),
  invoicePrefix: text("invoice_prefix").notNull().default("INV-"),
  nextInvoiceNo: integer("next_invoice_no").notNull().default(1),
  createdAt: createdAt(),
});

export const ACCOUNT_TYPES = ["asset", "liability", "equity", "income", "expense"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const accounts = pgTable(
  "accounts",
  {
    id: id(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    type: text("type").$type<AccountType>().notNull(),
    // cash | card | ar | ap | sales | owner | uncategorized_in | uncategorized_out | payroll
    subtype: text("subtype"),
    isSystem: boolean("is_system").notNull().default(false),
  },
  (t) => [
    uniqueIndex("accounts_business_code").on(t.businessId, t.code),
    check("accounts_type_valid", sql`${t.type} in ('asset','liability','equity','income','expense')`),
  ],
);

export const customers = pgTable(
  "customers",
  {
    id: id(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    createdAt: createdAt(),
  },
  (t) => [index("customers_business").on(t.businessId)],
);

export const vendors = pgTable(
  "vendors",
  {
    id: id(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    createdAt: createdAt(),
  },
  (t) => [index("vendors_business").on(t.businessId)],
);

export const INVOICE_STATUSES = ["draft", "sent", "paid", "void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const invoices = pgTable(
  "invoices",
  {
    id: id(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").notNull().references(() => customers.id),
    number: text("number").notNull(),
    status: text("status").$type<InvoiceStatus>().notNull().default("draft"),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    memo: text("memo"),
    totalCents: cents("total_cents").notNull().default(0),
    paidCents: cents("paid_cents").notNull().default(0),
    // unguessable token for the customer-facing pay page
    publicToken: text("public_token").notNull().unique(),
    allowCard: boolean("allow_card").notNull().default(true),
    allowBank: boolean("allow_bank").notNull().default(true),
    repeatMonthly: boolean("repeat_monthly").notNull().default(false),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    remindersSent: integer("reminders_sent").notNull().default(0),
    lastReminderAt: timestamp("last_reminder_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("invoices_business_number").on(t.businessId, t.number),
    index("invoices_business_status").on(t.businessId, t.status),
    check("invoices_status_valid", sql`${t.status} in ('draft','sent','paid','void')`),
    check("invoices_amounts_valid", sql`${t.totalCents} >= 0 and ${t.paidCents} >= 0 and ${t.paidCents} <= ${t.totalCents}`),
  ],
);

export const invoiceLines = pgTable("invoice_lines", {
  id: id(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitCents: cents("unit_cents").notNull(),
  amountCents: cents("amount_cents").notNull(),
});

export const payments = pgTable(
  "payments",
  {
    id: id(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id").notNull().references(() => invoices.id),
    amountCents: cents("amount_cents").notNull(),
    // card | bank | apple_pay | cash | check
    method: text("method").notNull(),
    receivedOn: date("received_on").notNull(),
    providerRef: text("provider_ref"),
    createdAt: createdAt(),
  },
  (t) => [check("payments_positive", sql`${t.amountCents} > 0`)],
);

export const bills = pgTable(
  "bills",
  {
    id: id(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
    description: text("description").notNull(),
    categoryAccountId: uuid("category_account_id").notNull().references(() => accounts.id),
    amountCents: cents("amount_cents").notNull(),
    billDate: date("bill_date").notNull(),
    dueDate: date("due_date").notNull(),
    // unpaid | paid
    status: text("status").notNull().default("unpaid"),
    paidOn: date("paid_on"),
    createdAt: createdAt(),
  },
  (t) => [check("bills_positive", sql`${t.amountCents} > 0`)],
);

export const expenses = pgTable("expenses", {
  id: id(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amountCents: cents("amount_cents").notNull(),
  spentOn: date("spent_on").notNull(),
  paidFromAccountId: uuid("paid_from_account_id").notNull().references(() => accounts.id),
  categoryAccountId: uuid("category_account_id").notNull().references(() => accounts.id),
  journalEntryId: uuid("journal_entry_id"),
  createdAt: createdAt(),
});

// A connected bank or card account. `provider` is "sandbox" until a real
// provider (e.g. Plaid) is configured.
export const bankFeeds = pgTable("bank_feeds", {
  id: id(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  accountId: uuid("account_id").notNull().references(() => accounts.id),
  provider: text("provider").notNull(),
  institution: text("institution").notNull(),
  mask: text("mask").notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const bankTransactions = pgTable(
  "bank_transactions",
  {
    id: id(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    feedId: uuid("feed_id").notNull().references(() => bankFeeds.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    postedOn: date("posted_on").notNull(),
    description: text("description").notNull(),
    // signed: positive = money in, negative = money out
    amountCents: cents("amount_cents").notNull(),
    // needs_review | categorized | matched | ignored
    status: text("status").notNull().default("needs_review"),
    categoryAccountId: uuid("category_account_id").references(() => accounts.id),
    suggestedAccountId: uuid("suggested_account_id").references(() => accounts.id),
    matchedInvoiceId: uuid("matched_invoice_id").references(() => invoices.id),
    journalEntryId: uuid("journal_entry_id"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("bank_tx_feed_external").on(t.feedId, t.externalId),
    index("bank_tx_business_status").on(t.businessId, t.status),
  ],
);

// "We'll remember these": merchant text → category, learned from the user's choices.
export const merchantRules = pgTable(
  "merchant_rules",
  {
    id: id(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    pattern: text("pattern").notNull(),
    accountId: uuid("account_id").notNull().references(() => accounts.id),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("merchant_rules_business_pattern").on(t.businessId, t.pattern)],
);

export const payrollRuns = pgTable("payroll_runs", {
  id: id(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  payDate: date("pay_date").notNull(),
  totalCents: cents("total_cents").notNull(),
  // [{ name, netCents, grossCents }]
  people: jsonb("people").$type<{ name: string; netCents: number; grossCents: number }[]>().notNull(),
  // pending | approved
  status: text("status").notNull().default("pending"),
  journalEntryId: uuid("journal_entry_id"),
  createdAt: createdAt(),
});

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: id(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    entryDate: date("entry_date").notNull(),
    memo: text("memo").notNull(),
    // invoice | payment | bill | bill_payment | expense | bank | payroll | transfer | opening
    sourceType: text("source_type").notNull(),
    sourceId: uuid("source_id"),
    createdAt: createdAt(),
  },
  (t) => [index("journal_entries_business_date").on(t.businessId, t.entryDate)],
);

export const journalLines = pgTable(
  "journal_lines",
  {
    id: id(),
    entryId: uuid("entry_id").notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").notNull().references(() => accounts.id),
    debitCents: cents("debit_cents").notNull().default(0),
    creditCents: cents("credit_cents").notNull().default(0),
  },
  (t) => [
    index("journal_lines_entry").on(t.entryId),
    index("journal_lines_account").on(t.accountId),
    check(
      "journal_lines_one_side",
      sql`${t.debitCents} >= 0 and ${t.creditCents} >= 0 and ((${t.debitCents} = 0) <> (${t.creditCents} = 0))`,
    ),
  ],
);

// The "Handled for you" log.
export const activity = pgTable(
  "activity",
  {
    id: id(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    // clock_timestamp (not now()) so several entries in one transaction keep their order
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  },
  (t) => [index("activity_business_created").on(t.businessId, t.createdAt)],
);

// Development mail transport: emails are stored here instead of being sent.
export type OutboxStatus = "kept" | "queued" | "sending" | "sent" | "failed";

export const outboxEmails = pgTable("outbox_emails", {
  id: id(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  bodyText: text("body_text").notNull(),
  link: text("link"),
  // the invoice attached as a PDF, if any
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  // kept = stored here only (no email provider set up); queued → sending → sent | failed
  status: text("status").$type<OutboxStatus>().notNull().default("kept"),
  error: text("error"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [
  index("outbox_status").on(t.status),
  check("outbox_status_valid", sql`${t.status} in ('kept','queued','sending','sent','failed')`),
]);
