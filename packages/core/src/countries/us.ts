import { addMonths, monthEnd, type IsoDate } from "../dates";
import type { Category, CountryRules } from "./types";

// Lines of Schedule C (Form 1040), which a single-member LLC files; a multi-member LLC uses the same headings on Form 1065.
const business: Omit<Category, "scope" | "accountCode">[] = [
  { id: "cogs", name: "Stock and materials you resell", official: "Cost of goods sold (Part III)", allowable: true },
  { id: "advertising", name: "Advertising", official: "Line 8: Advertising", allowable: true },
  { id: "travel", name: "Car and truck", official: "Line 9: Car and truck expenses", allowable: true },
  { id: "contract", name: "Contractors", official: "Line 11: Contract labor", allowable: true },
  { id: "insurance", name: "Insurance", official: "Line 15: Insurance (other than health)", allowable: true },
  { id: "interest", name: "Loan interest", official: "Line 16b: Interest (other)", allowable: true },
  { id: "professional", name: "Accountant and legal fees", official: "Line 17: Legal and professional services", allowable: true },
  { id: "office", name: "Office and software", official: "Line 18: Office expense", allowable: true },
  { id: "rent", name: "Rent", official: "Line 20b: Rent or lease (other business property)", allowable: true },
  { id: "repairs", name: "Repairs", official: "Line 21: Repairs and maintenance", allowable: true },
  { id: "supplies", name: "Supplies", official: "Line 22: Supplies", allowable: true },
  { id: "licenses", name: "Taxes and licenses", official: "Line 23: Taxes and licenses (including the Delaware LLC tax)", allowable: true },
  { id: "trips", name: "Travel", official: "Line 24a: Travel", allowable: true },
  { id: "meals", name: "Business meals", official: "Line 24b: Deductible meals (50%)", allowable: true },
  { id: "utilities", name: "Phone, internet and utilities", official: "Line 25: Utilities", allowable: true },
  { id: "staff", name: "Wages", official: "Line 26: Wages", allowable: true },
  { id: "bank", name: "Bank and card fees", official: "Line 27a: Other expenses (bank and merchant fees)", allowable: true },
  { id: "capital", name: "Equipment (capital)", official: "Depreciation and section 179 (Form 4562)", allowable: false },
  { id: "other", name: "Other", official: "Line 27a: Other expenses", allowable: true },
];

export const categories: Category[] = business.map((c, i) => ({ ...c, scope: "business" as const, accountCode: String(6000 + i * 10) }));

const pad = (n: number) => String(n).padStart(2, "0");
// Estimated tax deadlines for each calendar quarter: 15 April, 15 June, 15 September and 15 January.
const DUE = ["04-15", "06-15", "09-15", "01-15"];

export const us: CountryRules = {
  code: "us",
  name: "United States",
  currency: "USD",
  locale: "en-US",
  rulesYear: "2026",
  verified: false,
  wording: {
    taxIdLabel: "EIN",
    vatIdLabel: "Sales tax permit",
    invoiceTitle: "Invoice",
    vatInvoiceTitle: "Invoice",
    practitionerNoun: "accountant",
    practitionerTool: "their tax software",
    taxLabel: "Federal tax",
  },
  features: { landlord: false, mileage: false, mtdQuarters: false, sscl: false, whatsapp: false, payroll: "records" },
  categories,
  // ponytail: no sales tax. Delaware has none; add per-state rates when selling into a state that charges it.
  vatRates: [{ id: "none", label: "No sales tax", bps: 0 }],
  defaultVatRateId: "none",
  ssclBps: 0,
  ssclInVatBase: false,
  vatThreshold: 0,
  receiveMethods: ["Bank transfer", "ACH", "Card", "Check", "Cash"],
  payMethods: ["Bank transfer", "ACH", "Card", "Check", "Cash"],
  defaultTermsDays: 30,
  defaultBasis: "cash",
  taxYearOf(date) {
    const y = date.slice(0, 4);
    return { from: `${y}-01-01`, to: `${y}-12-31`, label: y };
  },
  periodOf(date) {
    const [y, m] = date.split("-").map(Number);
    const q = Math.floor((m - 1) / 3);
    const from = `${y}-${pad(q * 3 + 1)}-01`;
    return { id: `${y}-q${q + 1}`, kind: "quarter", from, to: monthEnd(addMonths(from, 2)), label: `Q${q + 1} ${y}`, due: `${q === 3 ? y + 1 : y}-${DUE[q]}` };
  },
  // ponytail: no estimate. An LLC's federal tax depends on its owners, their state and the entity election;
  // add self-employment tax and the brackets once those are asked at setup.
  estimate() {
    return { label: "Federal tax", lines: [], total: 0, instalments: [] };
  },
  askSources: "IRS publications and forms, the Internal Revenue Code, and state revenue guidance",
};
