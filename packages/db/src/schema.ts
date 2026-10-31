import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Money is always whole minor units (pence, cents) in a bigint, never a float.
const money = (name: string) => bigint(name, { mode: "number" });
const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
/**
 * An exchange rate: units of the home currency per unit of the document's currency, exact to 10
 * decimal places. Read back as a string ("0.7912000000"), never a float.
 */
const fxRate = (name = "fx_rate") => numeric(name, { precision: 22, scale: 10 });
/**
 * What a document is written in, and the same amounts in the business's home currency for the
 * books. For a document in the home currency the rate is 1 and the home amounts are the same.
 */
const homeMoney = (name: string) => money(name).notNull().default(0);
const businessId = () => uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" });
/** Cheque details, kept for Sri Lanka (and UK cheques). */
const cheque = {
  chequeNumber: text("cheque_number"),
  chequeDate: date("cheque_date"),
  chequeBank: text("cheque_bank"),
};

// ---------------------------------------------------------------------------
// People and businesses

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    // sha256 of the token; the raw token never touches the database
    id: text("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user").on(t.userId)],
);

export const passwordResets = pgTable("password_resets", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const COUNTRIES = ["uk", "lk", "us"] as const;
export const BUSINESS_KINDS = ["sole_trader", "landlord", "both", "sole_proprietor", "partnership"] as const;

export const businesses = pgTable(
  "businesses",
  {
    id: id(),
    // Fixed at sign-up: a business in another country is a new business.
    country: text("country").$type<(typeof COUNTRIES)[number]>().notNull(),
    currency: text("currency").$type<"GBP" | "LKR" | "USD">().notNull(),
    name: text("name").notNull(),
    legalName: text("legal_name"),
    kind: text("kind").$type<(typeof BUSINESS_KINDS)[number]>().notNull(),
    ownerName: text("owner_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    town: text("town"),
    region: text("region"),
    postcode: text("postcode"),
    // UTR in the UK, TIN in Sri Lanka, EIN in the US
    taxId: text("tax_id"),
    vatRegistered: boolean("vat_registered").notNull().default(false),
    vatNumber: text("vat_number"),
    ssclRegistered: boolean("sscl_registered").notNull().default(false),
    basis: text("basis").$type<"cash" | "accrual">().notNull(),
    quarterType: text("quarter_type").$type<"standard" | "calendar">().notNull().default("standard"),
    invoicePrefix: text("invoice_prefix").notNull().default("INV-"),
    nextInvoiceNo: integer("next_invoice_no").notNull().default(1),
    nextQuoteNo: integer("next_quote_no").notNull().default(1),
    nextCreditNo: integer("next_credit_no").notNull().default(1),
    termsDays: integer("terms_days").notNull(),
    invoiceNote: text("invoice_note"),
    // Bank details printed on invoices so customers can pay by transfer.
    paymentDetails: text("payment_details"),
    accent: text("accent").notNull().default("#7A5AF8"),
    // How invoices, quotes and credit notes look: the layout, the typeface, a line printed at the
    // foot of every page, and the business's own logo (PNG or JPEG, kept in file storage).
    template: text("template").$type<"classic" | "modern" | "minimal">().notNull().default("classic"),
    font: text("font").$type<"sans" | "serif" | "mono">().notNull().default("sans"),
    footer: text("footer"),
    logoKey: text("logo_key"),
    logoMime: text("logo_mime"),
    // Optional settings that don't need their own column (WhatsApp reminders, invoice language, ...).
    settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("businesses_country", sql`${t.country} in ('uk','lk','us')`),
    check("businesses_currency", sql`(${t.country} = 'uk' and ${t.currency} = 'GBP') or (${t.country} = 'lk' and ${t.currency} = 'LKR') or (${t.country} = 'us' and ${t.currency} = 'USD')`),
    check("businesses_basis", sql`${t.basis} in ('cash','accrual')`),
    check("businesses_terms", sql`${t.termsDays} between 0 and 365`),
    check("businesses_template", sql`${t.template} in ('classic','modern','minimal')`),
    check("businesses_font", sql`${t.font} in ('sans','serif','mono')`),
  ],
);

export const ROLES = ["owner", "accountant", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const memberships = pgTable(
  "memberships",
  {
    businessId: businessId(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<Role>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.businessId, t.userId] }),
    index("memberships_user").on(t.userId),
    check("memberships_role", sql`${t.role} in ('owner','accountant','admin')`),
  ],
);

// ---------------------------------------------------------------------------
// Chart of accounts and the ledger

export const accounts = pgTable(
  "accounts",
  {
    id: id(),
    businessId: businessId(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    type: text("type").$type<"asset" | "liability" | "equity" | "income" | "expense">().notNull(),
    // bank | cash | receivable | payable | vat_input | vat_output | sscl | sales | ... (see core/ledger.ts)
    role: text("role"),
    // The country category this expense account is for.
    categoryId: text("category_id"),
    official: text("official"),
    allowable: boolean("allowable"),
    scope: text("scope").$type<"business" | "property">(),
    archived: boolean("archived").notNull().default(false),
  },
  (t) => [
    uniqueIndex("accounts_business_code").on(t.businessId, t.code),
    check("accounts_type", sql`${t.type} in ('asset','liability','equity','income','expense')`),
  ],
);

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: id(),
    businessId: businessId(),
    entryDate: date("entry_date").notNull(),
    memo: text("memo").notNull(),
    // invoice | credit_note | receipt | expense | bill | bill_payment | journal | opening
    sourceType: text("source_type").notNull(),
    sourceId: uuid("source_id"),
    // Corrections never edit an entry: they post its reversal and a new entry.
    reversesEntryId: uuid("reverses_entry_id"),
    reversedAt: timestamp("reversed_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("journal_entries_business_date").on(t.businessId, t.entryDate), index("journal_entries_source").on(t.sourceType, t.sourceId)],
);

export const journalLines = pgTable(
  "journal_lines",
  {
    id: id(),
    entryId: uuid("entry_id").notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
    businessId: businessId(),
    accountId: uuid("account_id").notNull().references(() => accounts.id),
    debit: money("debit").notNull().default(0),
    credit: money("credit").notNull().default(0),
  },
  (t) => [
    index("journal_lines_entry").on(t.entryId),
    index("journal_lines_account").on(t.accountId),
    check("journal_lines_one_side", sql`${t.debit} >= 0 and ${t.credit} >= 0 and ((${t.debit} = 0) <> (${t.credit} = 0))`),
  ],
);

/** A filed period: the database refuses ledger entries dated inside it. */
export const lockedPeriods = pgTable(
  "locked_periods",
  {
    id: id(),
    businessId: businessId(),
    fromDate: date("from_date").notNull(),
    toDate: date("to_date").notNull(),
    label: text("label").notNull(),
    reference: text("reference"),
    lockedBy: uuid("locked_by").references(() => users.id, { onDelete: "set null" }),
    lockedAt: timestamp("locked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("locked_periods_business").on(t.businessId), check("locked_periods_range", sql`${t.fromDate} <= ${t.toDate}`)],
);

// ---------------------------------------------------------------------------
// Coming in

export const customers = pgTable(
  "customers",
  {
    id: id(),
    businessId: businessId(),
    name: text("name").notNull(),
    contactName: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    taxId: text("tax_id"),
    vatNumber: text("vat_number"),
    notes: text("notes"),
    // The currency new quotes and invoices for this customer start in. Null: the home currency.
    currency: text("currency"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("customers_business").on(t.businessId)],
);

/** The price list: products and services. */
export const items = pgTable(
  "items",
  {
    id: id(),
    businessId: businessId(),
    name: text("name").notNull(),
    description: text("description"),
    unit: text("unit"),
    unitPrice: money("unit_price").notNull(),
    vatRateId: text("vat_rate_id"),
    sscl: boolean("sscl").notNull().default(true),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("items_business").on(t.businessId), check("items_price", sql`${t.unitPrice} >= 0`)],
);

export const INVOICE_STATUSES = ["draft", "sent", "part_paid", "paid", "void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

/** What the seller and buyer looked like when the invoice was issued, so later edits don't change it. */
export type InvoiceSnapshot = {
  title: string;
  seller: { name: string; legalName?: string | null; address: string; taxId?: string | null; vatNumber?: string | null; email?: string | null; phone?: string | null };
  buyer: { name: string; address?: string | null; taxId?: string | null; vatNumber?: string | null; email?: string | null };
  paymentDetails?: string | null;
  note?: string | null;
};

export const invoices = pgTable(
  "invoices",
  {
    id: id(),
    businessId: businessId(),
    kind: text("kind").$type<"invoice" | "credit_note">().notNull().default("invoice"),
    number: text("number"),
    customerId: uuid("customer_id").notNull().references(() => customers.id),
    status: text("status").$type<InvoiceStatus>().notNull().default("draft"),
    issueDate: date("issue_date").notNull(),
    // Time of supply / date of delivery, when it differs from the issue date.
    supplyDate: date("supply_date"),
    dueDate: date("due_date").notNull(),
    reference: text("reference"),
    notes: text("notes"),
    // Amounts below are in `currency`; home_* are the same in the home currency, at `fx_rate`.
    currency: text("currency").notNull(),
    fxRate: fxRate().notNull().default("1"),
    net: money("net").notNull().default(0),
    vat: money("vat").notNull().default(0),
    sscl: money("sscl").notNull().default(0),
    total: money("total").notNull().default(0),
    paid: money("paid").notNull().default(0),
    credited: money("credited").notNull().default(0),
    homeNet: homeMoney("home_net"),
    homeVat: homeMoney("home_vat"),
    homeSscl: homeMoney("home_sscl"),
    homeTotal: homeMoney("home_total"),
    // How much of home_total payments and credit notes have cleared from what customers owe you.
    homeCleared: homeMoney("home_cleared"),
    vatRegistered: boolean("vat_registered").notNull().default(false),
    // For a credit note: the invoice it reduces.
    creditForId: uuid("credit_for_id"),
    quoteId: uuid("quote_id"),
    recurringId: uuid("recurring_id"),
    snapshot: jsonb("snapshot").$type<InvoiceSnapshot>(),
    publicToken: text("public_token").notNull().unique(),
    journalEntryId: uuid("journal_entry_id"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    remindersSent: integer("reminders_sent").notNull().default(0),
    lastReminderAt: timestamp("last_reminder_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("invoices_business_number").on(t.businessId, t.number),
    index("invoices_business_status").on(t.businessId, t.status),
    index("invoices_customer").on(t.customerId),
    check("invoices_status", sql`${t.status} in ('draft','sent','part_paid','paid','void')`),
    check("invoices_kind", sql`${t.kind} in ('invoice','credit_note')`),
    check("invoices_amounts", sql`${t.total} >= 0 and ${t.paid} >= 0 and ${t.credited} >= 0 and ${t.paid} + ${t.credited} <= ${t.total}`),
    check("invoices_numbered", sql`${t.status} = 'draft' or ${t.number} is not null`),
    check("invoices_fx", sql`${t.fxRate} > 0 and ${t.homeCleared} >= 0 and ${t.homeCleared} <= ${t.homeTotal}`),
  ],
);

const lineColumns = () => ({
  id: id(),
  businessId: businessId(),
  position: integer("position").notNull().default(0),
  itemId: uuid("item_id").references(() => items.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  quantityMilli: integer("quantity_milli").notNull(),
  unitPrice: money("unit_price").notNull(),
  discount: money("discount").notNull().default(0),
  vatRateId: text("vat_rate_id"),
  vatBps: integer("vat_bps").notNull().default(0),
  ssclApplies: boolean("sscl_applies").notNull().default(true),
  net: money("net").notNull(),
  sscl: money("sscl").notNull().default(0),
  vat: money("vat").notNull().default(0),
  total: money("total").notNull(),
});

export const invoiceLines = pgTable("invoice_lines", {
  ...lineColumns(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
}, (t) => [index("invoice_lines_invoice").on(t.invoiceId)]);

export const QUOTE_STATUSES = ["draft", "sent", "accepted", "declined", "invoiced"] as const;

export const quotes = pgTable(
  "quotes",
  {
    id: id(),
    businessId: businessId(),
    number: text("number"),
    customerId: uuid("customer_id").notNull().references(() => customers.id),
    status: text("status").$type<(typeof QUOTE_STATUSES)[number]>().notNull().default("draft"),
    issueDate: date("issue_date").notNull(),
    expiryDate: date("expiry_date").notNull(),
    notes: text("notes"),
    currency: text("currency").notNull(),
    // Indicative only: the invoice takes the rate on its own date.
    fxRate: fxRate().notNull().default("1"),
    homeTotal: homeMoney("home_total"),
    net: money("net").notNull().default(0),
    vat: money("vat").notNull().default(0),
    sscl: money("sscl").notNull().default(0),
    total: money("total").notNull().default(0),
    vatRegistered: boolean("vat_registered").notNull().default(false),
    invoiceId: uuid("invoice_id"),
    snapshot: jsonb("snapshot").$type<InvoiceSnapshot>(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("quotes_business_number").on(t.businessId, t.number),
    index("quotes_business_status").on(t.businessId, t.status),
    check("quotes_status", sql`${t.status} in ('draft','sent','accepted','declined','invoiced')`),
  ],
);

export const quoteLines = pgTable("quote_lines", {
  ...lineColumns(),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
}, (t) => [index("quote_lines_quote").on(t.quoteId)]);

export type RecurringTemplate = {
  lines: { itemId?: string | null; description: string; quantityMilli: number; unitPrice: number; discount?: number; vatRateId?: string | null; sscl?: boolean }[];
  notes?: string | null;
  reference?: string | null;
  termsDays: number;
  /** The day of the month to bill on (1–31), so the 31st doesn't drift to the 28th after February. */
  billDay?: number;
};

export const recurringInvoices = pgTable(
  "recurring_invoices",
  {
    id: id(),
    businessId: businessId(),
    customerId: uuid("customer_id").notNull().references(() => customers.id),
    name: text("name").notNull(),
    frequency: text("frequency").$type<"weekly" | "monthly" | "quarterly" | "yearly">().notNull(),
    nextRun: date("next_run").notNull(),
    endDate: date("end_date"),
    // draft: each run makes a draft for you to check and send. send: emailed on the day.
    mode: text("mode").$type<"draft" | "send">().notNull().default("draft"),
    // Each run's invoice is in this currency, at the rate on its date.
    currency: text("currency").notNull(),
    template: jsonb("template").$type<RecurringTemplate>().notNull(),
    active: boolean("active").notNull().default(true),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("recurring_business").on(t.businessId),
    check("recurring_frequency", sql`${t.frequency} in ('weekly','monthly','quarterly','yearly')`),
    check("recurring_mode", sql`${t.mode} in ('draft','send')`),
  ],
);

/** Money received against an invoice, recorded by hand. */
export const receipts = pgTable(
  "receipts",
  {
    id: id(),
    businessId: businessId(),
    invoiceId: uuid("invoice_id").notNull().references(() => invoices.id),
    // In the invoice's currency: what it takes off the invoice.
    amount: money("amount").notNull(),
    // In the home currency: what reached the bank, and how much of the invoice's home value it
    // cleared. Any difference is an exchange rate gain or loss.
    homeAmount: homeMoney("home_amount"),
    homeCleared: homeMoney("home_cleared"),
    method: text("method").notNull(),
    receivedOn: date("received_on").notNull(),
    reference: text("reference"),
    ...cheque,
    // manual | agent | api: how the row was made; proposal_id when an approved proposal made it.
    createdVia: text("created_via").$type<"manual" | "agent" | "api">().notNull().default("manual"),
    proposalId: uuid("proposal_id"),
    journalEntryId: uuid("journal_entry_id"),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("receipts_business_date").on(t.businessId, t.receivedOn), index("receipts_invoice").on(t.invoiceId), check("receipts_positive", sql`${t.amount} > 0`)],
);

// ---------------------------------------------------------------------------
// Going out

export const suppliers = pgTable(
  "suppliers",
  {
    id: id(),
    businessId: businessId(),
    name: text("name").notNull(),
    contactName: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    vatNumber: text("vat_number"),
    defaultCategoryId: text("default_category_id"),
    notes: text("notes"),
    // The currency new bills and expenses from this supplier start in. Null: the home currency.
    currency: text("currency"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("suppliers_business").on(t.businessId)],
);

export const expenses = pgTable(
  "expenses",
  {
    id: id(),
    businessId: businessId(),
    spentOn: date("spent_on").notNull(),
    supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    // Who was paid, when there's no supplier record.
    payee: text("payee").notNull(),
    // Null until sorted: it then posts to "Spending to sort".
    categoryId: text("category_id"),
    // What left the account, including VAT.
    gross: money("gross").notNull(),
    // Input VAT on the receipt (VAT-registered businesses only).
    vat: money("vat").notNull().default(0),
    // Share used for the business, 1–100.
    bizPct: integer("biz_pct").notNull().default(100),
    // gross and vat above are what left your account, in the home currency. When the receipt was in
    // another currency, it and its amounts are kept here with the rate used.
    currency: text("currency"),
    fxRate: fxRate(),
    originalGross: money("original_gross"),
    originalVat: money("original_vat"),
    method: text("method").notNull(),
    ...cheque,
    note: text("note"),
    monthlyCostId: uuid("monthly_cost_id"),
    // manual | agent | api: how the row was made; proposal_id when an approved proposal made it.
    createdVia: text("created_via").$type<"manual" | "agent" | "api">().notNull().default("manual"),
    proposalId: uuid("proposal_id"),
    journalEntryId: uuid("journal_entry_id"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("expenses_business_date").on(t.businessId, t.spentOn),
    check("expenses_amounts", sql`${t.gross} > 0 and ${t.vat} >= 0 and ${t.vat} < ${t.gross}`),
    check("expenses_biz_pct", sql`${t.bizPct} between 1 and 100`),
  ],
);

export const BILL_STATUSES = ["unpaid", "part_paid", "paid", "void"] as const;

export const bills = pgTable(
  "bills",
  {
    id: id(),
    businessId: businessId(),
    supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
    reference: text("reference"),
    billDate: date("bill_date").notNull(),
    dueDate: date("due_date").notNull(),
    description: text("description").notNull(),
    // Amounts below are in `currency`; home_* are the same in the home currency, at `fx_rate`.
    currency: text("currency").notNull(),
    fxRate: fxRate().notNull().default("1"),
    net: money("net").notNull(),
    vat: money("vat").notNull().default(0),
    total: money("total").notNull(),
    paid: money("paid").notNull().default(0),
    homeNet: homeMoney("home_net"),
    homeVat: homeMoney("home_vat"),
    homeTotal: homeMoney("home_total"),
    homeCleared: homeMoney("home_cleared"),
    status: text("status").$type<(typeof BILL_STATUSES)[number]>().notNull().default("unpaid"),
    // manual | agent | api: how the row was made; proposal_id when an approved proposal made it.
    createdVia: text("created_via").$type<"manual" | "agent" | "api">().notNull().default("manual"),
    proposalId: uuid("proposal_id"),
    journalEntryId: uuid("journal_entry_id"),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("bills_business_status").on(t.businessId, t.status),
    check("bills_status", sql`${t.status} in ('unpaid','part_paid','paid','void')`),
    check("bills_amounts", sql`${t.total} > 0 and ${t.paid} >= 0 and ${t.paid} <= ${t.total} and ${t.total} = ${t.net} + ${t.vat}`),
    check("bills_fx", sql`${t.fxRate} > 0 and ${t.homeCleared} >= 0 and ${t.homeCleared} <= ${t.homeTotal}`),
  ],
);

export const billLines = pgTable("bill_lines", {
  id: id(),
  businessId: businessId(),
  billId: uuid("bill_id").notNull().references(() => bills.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  description: text("description").notNull(),
  categoryId: text("category_id").notNull(),
  net: money("net").notNull(),
  vat: money("vat").notNull().default(0),
}, (t) => [index("bill_lines_bill").on(t.billId)]);

export const billPayments = pgTable(
  "bill_payments",
  {
    id: id(),
    businessId: businessId(),
    billId: uuid("bill_id").notNull().references(() => bills.id),
    // In the bill's currency: what it takes off the bill.
    amount: money("amount").notNull(),
    // In the home currency: what left the bank, and how much of the bill's home value it cleared.
    homeAmount: homeMoney("home_amount"),
    homeCleared: homeMoney("home_cleared"),
    paidOn: date("paid_on").notNull(),
    method: text("method").notNull(),
    ...cheque,
    reference: text("reference"),
    // manual | agent | api: how the row was made; proposal_id when an approved proposal made it.
    createdVia: text("created_via").$type<"manual" | "agent" | "api">().notNull().default("manual"),
    proposalId: uuid("proposal_id"),
    journalEntryId: uuid("journal_entry_id"),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("bill_payments_bill").on(t.billId), check("bill_payments_positive", sql`${t.amount} > 0`)],
);

/** Exchange rates fetched from the rates service, one per day and pair, so each is fetched once. */
export const fxRates = pgTable(
  "fx_rates",
  {
    day: date("day").notNull(),
    base: text("base").notNull(),
    quote: text("quote").notNull(),
    rate: fxRate("rate").notNull(),
    source: text("source").notNull(),
    fetchedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.day, t.base, t.quote] }), check("fx_rates_positive", sql`${t.rate} > 0`)],
);

/** Costs that come round every month: you record each one with a tap. */
export const monthlyCosts = pgTable(
  "monthly_costs",
  {
    id: id(),
    businessId: businessId(),
    name: text("name").notNull(),
    supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    categoryId: text("category_id").notNull(),
    amount: money("amount").notNull(),
    vat: money("vat").notNull().default(0),
    method: text("method").notNull(),
    dayOfMonth: integer("day_of_month").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index("monthly_costs_business").on(t.businessId), check("monthly_costs_day", sql`${t.dayOfMonth} between 1 and 28`), check("monthly_costs_amount", sql`${t.amount} > 0`)],
);

/**
 * A photo or PDF kept with an expense, a bill or the business. A "capture" is one sent for the
 * capture agent to read: it moves to the expense or bill when the proposal is approved.
 */
export const attachments = pgTable(
  "attachments",
  {
    id: id(),
    businessId: businessId(),
    ownerType: text("owner_type").$type<"expense" | "bill" | "invoice" | "business" | "capture" | "statement">().notNull(),
    ownerId: uuid("owner_id").notNull(),
    storageKey: text("storage_key").notNull(),
    filename: text("filename").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("attachments_owner").on(t.ownerType, t.ownerId)],
);

// ---------------------------------------------------------------------------
// Activity, notifications, email, Ask

export const activity = pgTable(
  "activity",
  {
    id: id(),
    businessId: businessId(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    // user | agent | api_client | practice; actor_id is the user who acted or approved.
    actorKind: text("actor_kind").$type<"user" | "agent" | "api_client" | "practice">().notNull().default("user"),
    message: text("message").notNull(),
    link: text("link"),
    // clock_timestamp (not now()) so several entries in one transaction keep their order
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  },
  (t) => [index("activity_business_created").on(t.businessId, t.createdAt)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    businessId: businessId(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_business").on(t.businessId, t.createdAt)],
);

export type OutboxStatus = "kept" | "queued" | "sending" | "sent" | "failed";

export const outboxEmails = pgTable(
  "outbox_emails",
  {
    id: id(),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
    toEmail: text("to_email").notNull(),
    replyTo: text("reply_to"),
    subject: text("subject").notNull(),
    bodyText: text("body_text").notNull(),
    link: text("link"),
    // The invoice or quote attached as a PDF, if any.
    attachInvoiceId: uuid("attach_invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    attachQuoteId: uuid("attach_quote_id").references(() => quotes.id, { onDelete: "set null" }),
    // kept = stored only (no email provider set up); queued → sending → sent | failed
    status: text("status").$type<OutboxStatus>().notNull().default("queued"),
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("outbox_status").on(t.status), check("outbox_status_valid", sql`${t.status} in ('kept','queued','sending','sent','failed')`)],
);

export type AskSource = { n: number; title: string; url?: string; kind: "books" | "official" };

export const askMessages = pgTable(
  "ask_messages",
  {
    id: id(),
    businessId: businessId(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id").notNull(),
    role: text("role").$type<"user" | "assistant">().notNull(),
    content: text("content").notNull(),
    sources: jsonb("sources").$type<AskSource[]>().notNull().default([]),
    model: text("model"),
    runId: uuid("run_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  },
  (t) => [index("ask_messages_thread").on(t.threadId, t.createdAt), index("ask_messages_business").on(t.businessId, t.createdAt)],
);

// ---------------------------------------------------------------------------
// Agents: runs, their ADK sessions and steps, proposals waiting for a person, usage

/** Durable background work. Workers claim rows with FOR UPDATE SKIP LOCKED. */
export type JobStatus = "queued" | "running" | "done" | "failed";
export const jobs = pgTable(
  "jobs",
  {
    id: id(),
    queue: text("queue").notNull(),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    // At most one queued or running job per key (e.g. one run per business per agent).
    dedupeKey: text("dedupe_key"),
    status: text("status").$type<JobStatus>().notNull().default("queued"),
    runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    lockedBy: text("locked_by"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    error: text("error"),
    createdAt: createdAt(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [
    index("jobs_due").on(t.status, t.runAt),
    uniqueIndex("jobs_dedupe_open").on(t.dedupeKey).where(sql`${t.status} in ('queued','running') and ${t.dedupeKey} is not null`),
    check("jobs_status", sql`${t.status} in ('queued','running','done','failed')`),
  ],
);

/** Per business: which agents are on, and the monthly spend cap (in micro-units of USD). */
export const agentSettings = pgTable(
  "agent_settings",
  {
    businessId: businessId(),
    agent: text("agent").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    // Cost cap per calendar month, in millionths of a US dollar (Vertex AI bills in USD).
    monthlyBudgetMicros: bigint("monthly_budget_micros", { mode: "number" }),
    autoRules: jsonb("auto_rules").$type<Record<string, unknown>>().notNull().default({}),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.businessId, t.agent] })],
);

export type AgentTrigger = "user" | "schedule" | "event" | "api" | "practice";
export type AgentRunStatus = "queued" | "running" | "done" | "failed" | "stopped";
export const agentRuns = pgTable(
  "agent_runs",
  {
    id: id(),
    businessId: businessId(),
    agent: text("agent").notNull(),
    version: text("version").notNull(),
    trigger: text("trigger").$type<AgentTrigger>().notNull(),
    startedByUserId: uuid("started_by_user_id").references(() => users.id, { onDelete: "set null" }),
    apiClientId: uuid("api_client_id"),
    practiceId: uuid("practice_id"),
    status: text("status").$type<AgentRunStatus>().notNull().default("queued"),
    input: jsonb("input").$type<Record<string, unknown>>().notNull().default({}),
    output: jsonb("output").$type<Record<string, unknown>>(),
    model: text("model"),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    costMicros: bigint("cost_micros", { mode: "number" }).notNull().default(0),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("agent_runs_business").on(t.businessId, t.createdAt),
    check("agent_runs_status", sql`${t.status} in ('queued','running','done','failed','stopped')`),
    check("agent_runs_trigger", sql`${t.trigger} in ('user','schedule','event','api','practice')`),
  ],
);

/** One ADK session per run, kept by our own session service (tenancy checks, works on PGlite). */
export const agentSessions = pgTable(
  "agent_sessions",
  {
    id: text("id").primaryKey(),
    appName: text("app_name").notNull(),
    userId: text("user_id").notNull(),
    businessId: businessId(),
    runId: uuid("run_id").references(() => agentRuns.id, { onDelete: "cascade" }),
    state: jsonb("state").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("agent_sessions_user").on(t.appName, t.userId, t.updatedAt)],
);

/** ADK events of a session, in order. Append-only. */
export const agentEvents = pgTable(
  "agent_events",
  {
    sessionId: text("session_id").notNull().references(() => agentSessions.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    author: text("author"),
    event: jsonb("event").$type<Record<string, unknown>>().notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.seq] })],
);

/** Every model call and tool call of a run, with tokens and time. */
export const agentSteps = pgTable(
  "agent_steps",
  {
    id: id(),
    runId: uuid("run_id").notNull().references(() => agentRuns.id, { onDelete: "cascade" }),
    businessId: businessId(),
    seq: integer("seq").notNull(),
    kind: text("kind").$type<"model" | "tool">().notNull(),
    name: text("name").notNull(),
    input: jsonb("input").$type<unknown>(),
    output: jsonb("output").$type<unknown>(),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    costMicros: bigint("cost_micros", { mode: "number" }).notNull().default(0),
    ms: integer("ms").notNull().default(0),
    error: text("error"),
    at: timestamp("at", { withTimezone: true }).notNull().default(sql`clock_timestamp()`),
  },
  (t) => [uniqueIndex("agent_steps_run_seq").on(t.runId, t.seq), check("agent_steps_kind", sql`${t.kind} in ('model','tool')`)],
);

export const PROPOSAL_STATUSES = ["pending", "applying", "applied", "rejected", "expired", "failed"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];
export type ProposalSource = { kind: "attachment" | "statement_line" | "invoice" | "bill" | "expense" | "note"; id?: string; label: string; page?: number };

/** Something an agent wants to do. Nothing happens until a person approves it. */
export const proposals = pgTable(
  "proposals",
  {
    id: id(),
    businessId: businessId(),
    runId: uuid("run_id").references(() => agentRuns.id, { onDelete: "set null" }),
    agent: text("agent").notNull(),
    // What it would do, e.g. "expense.create"; payload is that endpoint's body.
    kind: text("kind").notNull(),
    // The invoice or bill the endpoint acts on (its :id), for kinds like "receipt.create".
    targetId: uuid("target_id"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    // 0–100
    confidence: integer("confidence"),
    sources: jsonb("sources").$type<ProposalSource[]>().notNull().default([]),
    status: text("status").$type<ProposalStatus>().notNull().default("pending"),
    proposedByKind: text("proposed_by_kind").$type<"agent" | "api_client" | "practice">().notNull().default("agent"),
    // For proposals from an outside app: its name, and the token it used.
    sourceName: text("source_name"),
    apiTokenId: uuid("api_token_id"),
    // What a person changed before approving, as {field: [before, after]}.
    edits: jsonb("edits").$type<Record<string, [unknown, unknown]>>(),
    decidedByUserId: uuid("decided_by_user_id").references(() => users.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    reason: text("reason"),
    appliedTable: text("applied_table"),
    appliedId: uuid("applied_id"),
    // What the endpoint said when it was applied, when it's worth showing (e.g. a WhatsApp link).
    result: jsonb("result").$type<Record<string, unknown>>(),
    error: text("error"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("proposals_business_status").on(t.businessId, t.status, t.createdAt),
    check("proposals_status", sql`${t.status} in ('pending','applying','applied','rejected','expired','failed')`),
    check("proposals_confidence", sql`${t.confidence} is null or ${t.confidence} between 0 and 100`),
  ],
);

/** Spend per business per month and agent, kept up to date as steps are recorded. */
export const usageMonthly = pgTable(
  "usage_monthly",
  {
    businessId: businessId(),
    // First day of the month
    month: date("month").notNull(),
    agent: text("agent").notNull(),
    runs: integer("runs").notNull().default(0),
    tokensIn: bigint("tokens_in", { mode: "number" }).notNull().default(0),
    tokensOut: bigint("tokens_out", { mode: "number" }).notNull().default(0),
    costMicros: bigint("cost_micros", { mode: "number" }).notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.businessId, t.month, t.agent] })],
);

/** Results of an agent's eval set on a model: a release is switched on only when it passes. */
export const agentEvals = pgTable(
  "agent_evals",
  {
    id: id(),
    agent: text("agent").notNull(),
    version: text("version").notNull(),
    country: text("country").$type<"uk" | "lk">().notNull(),
    model: text("model").notNull(),
    evalSet: text("eval_set").notNull(),
    score: jsonb("score").$type<Record<string, unknown>>().notNull(),
    passed: boolean("passed").notNull(),
    runAt: createdAt(),
  },
  (t) => [index("agent_evals_agent").on(t.agent, t.country, t.runAt)],
);

export type CaptureStatus = "queued" | "reading" | "done" | "failed";
export type CaptureFields = {
  kind: "receipt" | "bill";
  supplierName: string | null;
  date: string | null;
  dueDate: string | null;
  reference: string | null;
  currency: string | null;
  total: number | null;
  vat: number;
  sscl: number;
  paymentMethod: string | null;
  categoryId: string | null;
  lines: { description: string; net: number; vat: number; categoryId: string | null }[];
  confidence: number;
  checks: string[];
};

/** What the capture agent read from a photo or PDF, and the proposal it made. */
export const documentExtractions = pgTable(
  "document_extractions",
  {
    id: id(),
    businessId: businessId(),
    attachmentId: uuid("attachment_id").notNull().references(() => attachments.id, { onDelete: "cascade" }),
    runId: uuid("run_id").references(() => agentRuns.id, { onDelete: "set null" }),
    status: text("status").$type<CaptureStatus>().notNull().default("queued"),
    fields: jsonb("fields").$type<CaptureFields>(),
    model: text("model"),
    error: text("error"),
    proposalId: uuid("proposal_id").references(() => proposals.id, { onDelete: "set null" }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("document_extractions_business").on(t.businessId, t.createdAt),
    check("document_extractions_status", sql`${t.status} in ('queued','reading','done','failed')`),
  ],
);

export type StatementStatus = "queued" | "reading" | "matching" | "done" | "failed";

/** A bank statement the owner uploaded (CSV or PDF): not a feed. */
export const bankStatements = pgTable(
  "bank_statements",
  {
    id: id(),
    businessId: businessId(),
    attachmentId: uuid("attachment_id").notNull().references(() => attachments.id, { onDelete: "cascade" }),
    status: text("status").$type<StatementStatus>().notNull().default("queued"),
    format: text("format").$type<"csv" | "pdf">().notNull(),
    // How the CSV columns were read: by the header, or by the model.
    readBy: text("read_by").$type<"header" | "model">(),
    accountLabel: text("account_label"),
    periodFrom: date("period_from"),
    periodTo: date("period_to"),
    openingBalance: money("opening_balance"),
    closingBalance: money("closing_balance"),
    lineCount: integer("line_count").notNull().default(0),
    // Running balances that don't follow from the lines (a sign of a misread line).
    balanceProblems: integer("balance_problems").notNull().default(0),
    error: text("error"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("bank_statements_business").on(t.businessId, t.createdAt), check("bank_statements_status", sql`${t.status} in ('queued','reading','matching','done','failed')`)],
);

export type StatementLineStatus = "unmatched" | "matched" | "proposed" | "ignored";

/** One line of a statement: money in is positive, money out negative. Never edited after import. */
export const bankStatementLines = pgTable(
  "bank_statement_lines",
  {
    id: id(),
    statementId: uuid("statement_id").notNull().references(() => bankStatements.id, { onDelete: "cascade" }),
    businessId: businessId(),
    seq: integer("seq").notNull(),
    date: date("date").notNull(),
    description: text("description").notNull(),
    amount: money("amount").notNull(),
    balance: money("balance"),
    reference: text("reference"),
    status: text("status").$type<StatementLineStatus>().notNull().default("unmatched"),
    matchedTable: text("matched_table"),
    matchedId: uuid("matched_id"),
    proposalId: uuid("proposal_id"),
    categoryId: text("category_id"),
    note: text("note"),
  },
  (t) => [
    uniqueIndex("bank_statement_lines_seq").on(t.statementId, t.seq),
    index("bank_statement_lines_business_date").on(t.businessId, t.date),
    check("bank_statement_lines_status", sql`${t.status} in ('unmatched','matched','proposed','ignored')`),
    check("bank_statement_lines_amount", sql`${t.amount} <> 0`),
  ],
);

// ---------------------------------------------------------------------------
// Public API: apps, tokens and calls

/** What a token may do. Nothing an outside app does changes the books without a person approving. */
export type ApiScope = "books:read" | "books:propose";

/**
 * An app that signs in with OAuth. Registered by the app itself (dynamic registration), or
 * known by the URL of its metadata document (the client id is that URL).
 */
export const oauthClients = pgTable("oauth_clients", {
  // "bec_…" for registered apps; the https URL for metadata-document apps
  id: text("id").primaryKey(),
  kind: text("kind").$type<"registered" | "metadata_url">().notNull(),
  name: text("name").notNull(),
  uri: text("uri"),
  logoUri: text("logo_uri"),
  redirectUris: jsonb("redirect_uris").$type<string[]>().notNull(),
  // When a metadata document was last read; it is read again after a day.
  fetchedAt: timestamp("fetched_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [check("oauth_clients_kind", sql`${t.kind} in ('registered','metadata_url')`)]);

/** A one-time code from the consent screen, swapped for tokens within minutes. */
export const oauthCodes = pgTable("oauth_codes", {
  // sha256 of the code
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => oauthClients.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  businessId: businessId(),
  scopes: jsonb("scopes").$type<ApiScope[]>().notNull(),
  redirectUri: text("redirect_uri").notNull(),
  codeChallenge: text("code_challenge").notNull(),
  resource: text("resource"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
});

/**
 * Personal access tokens and OAuth access and refresh tokens. Each acts for one person in one
 * business, with their role at the time of each call. Only a sha256 of the token is kept.
 */
export const apiTokens = pgTable(
  "api_tokens",
  {
    id: id(),
    hash: text("hash").notNull(),
    kind: text("kind").$type<"personal" | "access" | "refresh">().notNull(),
    // The first characters, to tell tokens apart in the list.
    prefix: text("prefix").notNull(),
    name: text("name").notNull(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    businessId: businessId(),
    clientId: text("client_id").references(() => oauthClients.id, { onDelete: "cascade" }),
    scopes: jsonb("scopes").$type<ApiScope[]>().notNull(),
    // The API it may be used with (…/mcp or …/v1); null for either.
    resource: text("resource"),
    // An OAuth grant: the access and refresh tokens from one consent share it, so revoking one revokes all.
    grantId: uuid("grant_id"),
    // A refresh token once swapped; presenting it again revokes the grant.
    usedAt: timestamp("used_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("api_tokens_hash").on(t.hash),
    index("api_tokens_business").on(t.businessId, t.createdAt),
    index("api_tokens_grant").on(t.grantId),
    check("api_tokens_kind", sql`${t.kind} in ('personal','access','refresh')`),
  ],
);

/** Every call to the public API and MCP server, kept for 90 days. */
export const apiCalls = pgTable(
  "api_calls",
  {
    id: id(),
    businessId: businessId(),
    tokenId: uuid("token_id").references(() => apiTokens.id, { onDelete: "set null" }),
    clientId: text("client_id"),
    surface: text("surface").$type<"rest" | "mcp">().notNull(),
    // The route pattern (GET /v1/invoices/:id) or the MCP tool's name.
    operation: text("operation").notNull(),
    status: integer("status").notNull(),
    ms: integer("ms").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("api_calls_business").on(t.businessId, t.createdAt), index("api_calls_token").on(t.tokenId, t.createdAt)],
);

/** Calls per business per day, for the daily quota. */
export const apiUsageDaily = pgTable(
  "api_usage_daily",
  {
    businessId: businessId(),
    day: date("day").notNull(),
    calls: integer("calls").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.businessId, t.day] })],
);
