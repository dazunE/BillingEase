import { z } from "zod";
import { CurrencyCode, FxRateInput, FxShown, IsoDate, Minor, Ok, PositiveMinor, endpoint, optionalText } from "./endpoint";
import { PeriodKey } from "./home";

/**
 * Going out: suppliers, expenses (paid there and then), bills (paid later), every-month costs,
 * attachments and the Going out summary. Register each in apps/api/src/routes/going-out.ts.
 */

const Id = z.string().uuid();
const optionalId = z.string().uuid().optional().nullable().transform((v) => v ?? null);
const optionalDate = z.union([IsoDate, z.literal("")]).optional().nullable().transform((v) => (v ? v : null));

// ---------------------------------------------------------------------------
// Categories and pay methods

export const OutCategory = z.object({
  id: z.string(),
  name: z.string(),
  official: z.string(),
  allowable: z.boolean(),
  scope: z.enum(["business", "property"]),
  /** Capital spending: not a cost this year, capital allowances instead. */
  capital: z.boolean(),
});
export type OutCategory = z.infer<typeof OutCategory>;

export const OutSetup = z.object({
  country: z.enum(["uk", "lk", "us"]),
  currency: z.enum(["GBP", "LKR", "USD"]),
  categories: z.array(OutCategory),
  payMethods: z.array(z.string()),
  vatRegistered: z.boolean(),
  /** UK landlords (and sole traders who also let property) get the Business or Property switch. */
  hasProperty: z.boolean(),
  /** UK only: part business, part personal. */
  businessUse: z.boolean(),
  /** "HMRC self-employment categories" / "Lines from the business income schedule". */
  categorySource: z.string(),
  vatRates: z.array(z.object({ id: z.string(), label: z.string(), bps: z.number().int() })),
  defaultVatBps: z.number().int(),
  today: IsoDate,
});
export type OutSetup = z.infer<typeof OutSetup>;

const chequeFields = {
  chequeNumber: optionalText(40),
  chequeDate: optionalDate,
  chequeBank: optionalText(80),
};

// ---------------------------------------------------------------------------
// Attachments

export const FileAttachment = z.object({
  id: z.string(),
  ownerType: z.enum(["expense", "bill"]),
  ownerId: z.string(),
  filename: z.string(),
  mime: z.string(),
  size: z.number().int(),
  createdAt: z.string(),
});
export type FileAttachment = z.infer<typeof FileAttachment>;

export const AttachmentOwnerQuery = z.object({ ownerType: z.enum(["expense", "bill"]), ownerId: Id });

// ---------------------------------------------------------------------------
// Suppliers

export const Supplier = z.object({
  id: z.string(),
  name: z.string(),
  contactName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  vatNumber: z.string().nullable(),
  defaultCategoryId: z.string().nullable(),
  defaultCategoryName: z.string().nullable(),
  notes: z.string().nullable(),
  /** The currency their bills and expenses start in; null for the home currency. */
  currency: z.string().nullable(),
  archived: z.boolean(),
  /** Paid to them this tax year (expenses and bill payments), in the home currency. */
  paidThisYear: Minor,
  /** Still owed on open bills, in the home currency at each bill's rate. */
  owed: Minor,
  openBills: z.number().int(),
});
export type Supplier = z.infer<typeof Supplier>;

export const SupplierBody = z.object({
  name: z.string().trim().min(1, "Enter the supplier's name").max(160),
  contactName: optionalText(120),
  email: z.union([z.string().trim().email("Enter an email like name@example.com"), z.literal("")]).optional().nullable().transform((v) => (v ? v : null)),
  phone: optionalText(40),
  address: optionalText(400),
  vatNumber: optionalText(40),
  defaultCategoryId: optionalText(40),
  notes: optionalText(1000),
  /** Left out or null: the home currency. */
  currency: CurrencyCode.optional().nullable().transform((v) => v ?? null),
});
export type SupplierBody = z.input<typeof SupplierBody>;

export const SupplierListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  archived: z.enum(["true", "false"]).optional(),
});

// ---------------------------------------------------------------------------
// Expenses

export const Expense = z.object({
  id: z.string(),
  spentOn: IsoDate,
  supplierId: z.string().nullable(),
  payee: z.string(),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  categoryOfficial: z.string().nullable(),
  /** What left your account, in the home currency. */
  gross: Minor,
  vat: Minor,
  /** When the receipt was in another currency: that currency, its amounts and the rate used. */
  currency: z.string().nullable(),
  fxRate: z.string().nullable(),
  originalGross: Minor.nullable(),
  originalVat: Minor.nullable(),
  bizPct: z.number().int(),
  /** What counts in Going out: gross less the personal share. */
  businessShare: Minor,
  method: z.string(),
  chequeNumber: z.string().nullable(),
  chequeDate: IsoDate.nullable(),
  chequeBank: z.string().nullable(),
  note: z.string().nullable(),
  monthlyCostId: z.string().nullable(),
  attachmentCount: z.number().int(),
  createdByName: z.string().nullable(),
  /** manual, or agent when an approved proposal (e.g. Capture) made it. */
  createdVia: z.enum(["manual", "agent", "api"]),
  createdAt: z.string(),
});
export type Expense = z.infer<typeof Expense>;

