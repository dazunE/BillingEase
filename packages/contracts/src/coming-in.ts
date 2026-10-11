import { z } from "zod";
import { endpoint, IsoDate, Ok, optionalText } from "./endpoint";

/**
 * Coming in: customers, the price list, invoices (and credit notes), payments received,
 * quotes, repeating invoices and the Coming in summary. Money is in minor units.
 */

const Uuid = z.string().uuid("Pick one from the list");
const PeriodKey = z.enum(["month", "quarter", "year"]);

// ---------------------------------------------------------------------------
// Customers

export const Customer = z.object({
  id: z.string(),
  name: z.string(),
  contactName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  /** TIN (Sri Lanka). */
  taxId: z.string().nullable(),
  /** VAT number (UK) or VAT registration number (Sri Lanka). */
  vatNumber: z.string().nullable(),
  notes: z.string().nullable(),
  archived: z.boolean(),
  createdAt: z.string(),
  /** Still to pay on issued invoices. */
  owed: z.number().int(),
  /** Of which past due. */
  late: z.number().int(),
  /** Received from them, ever. */
  paid: z.number().int(),
  openCount: z.number().int(),
});
export type Customer = z.infer<typeof Customer>;

export const CustomerBody = z.object({
  name: z.string().trim().min(1, "Enter the customer's name").max(160),
  contactName: optionalText(120),
  email: z.string().trim().max(200).optional().nullable()
    .transform((v) => (v ? v.toLowerCase() : null))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter an email like name@example.com"),
  phone: optionalText(40),
  address: optionalText(500),
  taxId: optionalText(40),
  vatNumber: optionalText(40),
  notes: optionalText(2000),
});
export type CustomerBody = z.input<typeof CustomerBody>;

// ---------------------------------------------------------------------------
// Price list

export const Item = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  unit: z.string().nullable(),
  unitPrice: z.number().int(),
  vatRateId: z.string().nullable(),
  sscl: z.boolean(),
  archived: z.boolean(),
  usedCount: z.number().int(),
});
export type Item = z.infer<typeof Item>;

export const ItemBody = z.object({
  name: z.string().trim().min(1, "Enter a name").max(160),
  description: optionalText(500),
  unit: optionalText(30),
  unitPrice: z.number({ message: "Enter a price" }).int().min(0, "The price can't be negative"),
  vatRateId: optionalText(20),
  sscl: z.boolean().default(true),
});
export type ItemBody = z.input<typeof ItemBody>;

// ---------------------------------------------------------------------------
// Lines (invoices, quotes, credit notes, repeating invoices)

export const LineInput = z.object({
  itemId: Uuid.optional().nullable(),
  description: z.string().trim().min(1, "Say what this line is for").max(500),
  /** Thousandths: 1.5 hours = 1500. */
  quantityMilli: z.number().int().positive("Quantity must be more than 0"),
  unitPrice: z.number().int().min(0, "The price can't be negative"),
  discount: z.number().int().min(0).default(0),
  vatRateId: z.string().max(20).optional().nullable(),
  /** Sri Lanka: SSCL applies to this line. */
  sscl: z.boolean().default(true),
});
export type LineInput = z.input<typeof LineInput>;

export const Line = z.object({
  id: z.string(),
  position: z.number().int(),
  itemId: z.string().nullable(),
  description: z.string(),
  quantityMilli: z.number().int(),
  unitPrice: z.number().int(),
  discount: z.number().int(),
  vatRateId: z.string().nullable(),
  vatBps: z.number().int(),
  sscl: z.boolean(),
  net: z.number().int(),
  ssclAmount: z.number().int(),
  vat: z.number().int(),
  total: z.number().int(),
});
export type Line = z.infer<typeof Line>;

const Totals = { net: z.number().int(), vat: z.number().int(), sscl: z.number().int(), total: z.number().int() };

