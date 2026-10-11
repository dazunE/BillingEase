import { addDays, type IsoDate } from "../dates";
import { bands, type Category, type CountryRules, type TaxPeriod } from "./types";

const gbp = (pounds: number) => pounds * 100;

// Self-employment categories as in the MTD quarterly update / SA103F, and UK property income categories.
const business: Omit<Category, "scope" | "accountCode">[] = [
  { id: "cogs", name: "Stock and materials you resell", official: "Cost of goods bought for resale or goods used", allowable: true },
  { id: "cis", name: "Subcontractors", official: "Construction industry: payments to subcontractors", allowable: true },
  { id: "staff", name: "Staff costs", official: "Wages, salaries and other staff costs", allowable: true },
  { id: "travel", name: "Car, van and travel", official: "Car, van and travel expenses", allowable: true },
  { id: "premises", name: "Premises", official: "Rent, rates, power and insurance costs", allowable: true },
  { id: "repairs", name: "Repairs", official: "Repairs and maintenance of property and equipment", allowable: true },
  { id: "office", name: "Phone, internet and office", official: "Phone, fax, stationery and other office costs", allowable: true },
  { id: "advertising", name: "Advertising", official: "Advertising and business entertainment costs", allowable: true },
  { id: "entertaining", name: "Client entertaining", official: "Business entertainment (not allowable)", allowable: false },
  { id: "interest", name: "Loan interest", official: "Interest on bank and other loans", allowable: true },
  { id: "bank", name: "Bank and card charges", official: "Bank, credit card and other financial charges", allowable: true },
  { id: "baddebts", name: "Bad debts", official: "Irrecoverable debts written off", allowable: true },
  { id: "professional", name: "Accountant and legal fees", official: "Accountancy, legal and other professional fees", allowable: true },
  { id: "capital", name: "Equipment (capital)", official: "Capital spending: capital allowances are claimed separately", allowable: false },
  { id: "other", name: "Other", official: "Other business expenses", allowable: true },
];
const property: Omit<Category, "scope" | "accountCode">[] = [
  { id: "p-running", name: "Running costs", official: "Premises running costs (rent, rates, insurance, ground rent)", allowable: true },
  { id: "p-repairs", name: "Repairs", official: "Repairs and maintenance", allowable: true },
  { id: "p-finance", name: "Mortgage interest", official: "Residential property finance costs (20% tax reduction, not a deduction)", allowable: false },
  { id: "p-professional", name: "Letting and legal fees", official: "Legal, management and other professional fees", allowable: true },
  { id: "p-services", name: "Services you provide", official: "Costs of services provided, including wages", allowable: true },
  { id: "p-travel", name: "Travel", official: "Travel costs", allowable: true },
  { id: "p-other", name: "Other", official: "Other allowable property expenses", allowable: true },
];

export const categories: Category[] = [
  ...business.map((c, i) => ({ ...c, scope: "business" as const, accountCode: String(6000 + i * 10) })),
  ...property.map((c, i) => ({ ...c, scope: "property" as const, accountCode: String(7000 + i * 10) })),
];