export const ExpenseBody = z.object({
  spentOn: IsoDate,
  supplierId: optionalId,
  payee: optionalText(160),
  /** Null or "" means "sort later": it posts to Spending to sort. */
  categoryId: z.string().trim().max(40).optional().nullable().transform((v) => (v ? v : null)),
  /** In `currency` (the home currency when left out). */
  gross: PositiveMinor,
  vat: Minor.min(0, "VAT can't be negative").default(0),
  /** The receipt's currency. Left out: the supplier's, else the home currency. */
  currency: CurrencyCode.optional().nullable(),
  /** Home currency per unit of `currency`. Left out: the rate on the day it was spent. */
  fxRate: FxRateInput,
  /** For a receipt in another currency: what actually left your account, in the home currency. */
  homeGross: PositiveMinor.optional().nullable(),
  bizPct: z.number().int().min(1, "Business use is between 1% and 100%").max(100, "Business use is between 1% and 100%").default(100),
  method: z.string().trim().min(1, "Pick how you paid"),
  ...chequeFields,
  note: optionalText(1000),
});
export type ExpenseBody = z.input<typeof ExpenseBody>;

export const ExpenseListQuery = z.object({
  from: IsoDate.optional(),
  to: IsoDate.optional(),
  category: z.string().max(40).optional(),
  uncategorised: z.enum(["true", "false"]).optional(),
  supplierId: Id.optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const ExpenseList = z.object({
  expenses: z.array(Expense),
  totals: z.object({ count: z.number().int(), gross: Minor, vat: Minor, businessShare: Minor }),
});

export const CategoriseBody = z.object({
  categoryId: z.string().trim().min(1, "Pick a category").max(40),
  bizPct: z.number().int().min(1).max(100).optional(),
});

// ---------------------------------------------------------------------------
// Bills

export const BillStatus = z.enum(["unpaid", "part_paid", "paid", "void"]);
export const BillDue = z.enum(["paid", "void", "overdue", "due_soon", "due"]);

export const Bill = z.object({
  id: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  reference: z.string().nullable(),
  billDate: IsoDate,
  dueDate: IsoDate,
  description: z.string(),
  /** Amounts are in `currency`; home* in the home currency at `fxRate`. */
  ...FxShown,
  net: Minor,
  vat: Minor,
  total: Minor,
  paid: Minor,
  left: Minor,
  homeTotal: Minor,
  /** Still to pay in the home currency, at the bill's rate. */
  homeLeft: Minor,
  status: BillStatus,
  due: BillDue,
  /** Days from today to the due date (negative when late). */
  daysToDue: z.number().int(),
  lastPaidOn: IsoDate.nullable(),
  attachmentCount: z.number().int(),
});
export type Bill = z.infer<typeof Bill>;

export const BillLine = z.object({
  id: z.string(),
  description: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  categoryOfficial: z.string(),
  net: Minor,
  vat: Minor,
});

export const BillPayment = z.object({
  id: z.string(),
  /** In the bill's currency. */
  amount: Minor,
  /** What left the bank, in the home currency. */
  homeAmount: Minor,
  /** Exchange rate gain (or loss, below 0) against the bill's rate, in the home currency. */
  fxGain: Minor,
  paidOn: IsoDate,
  method: z.string(),
  chequeNumber: z.string().nullable(),
  chequeDate: IsoDate.nullable(),
  chequeBank: z.string().nullable(),
  reference: z.string().nullable(),
});
export type BillPayment = z.infer<typeof BillPayment>;

export const BillDetail = z.object({
  bill: Bill,
  lines: z.array(BillLine),
  payments: z.array(BillPayment),
  attachments: z.array(FileAttachment),
  history: z.array(z.object({ date: z.string(), text: z.string() })),
});
export type BillDetail = z.infer<typeof BillDetail>;

export const BillLineBody = z.object({
  description: z.string().trim().min(1, "Say what it was for").max(300),
  categoryId: z.string().trim().min(1, "Pick a category").max(40),
  net: PositiveMinor,
  vat: Minor.min(0, "VAT can't be negative").default(0),
});

export const BillBody = z.object({
  supplierId: optionalId,
  /** Creates the supplier when there's no supplierId (or finds one with this name). */
  supplierName: optionalText(160),
  reference: optionalText(60),
  billDate: IsoDate,
  dueDate: IsoDate,
  description: optionalText(300),
  /** The bill's currency. Left out: the supplier's, else the home currency. */
  currency: CurrencyCode.optional().nullable(),
  /** Home currency per unit of `currency`. Left out: the rate on the bill date. */
  fxRate: FxRateInput,
  lines: z.array(BillLineBody).min(1, "Add at least one line").max(50),
}).refine((b) => b.supplierId || b.supplierName, { path: ["supplierName"], message: "Who sent the bill?" })
  .refine((b) => b.dueDate >= b.billDate, { path: ["dueDate"], message: "The due date can't be before the bill date" });
export type BillBody = z.input<typeof BillBody>;

export const BillPaymentBody = z.object({
  /** In the bill's currency: what it takes off the bill. */
  amount: PositiveMinor,
  /** For a bill in another currency: what left your bank, in the home currency. Left out: at the rate on the day. */
  homeAmount: PositiveMinor.optional().nullable(),
  paidOn: IsoDate,
  method: z.string().trim().min(1, "Pick how you paid"),
  ...chequeFields,
  reference: optionalText(60),
});
export type BillPaymentBody = z.input<typeof BillPaymentBody>;

export const BillListQuery = z.object({
  status: z.enum(["unpaid", "part_paid", "paid", "void", "open", "all"]).optional(),
  due: z.enum(["soon", "overdue"]).optional(),
  supplierId: Id.optional(),
});

export const BillList = z.object({
  bills: z.array(Bill),
  totals: z.object({ open: Minor, openCount: z.number().int(), overdue: Minor, overdueCount: z.number().int(), dueSoon: Minor, dueSoonCount: z.number().int() }),
});

// ---------------------------------------------------------------------------
// Every-month costs

export const MonthlyState = z.enum(["recorded", "due", "late", "paused"]);

export const MonthlyCost = z.object({
  id: z.string(),
  name: z.string(),
  supplierId: z.string().nullable(),
  supplierName: z.string().nullable(),
  categoryId: z.string(),
  categoryName: z.string(),
  amount: Minor,
  vat: Minor,
  method: z.string(),
  dayOfMonth: z.number().int(),
  active: z.boolean(),
  /** This month: recorded, still due, or late (the day has passed). */
  state: MonthlyState,
  dueOn: IsoDate,
  recordedOn: IsoDate.nullable(),
  recordedExpenseId: z.string().nullable(),
  nextOn: IsoDate,
});
export type MonthlyCost = z.infer<typeof MonthlyCost>;

export const MonthlyCostBody = z.object({
  name: z.string().trim().min(1, "Say what it is").max(160),
  supplierId: optionalId,
  categoryId: z.string().trim().min(1, "Pick a category").max(40),
  amount: PositiveMinor,
  vat: Minor.min(0, "VAT can't be negative").default(0),
  method: z.string().trim().min(1, "Pick how you pay"),
  dayOfMonth: z.number().int().min(1, "Pick a day from 1 to 28").max(28, "Pick a day from 1 to 28"),
});
export type MonthlyCostBody = z.input<typeof MonthlyCostBody>;

export const MonthlyList = z.object({
  month: z.object({ from: IsoDate, to: IsoDate, label: z.string() }),
  costs: z.array(MonthlyCost),
  totals: z.object({ perMonth: Minor, recorded: Minor, toPay: Minor, toPayCount: z.number().int() }),
});

export const RecordMonthlyBody = z.object({
  spentOn: IsoDate,
  /** Leave out to use the usual amount. */
  gross: PositiveMinor.optional(),
  method: z.string().trim().min(1).optional(),
  ...chequeFields,
});

// ---------------------------------------------------------------------------
// Summary and the money-out list

export const OutSummary = z.object({
  today: IsoDate,
  period: z.object({ key: PeriodKey, from: IsoDate, to: IsoDate, label: z.string() }),
  periods: z.array(z.object({ key: PeriodKey, label: z.string() })),
  paid: Minor,
  toPay: Minor,
  total: Minor,
  dueSoon: Minor,
  dueSoonCount: z.number().int(),
  needs: z.object({ uncategorised: z.number().int(), dueSoonBills: z.number().int(), overdueBills: z.number().int() }),
  counts: z.object({ suppliers: z.number().int(), openBills: z.number().int(), openBillsTotal: Minor, monthlyCosts: z.number().int(), monthlyToPay: Minor }),
});
export type OutSummary = z.infer<typeof OutSummary>;

export const MoneyOutItem = z.object({
  kind: z.enum(["expense", "bill_payment", "bill", "monthly"]),
  id: z.string(),
  date: IsoDate,
  name: z.string(),
  detail: z.string(),
  amount: Minor,
  href: z.string(),
  /** For bills and every-month costs still to pay. */
  due: z.enum(["overdue", "due_soon", "due", "late"]).nullable(),
  billId: z.string().nullable(),
  monthlyCostId: z.string().nullable(),
  uncategorised: z.boolean(),
});
export type MoneyOutItem = z.infer<typeof MoneyOutItem>;

export const MoneyOut = z.object({
  paid: z.array(MoneyOutItem),
  toPay: z.array(MoneyOutItem),
});

const PeriodQuery = z.object({ period: PeriodKey.optional() });

// ---------------------------------------------------------------------------

export const goingOut = {
  setup: endpoint({ method: "GET", path: "/out/categories", response: OutSetup }),
  summary: endpoint({ method: "GET", path: "/out/summary", query: PeriodQuery, response: OutSummary }),
  moneyOut: endpoint({ method: "GET", path: "/out/money", query: PeriodQuery, response: MoneyOut }),

  suppliers: endpoint({ method: "GET", path: "/out/suppliers", query: SupplierListQuery, response: z.object({ suppliers: z.array(Supplier), taxYear: z.string(), paidThisYear: Minor, owed: Minor, openBills: z.number().int() }) }),
  supplier: endpoint({
    method: "GET", path: "/out/suppliers/:id",
    response: z.object({ supplier: Supplier, expenses: z.array(Expense), bills: z.array(Bill), payments: z.array(BillPayment.extend({ billId: z.string(), billReference: z.string().nullable() })), monthlyCosts: z.array(MonthlyCost), taxYear: z.string() }),
  }),
  createSupplier: endpoint({ method: "POST", path: "/out/suppliers", body: SupplierBody, response: Supplier }),
  updateSupplier: endpoint({ method: "PATCH", path: "/out/suppliers/:id", body: SupplierBody, response: Supplier }),
  archiveSupplier: endpoint({ method: "POST", path: "/out/suppliers/:id/archive", body: z.object({ archived: z.boolean().default(true) }), response: Supplier }),

  expenses: endpoint({ method: "GET", path: "/out/expenses", query: ExpenseListQuery, response: ExpenseList }),
  expense: endpoint({ method: "GET", path: "/out/expenses/:id", response: z.object({ expense: Expense, attachments: z.array(FileAttachment) }) }),
  createExpense: endpoint({ method: "POST", path: "/out/expenses", body: ExpenseBody, response: Expense }),
  updateExpense: endpoint({ method: "PATCH", path: "/out/expenses/:id", body: ExpenseBody, response: Expense }),
  categoriseExpense: endpoint({ method: "POST", path: "/out/expenses/:id/categorise", body: CategoriseBody, response: Expense }),
  deleteExpense: endpoint({ method: "DELETE", path: "/out/expenses/:id", response: Ok }),

  bills: endpoint({ method: "GET", path: "/out/bills", query: BillListQuery, response: BillList }),
  bill: endpoint({ method: "GET", path: "/out/bills/:id", response: BillDetail }),
  createBill: endpoint({ method: "POST", path: "/out/bills", body: BillBody, response: Bill }),
  payBill: endpoint({ method: "POST", path: "/out/bills/:id/payments", body: BillPaymentBody, response: Bill }),
  voidBill: endpoint({ method: "POST", path: "/out/bills/:id/void", response: Bill }),

  monthly: endpoint({ method: "GET", path: "/out/monthly", response: MonthlyList }),
  createMonthly: endpoint({ method: "POST", path: "/out/monthly", body: MonthlyCostBody, response: MonthlyCost }),
  updateMonthly: endpoint({ method: "PATCH", path: "/out/monthly/:id", body: MonthlyCostBody, response: MonthlyCost }),
  pauseMonthly: endpoint({ method: "POST", path: "/out/monthly/:id/pause", body: z.object({ active: z.boolean() }), response: MonthlyCost }),
  deleteMonthly: endpoint({ method: "DELETE", path: "/out/monthly/:id", response: Ok }),
  recordMonthly: endpoint({ method: "POST", path: "/out/monthly/:id/record", body: RecordMonthlyBody, response: Expense }),

  /** Multipart: fields ownerType, ownerId and one file (photo or PDF, up to 10 MB). */
  uploadAttachment: endpoint({ method: "POST", path: "/out/attachments", response: FileAttachment }),
  attachments: endpoint({ method: "GET", path: "/out/attachments", query: AttachmentOwnerQuery, response: z.object({ attachments: z.array(FileAttachment) }) }),
  /** The file itself, with its content type and a Content-Disposition. `?download=1` asks for a download. */
  attachmentFile: endpoint({ method: "GET", path: "/out/attachments/:id/file", response: z.unknown() }),
  deleteAttachment: endpoint({ method: "DELETE", path: "/out/attachments/:id", response: Ok }),
};

export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "application/pdf"] as const;