export const Snapshot = z.object({
  title: z.string(),
  seller: z.object({ name: z.string(), legalName: z.string().nullable().optional(), address: z.string(), taxId: z.string().nullable().optional(), vatNumber: z.string().nullable().optional(), email: z.string().nullable().optional(), phone: z.string().nullable().optional() }),
  buyer: z.object({ name: z.string(), address: z.string().nullable().optional(), taxId: z.string().nullable().optional(), vatNumber: z.string().nullable().optional(), email: z.string().nullable().optional() }),
  paymentDetails: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

const ActivityRow = z.object({ message: z.string(), at: z.string() });

// ---------------------------------------------------------------------------
// Invoices

export const InvoiceStatus = z.enum(["draft", "sent", "part_paid", "paid", "void"]);
/** What the screens show: the stored status, or "late" when owed and past due. */
export const ShownStatus = z.enum(["draft", "sent", "part_paid", "paid", "void", "late"]);

export const InvoiceRow = z.object({
  id: z.string(),
  kind: z.enum(["invoice", "credit_note"]),
  number: z.string().nullable(),
  status: InvoiceStatus,
  shown: ShownStatus,
  customerId: z.string(),
  customerName: z.string(),
  issueDate: IsoDate,
  dueDate: IsoDate,
  summary: z.string(),
  ...Totals,
  paid: z.number().int(),
  credited: z.number().int(),
  open: z.number().int(),
  daysLate: z.number().int(),
  remindersSent: z.number().int(),
});
export type InvoiceRow = z.infer<typeof InvoiceRow>;

export const Receipt = z.object({
  id: z.string(),
  amount: z.number().int(),
  method: z.string(),
  receivedOn: IsoDate,
  reference: z.string().nullable(),
  chequeNumber: z.string().nullable(),
  chequeDate: z.string().nullable(),
  chequeBank: z.string().nullable(),
  voided: z.boolean(),
});
export type Receipt = z.infer<typeof Receipt>;

export const InvoiceDetail = InvoiceRow.extend({
  title: z.string(),
  supplyDate: z.string().nullable(),
  reference: z.string().nullable(),
  notes: z.string().nullable(),
  vatRegistered: z.boolean(),
  snapshot: Snapshot.nullable(),
  customer: z.object({ id: z.string(), name: z.string(), email: z.string().nullable(), phone: z.string().nullable(), address: z.string().nullable(), taxId: z.string().nullable(), vatNumber: z.string().nullable() }),
  lines: z.array(Line),
  receipts: z.array(Receipt),
  creditNotes: z.array(z.object({ id: z.string(), number: z.string().nullable(), issueDate: IsoDate, total: z.number().int() })),
  creditFor: z.object({ id: z.string(), number: z.string().nullable() }).nullable(),
  quote: z.object({ id: z.string(), number: z.string().nullable() }).nullable(),
  recurringId: z.string().nullable(),
  sentAt: z.string().nullable(),
  lastReminderAt: z.string().nullable(),
  activity: z.array(ActivityRow),
});
export type InvoiceDetail = z.infer<typeof InvoiceDetail>;

export const InvoiceBody = z.object({
  customerId: Uuid,
  issueDate: IsoDate,
  /** Date of delivery / time of supply, when it differs from the issue date. */
  supplyDate: IsoDate.optional().nullable(),
  /** Left out: the issue date plus the business's terms. */
  dueDate: IsoDate.optional().nullable(),
  reference: optionalText(80),
  notes: optionalText(2000),
  lines: z.array(LineInput).max(200),
});
export type InvoiceBody = z.input<typeof InvoiceBody>;

export const InvoiceListQuery = z.object({
  status: z.enum(["all", "draft", "unpaid", "late", "paid", "void", "sent", "part_paid"]).default("all"),
  kind: z.enum(["invoice", "credit_note"]).default("invoice"),
  customerId: Uuid.optional(),
  from: IsoDate.optional(),
  to: IsoDate.optional(),
  q: z.string().trim().max(100).optional(),
});

export const InvoiceList = z.object({
  invoices: z.array(InvoiceRow),
  totals: z.object({ count: z.number().int(), total: z.number().int(), open: z.number().int(), late: z.number().int(), paid: z.number().int() }),
  counts: z.object({ all: z.number().int(), draft: z.number().int(), unpaid: z.number().int(), late: z.number().int(), paid: z.number().int(), void: z.number().int() }),
});
export type InvoiceList = z.infer<typeof InvoiceList>;

export const IssueBody = z.object({
  /** Email it to the customer with the PDF attached. */
  email: z.boolean().default(false),
  message: optionalText(2000),
});

export const PaymentBody = z.object({
  amount: z.number({ message: "Enter the amount" }).int().positive("Enter an amount more than 0"),
  receivedOn: IsoDate,
  method: z.string().trim().min(1, "Pick how they paid"),
  reference: optionalText(120),
  chequeNumber: optionalText(40),
  chequeDate: IsoDate.optional().nullable(),
  chequeBank: optionalText(80),
});
export type PaymentBody = z.input<typeof PaymentBody>;

export const CreditNoteBody = z.object({
  /** Credit every line in full. */
  full: z.boolean().default(false),
  /** Or some lines, some of the quantity, or a lower price. */
  lines: z.array(z.object({ lineId: Uuid, quantityMilli: z.number().int().positive(), unitPrice: z.number().int().min(0).optional() })).default([]),
  issueDate: IsoDate.optional(),
  reason: optionalText(500),
  email: z.boolean().default(false),
});
export type CreditNoteBody = z.input<typeof CreditNoteBody>;

export const ReminderResult = z.object({ emailed: z.boolean(), whatsappUrl: z.string().nullable(), message: z.string() });

// ---------------------------------------------------------------------------
// Quotes

export const QuoteStatus = z.enum(["draft", "sent", "accepted", "declined", "invoiced"]);

export const QuoteRow = z.object({
  id: z.string(),
  number: z.string().nullable(),
  status: QuoteStatus,
  customerId: z.string(),
  customerName: z.string(),
  issueDate: IsoDate,
  expiryDate: IsoDate,
  summary: z.string(),
  ...Totals,
  invoiceId: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  sentAt: z.string().nullable(),
  decidedAt: z.string().nullable(),
});
export type QuoteRow = z.infer<typeof QuoteRow>;

export const QuoteDetail = QuoteRow.extend({
  notes: z.string().nullable(),
  vatRegistered: z.boolean(),
  customer: InvoiceDetail.shape.customer,
  lines: z.array(Line),
  activity: z.array(ActivityRow),
});
export type QuoteDetail = z.infer<typeof QuoteDetail>;

export const QuoteBody = z.object({
  customerId: Uuid,
  issueDate: IsoDate,
  /** Left out: 30 days after the issue date. */
  expiryDate: IsoDate.optional().nullable(),
  notes: optionalText(2000),
  lines: z.array(LineInput).max(200),
});
export type QuoteBody = z.input<typeof QuoteBody>;

export const QuoteList = z.object({
  quotes: z.array(QuoteRow),
  totals: z.object({ waiting: z.number().int(), draft: z.number().int(), accepted: z.number().int() }),
});

// ---------------------------------------------------------------------------
// Repeating invoices

export const Frequency = z.enum(["weekly", "monthly", "quarterly", "yearly"]);

export const Recurring = z.object({
  id: z.string(),
  name: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  frequency: Frequency,
  nextRun: IsoDate,
  endDate: z.string().nullable(),
  mode: z.enum(["draft", "send"]),
  active: z.boolean(),
  lastRunAt: z.string().nullable(),
  termsDays: z.number().int(),
  notes: z.string().nullable(),
  reference: z.string().nullable(),
  lines: z.array(LineInput.extend({ discount: z.number().int(), sscl: z.boolean() })),
  ...Totals,
  invoiceCount: z.number().int(),
  upcoming: z.array(IsoDate),
});
export type Recurring = z.infer<typeof Recurring>;

export const RecurringBody = z.object({
  customerId: Uuid,
  name: z.string().trim().min(1, "Give it a name").max(120),
  frequency: Frequency,
  nextRun: IsoDate,
  endDate: IsoDate.optional().nullable(),
  /** draft (default): each run makes a draft for you to check. send: issued and emailed on the day. */
  mode: z.enum(["draft", "send"]).default("draft"),
  termsDays: z.number().int().min(0).max(365),
  notes: optionalText(2000),
  reference: optionalText(80),
  lines: z.array(LineInput).min(1, "Add at least one line").max(200),
});
export type RecurringBody = z.input<typeof RecurringBody>;

// ---------------------------------------------------------------------------
// Summary

export const ComingInSummary = z.object({
  period: z.object({ key: PeriodKey, from: IsoDate, to: IsoDate, label: z.string() }),
  periods: z.array(z.object({ key: PeriodKey, label: z.string() })),
  received: z.number().int(),
  onTheWay: z.number().int(),
  total: z.number().int(),
  late: z.number().int(),
  lateCount: z.number().int(),
  lateInvoices: z.array(InvoiceRow),
  onTheWayInvoices: z.array(InvoiceRow),
  recent: z.array(InvoiceRow),
  counts: z.object({
    unpaid: z.number().int(), late: z.number().int(), drafts: z.number().int(),
    quotesWaiting: z.number().int(), recurringActive: z.number().int(), customers: z.number().int(), items: z.number().int(),
  }),
  numbers: z.object({ invoice: z.string(), quote: z.string(), creditNote: z.string() }),
});
export type ComingInSummary = z.infer<typeof ComingInSummary>;

const Archive = z.object({ archived: z.boolean() });
const Raw = z.unknown();

export const comingIn = {
  summary: endpoint({ method: "GET", path: "/in/summary", query: z.object({ period: PeriodKey.optional() }), response: ComingInSummary }),

  listCustomers: endpoint({ method: "GET", path: "/customers", query: z.object({ q: z.string().trim().max(100).optional(), archived: z.enum(["true", "false", "all"]).default("false") }), response: z.object({ customers: z.array(Customer) }) }),
  getCustomer: endpoint({
    method: "GET", path: "/customers/:id",
    response: z.object({ customer: Customer, paidThisYear: z.number().int(), yearLabel: z.string(), invoices: z.array(InvoiceRow), creditNotes: z.array(InvoiceRow), quotes: z.array(QuoteRow), recurring: z.array(Recurring) }),
  }),
  createCustomer: endpoint({ method: "POST", path: "/customers", body: CustomerBody, response: Customer }),
  updateCustomer: endpoint({ method: "PATCH", path: "/customers/:id", body: CustomerBody, response: Customer }),
  archiveCustomer: endpoint({ method: "POST", path: "/customers/:id/archive", body: Archive, response: Customer }),

  listItems: endpoint({ method: "GET", path: "/items", query: z.object({ q: z.string().trim().max(100).optional(), archived: z.enum(["true", "false", "all"]).default("false") }), response: z.object({ items: z.array(Item) }) }),
  createItem: endpoint({ method: "POST", path: "/items", body: ItemBody, response: Item }),
  updateItem: endpoint({ method: "PATCH", path: "/items/:id", body: ItemBody, response: Item }),
  archiveItem: endpoint({ method: "POST", path: "/items/:id/archive", body: Archive, response: Item }),

  listInvoices: endpoint({ method: "GET", path: "/invoices", query: InvoiceListQuery, response: InvoiceList }),
  getInvoice: endpoint({ method: "GET", path: "/invoices/:id", response: InvoiceDetail }),
  createInvoice: endpoint({ method: "POST", path: "/invoices", body: InvoiceBody, response: InvoiceDetail }),
  updateInvoice: endpoint({ method: "PATCH", path: "/invoices/:id", body: InvoiceBody, response: InvoiceDetail }),
  deleteInvoice: endpoint({ method: "DELETE", path: "/invoices/:id", response: Ok }),
  issueInvoice: endpoint({ method: "POST", path: "/invoices/:id/issue", body: IssueBody, response: InvoiceDetail.extend({ emailed: z.boolean() }) }),
  emailInvoice: endpoint({ method: "POST", path: "/invoices/:id/email", body: z.object({ message: optionalText(2000) }), response: Ok }),
  voidInvoice: endpoint({ method: "POST", path: "/invoices/:id/void", body: z.object({ reason: optionalText(500) }), response: InvoiceDetail }),
  recordPayment: endpoint({ method: "POST", path: "/invoices/:id/payments", body: PaymentBody, response: InvoiceDetail }),
  voidPayment: endpoint({ method: "POST", path: "/invoices/:id/payments/:paymentId/void", body: z.object({}), response: InvoiceDetail }),
  creditNote: endpoint({ method: "POST", path: "/invoices/:id/credit-notes", body: CreditNoteBody, response: InvoiceDetail }),
  remind: endpoint({ method: "POST", path: "/invoices/:id/remind", body: z.object({ message: optionalText(2000), email: z.boolean().default(true) }), response: ReminderResult }),
  /** Raw application/pdf. */
  invoicePdf: endpoint({ method: "GET", path: "/invoices/:id/pdf", response: Raw }),

  listQuotes: endpoint({ method: "GET", path: "/quotes", query: z.object({ status: z.enum(["all", "draft", "sent", "accepted", "declined", "invoiced"]).default("all"), customerId: Uuid.optional() }), response: QuoteList }),
  getQuote: endpoint({ method: "GET", path: "/quotes/:id", response: QuoteDetail }),
  createQuote: endpoint({ method: "POST", path: "/quotes", body: QuoteBody, response: QuoteDetail }),
  updateQuote: endpoint({ method: "PATCH", path: "/quotes/:id", body: QuoteBody, response: QuoteDetail }),
  deleteQuote: endpoint({ method: "DELETE", path: "/quotes/:id", response: Ok }),
  sendQuote: endpoint({ method: "POST", path: "/quotes/:id/send", body: IssueBody, response: QuoteDetail.extend({ emailed: z.boolean() }) }),
  decideQuote: endpoint({ method: "POST", path: "/quotes/:id/decision", body: z.object({ decision: z.enum(["accepted", "declined"]), note: optionalText(500) }), response: QuoteDetail }),
  convertQuote: endpoint({ method: "POST", path: "/quotes/:id/convert", body: z.object({}), response: z.object({ invoiceId: z.string() }) }),
  /** Raw application/pdf. */
  quotePdf: endpoint({ method: "GET", path: "/quotes/:id/pdf", response: Raw }),

  listRecurring: endpoint({ method: "GET", path: "/recurring", response: z.object({ recurring: z.array(Recurring), monthly: z.number().int() }) }),
  getRecurring: endpoint({ method: "GET", path: "/recurring/:id", response: Recurring.extend({ invoices: z.array(InvoiceRow) }) }),
  createRecurring: endpoint({ method: "POST", path: "/recurring", body: RecurringBody, response: Recurring }),
  updateRecurring: endpoint({ method: "PATCH", path: "/recurring/:id", body: RecurringBody, response: Recurring }),
  pauseRecurring: endpoint({ method: "POST", path: "/recurring/:id/pause", body: z.object({ active: z.boolean() }), response: Recurring }),
  runRecurring: endpoint({ method: "POST", path: "/recurring/:id/run", body: z.object({}), response: z.object({ invoiceId: z.string() }) }),
  deleteRecurring: endpoint({ method: "DELETE", path: "/recurring/:id", response: Ok }),
};
