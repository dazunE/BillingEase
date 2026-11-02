import { z } from "zod";
import { endpoint, IsoDate, Minor, optionalText } from "./endpoint";
import { PayrollYear } from "./payroll";

/**
 * Yours to keep → your books: the profit and loss and balance sheet from the ledger, categories,
 * the UK's Making Tax Digital quarters, VAT (and SSCL in Sri Lanka) periods, and the tax year end.
 */

export const AccountLine = z.object({
  code: z.string(),
  name: z.string(),
  /** The official name from the return, when the account is a country category. */
  official: z.string().nullable(),
  allowable: z.boolean().nullable(),
  scope: z.enum(["business", "property"]).nullable(),
  amount: Minor,
});
export type AccountLine = z.infer<typeof AccountLine>;

export const ProfitAndLoss = z.object({
  from: IsoDate,
  to: IsoDate,
  income: z.array(AccountLine),
  expenses: z.array(AccountLine),
  totalIncome: Minor,
  totalExpenses: Minor,
  profit: Minor,
  /** Costs the tax office doesn't let you take off profit (entertaining, capital items). */
  disallowed: Minor,
});
export type ProfitAndLoss = z.infer<typeof ProfitAndLoss>;

const BalanceLine = z.object({ code: z.string(), name: z.string(), amount: Minor });
export const BalanceSheet = z.object({
  at: IsoDate,
  assets: z.array(BalanceLine),
  liabilities: z.array(BalanceLine),
  equity: z.array(BalanceLine),
  /** Profit since the books began, not yet taken out: part of what the business is worth. */
  profitToDate: Minor,
  totalAssets: Minor,
  totalLiabilities: Minor,
  totalEquity: Minor,
});
export type BalanceSheet = z.infer<typeof BalanceSheet>;

export const PeriodLock = z.object({
  from: IsoDate,
  to: IsoDate,
  label: z.string(),
  reference: z.string().nullable(),
  lockedAt: z.string(),
  lockedBy: z.string().nullable(),
});
export type PeriodLock = z.infer<typeof PeriodLock>;

export const ReadyCheck = z.object({ id: z.string(), label: z.string(), detail: z.string(), ok: z.boolean(), href: z.string().nullable() });
export type ReadyCheck = z.infer<typeof ReadyCheck>;

/** upcoming: not started. open: today is in it. closed: ended, not sent yet. sent: filed and locked. */
export const FilingState = z.enum(["upcoming", "open", "closed", "sent"]);
export type FilingState = z.infer<typeof FilingState>;

const FilingBase = {
  id: z.string(),
  label: z.string(),
  from: IsoDate,
  to: IsoDate,
  due: IsoDate,
  daysToDue: z.number().int(),
  state: FilingState,
  lock: PeriodLock.nullable(),
  checks: z.array(ReadyCheck),
};

export const Quarter = z.object({
  ...FilingBase,
  income: Minor,
  expenses: Minor,
  profit: Minor,
  /** Costs by HMRC category, from the ledger. */
  categories: z.array(AccountLine),
});
export type Quarter = z.infer<typeof Quarter>;

export const VatPeriod = z.object({
  ...FilingBase,
  /** Sales before VAT, on invoices issued in the period. */
  sales: Minor,
  outputVat: Minor,
  inputVat: Minor,
  vatPayable: Minor,
  sscl: Minor,
});
export type VatPeriod = z.infer<typeof VatPeriod>;

export const CategoryTotal = z.object({
  categoryId: z.string(),
  code: z.string(),
  name: z.string(),
  official: z.string(),
  allowable: z.boolean(),
  scope: z.enum(["business", "property"]),
  amount: Minor,
  /** Expenses and bill lines recorded in it in the period. */
  count: z.number().int(),
});
export type CategoryTotal = z.infer<typeof CategoryTotal>;

const YearQuery = z.object({ date: IsoDate.optional() });
const RangeQuery = z.object({ from: IsoDate.optional(), to: IsoDate.optional() });
const TaxYear = z.object({ label: z.string(), from: IsoDate, to: IsoDate });

export const books = {
  profitAndLoss: endpoint({ method: "GET", path: "/books/profit-and-loss", query: RangeQuery, response: ProfitAndLoss }),
  balanceSheet: endpoint({ method: "GET", path: "/books/balance-sheet", query: z.object({ at: IsoDate.optional() }), response: BalanceSheet }),
  categories: endpoint({
    method: "GET", path: "/books/categories", query: RangeQuery,
    response: z.object({ from: IsoDate, to: IsoDate, categories: z.array(CategoryTotal), toSort: z.object({ count: z.number().int(), amount: Minor }) }),
  }),
  /** The UK's Making Tax Digital quarters in the tax year holding `date` (today by default). */
  quarters: endpoint({
    method: "GET", path: "/books/quarters", query: YearQuery,
    response: z.object({ taxYear: TaxYear, current: z.string().nullable(), quarters: z.array(Quarter) }),
  }),
  /** VAT periods: Sri Lanka's monthly VAT and SSCL returns, or the UK's VAT quarters. */
  taxPeriods: endpoint({
    method: "GET", path: "/books/tax-periods", query: YearQuery,
    response: z.object({ taxYear: TaxYear, vat: z.boolean(), sscl: z.boolean(), current: z.string().nullable(), periods: z.array(VatPeriod) }),
  }),
  yearEnd: endpoint({
    method: "GET", path: "/books/year-end", query: YearQuery,
    response: z.object({
      taxYear: TaxYear,
      daysToEnd: z.number().int(),
      profitAndLoss: ProfitAndLoss,
      estimate: z.object({ label: z.string(), lines: z.array(z.object({ label: z.string(), amount: Minor, note: z.string() })), total: Minor, projectedProfit: Minor, verified: z.boolean() }),
      instalments: z.array(z.object({ due: IsoDate, amount: Minor, label: z.string() })),
      checks: z.array(ReadyCheck),
      lock: PeriodLock.nullable(),
      /** Payroll paid in the year, per person; null when the business has no payroll. */
      payroll: PayrollYear.nullable(),
    }),
  }),
  /**
   * Marks a quarter, VAT period or tax year as sent: nothing can be recorded in it afterwards
   * (the database refuses), so the figures sent stay true. It must have ended.
   */
  lockPeriod: endpoint({
    method: "POST", path: "/books/locks", roles: ["owner", "accountant"],
    body: z.object({ from: IsoDate, to: IsoDate, reference: optionalText(80) }),
    response: PeriodLock,
  }),
};