function taxYearStart(date: IsoDate): number {
  const [y, m, d] = date.split("-").map(Number);
  return m > 4 || (m === 4 && d >= 6) ? y : y - 1;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** MTD for Income Tax update periods. Standard: 6 Apr–5 Jul, …; calendar: Apr–Jun, … Updates are due on the 7th of the month after the standard period ends. */
function quarterOf(date: IsoDate, type: "standard" | "calendar"): TaxPeriod {
  const y = taxYearStart(date);
  const starts = type === "standard"
    ? [`${y}-04-06`, `${y}-07-06`, `${y}-10-06`, `${y + 1}-01-06`, `${y + 1}-04-06`]
    : [`${y}-04-01`, `${y}-07-01`, `${y}-10-01`, `${y + 1}-01-01`, `${y + 1}-04-01`];
  // A calendar-quarter year still starts on 6 April; dates from 1 to 5 April belong to Q4 of the year before.
  let i = starts.findIndex((s, k) => k < 4 && date >= s && date < starts[k + 1]);
  if (i < 0) i = date < starts[0] ? 0 : 3;
  const from = starts[i], to = addDays(starts[i + 1], -1);
  // Both kinds share the deadline: the 7th of the month after the standard period ends (5 Jul → 7 Aug).
  const [ty, tm, td] = to.split("-").map(Number);
  const step = td === 5 ? 1 : 2;
  const dueMonth = tm + step > 12 ? tm + step - 12 : tm + step;
  const dueYear = tm + step > 12 ? ty + 1 : ty;
  return {
    id: `${y}-q${i + 1}`, kind: "quarter", from, to,
    label: `Q${i + 1} ${y}/${String(y + 1).slice(2)}`,
    due: `${dueYear}-${pad(dueMonth)}-07`,
  };
}

export const uk: CountryRules = {
  code: "uk",
  name: "United Kingdom",
  currency: "GBP",
  locale: "en-GB",
  rulesYear: "2026/27",
  verified: false,
  wording: {
    taxIdLabel: "UTR",
    vatIdLabel: "VAT number",
    invoiceTitle: "Invoice",
    vatInvoiceTitle: "VAT invoice",
    practitionerNoun: "accountant",
    practitionerTool: "TaxWise practice workbench",
    taxLabel: "Income Tax and NI",
  },
  features: { landlord: true, mileage: true, mtdQuarters: true, sscl: false, whatsapp: false, payroll: "records" },
  categories,
  vatRates: [
    { id: "std", label: "20%", bps: 2000 },
    { id: "reduced", label: "5%", bps: 500 },
    { id: "zero", label: "0%", bps: 0 },
    { id: "exempt", label: "Exempt", bps: 0 },
    { id: "outside", label: "Outside the scope of VAT", bps: 0 },
  ],
  defaultVatRateId: "std",
  ssclBps: 0,
  ssclInVatBase: false,
  vatThreshold: gbp(90000),
  receiveMethods: ["Bank transfer", "Card machine", "Cash", "Cheque"],
  payMethods: ["Bank transfer", "Card", "Cash", "Direct debit", "Cheque"],
  defaultTermsDays: 14,
  defaultBasis: "cash",
  taxYearOf(date) {
    const y = taxYearStart(date);
    return { from: `${y}-04-06`, to: `${y + 1}-04-05`, label: `${y}/${String(y + 1).slice(2)}` };
  },
  periodOf(date, opts) {
    return quarterOf(date, opts?.quarterType ?? "standard");
  },
  /** Income Tax (England, Wales and NI bands) plus Class 4 NI on trading profit only. */
  estimate(profit, opts = {}) {
    let pa = gbp(12570);
    if (profit > gbp(100000)) pa = Math.max(0, pa - Math.round((profit - gbp(100000)) / 2));
    const taxable = Math.max(0, profit - pa);
    const incomeTaxGross = bands(taxable, [[gbp(37700), 2000], [gbp(125140) - gbp(37700) - gbp(12570), 4000], [Infinity, 4500]]);
    const trading = opts.tradingProfit != null ? Math.min(profit, Math.max(0, opts.tradingProfit)) : profit;
    const ni = bands(Math.max(0, trading - gbp(12570)), [[gbp(50270) - gbp(12570), 600], [Infinity, 200]]);
    const financeRelief = Math.round((opts.financeCosts ?? 0) * 0.2);
    const incomeTax = Math.max(0, incomeTaxGross - financeRelief);
    const total = incomeTax + ni;
    const y = opts.year ?? 2026;
    return {
      label: "Income Tax and NI",
      lines: [
        { label: "Personal allowance", amount: pa, note: "Tax-free" },
        { label: "Income Tax", amount: incomeTax, note: "20%, 40% and 45% bands" + (financeRelief ? ", less mortgage interest relief" : "") },
        { label: "Class 4 National Insurance", amount: ni, note: "6% then 2%, on trading profit" },
      ],
      total,
      instalments: total > gbp(1000)
        ? [{ due: `${y + 1}-01-31`, amount: Math.round(total / 2) }, { due: `${y + 1}-07-31`, amount: total - Math.round(total / 2) }]
        : [],
    };
  },
  askSources: "HMRC manuals, gov.uk guidance and UK legislation",
};
