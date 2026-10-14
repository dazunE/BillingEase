import { addMonths, monthEnd, monthLabel, monthStart, type IsoDate } from "../dates";
import { bands, type Category, type CountryRules } from "./types";

const rs = (rupees: number) => rupees * 100;

// Categories that map to the business income schedule handed to TaxWise.lk (to verify against the return).
const business: Omit<Category, "scope" | "accountCode">[] = [
  { id: "cogs", name: "Purchases and materials", official: "Cost of sales", allowable: true },
  { id: "staff", name: "Salaries and wages", official: "Salaries, wages and EPF/ETF contributions", allowable: true },
  { id: "rent", name: "Rent and rates", official: "Rent, rates and taxes on premises", allowable: true },
  { id: "utilities", name: "Electricity, water and phone", official: "Utilities and communication", allowable: true },
  { id: "travel", name: "Travel and vehicle", official: "Travelling and vehicle running expenses", allowable: true },
  { id: "repairs", name: "Repairs and maintenance", official: "Repairs and maintenance", allowable: true },
  { id: "office", name: "Office and stationery", official: "Printing, stationery and office expenses", allowable: true },
  { id: "advertising", name: "Advertising", official: "Advertising and promotion", allowable: true },
  { id: "entertaining", name: "Entertainment", official: "Entertainment (restricted)", allowable: false },
  { id: "interest", name: "Loan interest", official: "Interest on business loans", allowable: true },
  { id: "bank", name: "Bank charges", official: "Bank charges", allowable: true },
  { id: "professional", name: "Professional fees", official: "Audit, legal and professional fees", allowable: true },
  { id: "capital", name: "Equipment (capital)", official: "Capital asset (capital allowances are claimed in the return)", allowable: false },
  { id: "other", name: "Other", official: "Other expenses", allowable: true },
];

export const categories: Category[] = business.map((c, i) => ({ ...c, scope: "business" as const, accountCode: String(6000 + i * 10) }));

function yearStart(date: IsoDate): number {
  const [y, m] = date.split("-").map(Number);
  return m >= 4 ? y : y - 1;
}

export const lk: CountryRules = {
  code: "lk",
  name: "Sri Lanka",
  currency: "LKR",
  locale: "en-LK",
  rulesYear: "2026/27",
  verified: false,
  wording: {
    taxIdLabel: "TIN",
    vatIdLabel: "VAT registration number",
    invoiceTitle: "Invoice",
    vatInvoiceTitle: "Tax Invoice",
    practitionerNoun: "tax practitioner",
    practitionerTool: "TaxWise.lk",
    taxLabel: "Income tax",
  },
  features: { landlord: false, mileage: false, mtdQuarters: false, sscl: true, whatsapp: true, payroll: "full" },
  categories,
  vatRates: [
    { id: "std", label: "18%", bps: 1800 },
    { id: "fin", label: "20.5% (financial services)", bps: 2050 },
    { id: "zero", label: "0%", bps: 0 },
    { id: "exempt", label: "Exempt", bps: 0 },
  ],
  defaultVatRateId: "std",
  ssclBps: 250,
  ssclInVatBase: true,
  // Sources conflict between Rs 60M and Rs 36M a year: to verify.
  vatThreshold: rs(60_000_000),
  receiveMethods: ["Bank transfer", "Cheque", "Cash", "LankaQR"],
  payMethods: ["Bank transfer", "Cheque", "Cash", "Card"],
  defaultTermsDays: 30,
  defaultBasis: "accrual",
  taxYearOf(date) {
    const y = yearStart(date);
    return { from: `${y}-04-01`, to: `${y + 1}-03-31`, label: `${y}/${String(y + 1).slice(2)}` };
  },
  /** Monthly VAT and SSCL periods, due on the 20th of the following month (to verify). */
  periodOf(date) {
    const from = monthStart(date);
    return { id: from.slice(0, 7), kind: "vat-month", from, to: monthEnd(date), label: monthLabel(date), due: addMonths(from, 1).slice(0, 8) + "20" };
  },
  estimate(profit, opts = {}) {
    const y = opts.year ?? 2026;
    const relief = rs(1_800_000);
    const total = bands(Math.max(0, profit - relief), [[rs(1_000_000), 600], [rs(500_000), 1800], [rs(500_000), 2400], [rs(500_000), 3000], [Infinity, 3600]]);
    const q = Math.round(total / 4);
    return {
      label: "Income tax",
      lines: [
        { label: "Personal relief", amount: relief, note: "Tax-free" },
        { label: "Income tax", amount: total, note: "6%, 18%, 24%, 30% and 36% bands" },
      ],
      total,
      instalments: total > 0
        ? [
            { due: `${y}-08-15`, amount: q },
            { due: `${y}-11-15`, amount: q },
            { due: `${y + 1}-02-15`, amount: q },
            { due: `${y + 1}-05-15`, amount: total - 3 * q },
          ]
        : [],
    };
  },
  askSources: "the Inland Revenue Act, IRD guidance and gazettes, and EPF/ETF rules",
};
