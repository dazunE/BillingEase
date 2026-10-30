import type { Currency } from "../money";
import type { IsoDate, Period } from "../dates";

export type CountryCode = "uk" | "lk" | "us";
export const COUNTRY_CODES: CountryCode[] = ["uk", "lk", "us"];

export type Category = {
  id: string;
  /** Plain words shown first. */
  name: string;
  /** The official name from the return, shown small underneath. */
  official: string;
  /** Deductible from profit. Capital and entertaining are not. */
  allowable: boolean;
  scope: "business" | "property";
  /** Chart of accounts code the category posts to. */
  accountCode: string;
};

export type VatRate = { id: string; label: string; bps: number };

export type EstimateLine = { label: string; amount: number; note: string };
export type Estimate = {
  label: string;
  lines: EstimateLine[];
  total: number;
  instalments: { due: IsoDate; amount: number }[];
};

export type TaxPeriod = Period & { id: string; due: IsoDate; kind: "quarter" | "vat-month" };

export type CountryRules = {
  code: CountryCode;
  name: string;
  currency: Currency;
  locale: string;
  /** Which tax year's figures these are, and whether they've been checked against official sources. */
  rulesYear: string;
  verified: boolean;
  wording: {
    taxIdLabel: string;
    vatIdLabel: string;
    invoiceTitle: string;
    vatInvoiceTitle: string;
    practitionerNoun: string;
    practitionerTool: string;
    taxLabel: string;
  };
  features: {
    landlord: boolean;
    mileage: boolean;
    mtdQuarters: boolean;
    sscl: boolean;
    whatsapp: boolean;
    payroll: "records" | "full";
  };
  categories: Category[];
  vatRates: VatRate[];
  defaultVatRateId: string;
  /** Social Security Contribution Levy, in basis points (0 where there is none). */
  ssclBps: number;
  /** SSCL counts in the value VAT is charged on (Sri Lanka, to confirm with IRD). */
  ssclInVatBase: boolean;
  /** Turnover a year above which VAT registration is required, in minor units. */
  vatThreshold: number;
  /** How customers pay you, recorded by hand. */
  receiveMethods: string[];
  /** How you pay for things. */
  payMethods: string[];
  defaultTermsDays: number;
  defaultBasis: "cash" | "accrual";
  taxYearOf(date: IsoDate): Period;
  /** The tax periods (UK MTD quarters, Sri Lanka VAT months) that a date falls in. */
  periodOf(date: IsoDate, opts?: { quarterType?: "standard" | "calendar" }): TaxPeriod;
  /** Income tax estimate on a year's profit, in minor units. */
  estimate(profit: number, opts?: { tradingProfit?: number; financeCosts?: number; /** First calendar year of the tax year, e.g. 2026 for 2026/27. */ year?: number }): Estimate;
  askSources: string;
};

/** Progressive bands: [[width, bps], ...], last width Infinity. Amounts in minor units. */
export function bands(amount: number, list: [number, number][]): number {
  let left = Math.max(0, amount);
  let tax = 0;
  for (const [width, bps] of list) {
    if (left <= 0) break;
    const w = Math.min(left, width);
    tax += (w * bps) / 10000;
    left -= w;
  }
  return Math.round(tax);
}
