/**
 * Sample businesses for the home page's "Try a business" demo, per country.
 * Every business, person and customer here is invented, and every figure is
 * illustrative: "Yours to keep" is profit after an estimated tax set-aside.
 */
import type { ByCountry } from "./country";
import { ROUTES } from "./routes";

export type SampleBusiness = {
  key: string;
  /** Chip text in "Try a business". */
  label: string;
  /** Short name, used in "Harper Studio this tax year". */
  name: string;
  /** Line above the three numbers. */
  caption: string;
  /** The "who it's for" page that fits this business. */
  more: { label: string; href: string };
  inPaid: number;
  inExp: number;
  outPaid: number;
  outSch: number;
  /** Estimated tax set aside so far (Income Tax + NI in the UK; income tax in Sri Lanka). */
  tax: number;
  /** One concrete example for each thing behind the numbers. */
  ex: Record<"inv" | "pay" | "rem" | "bills" | "att" | "every" | "payroll" | "tax" | "period" | "acct", string>;
  scene: {
    /** Money coming in: [initials, customer, amount]. */
    ins: [string, string, string][];
    /** Money going out: [what, amount]. */
    outs: [string, string][];
    /** The one-sentence invoice typed in the "Coming in" panel. */
    sentence: string;
    inv: string;
    amt: string;
    /** The expense photographed in the "Going out" panel. */
    vendor: string;
    vamt: string;
    category: string;
  };
};

export const SAMPLES: ByCountry<SampleBusiness[]> = {
  uk: [
    {
      key: "harper",
      label: "Graphic designer",
      name: "Harper Studio",
      caption: "Harper Studio, Ellie Harper’s design studio in Leeds · this tax year so far",
      more: { label: "BillingEase for sole traders", href: ROUTES.soleTraders.href },
      inPaid: 24650,
      inExp: 3750,
      outPaid: 8320,
      outSch: 860,
      tax: 2960,
      ex: {
        inv: "“Invoice Kirkstall Brewing Co £1,850 for the autumn labels, due in 14 days” becomes a ready-to-send invoice.",
        pay: "Moor & Dale Outdoor paid £2,400 by bank transfer. You record it and the invoice shows as paid.",
        rem: "Ochre Café gets a polite email reminder a few days before £850 is due.",
        bills: "Studio rent (£450) and the print shop’s bill (£320) sit in one list with their due dates.",
        att: "Snap the train ticket to a client in Harrogate and attach it. It goes under Car, van and travel.",
        every: "Phone, broadband and software are set up once as every-month costs.",
        payroll: "No staff yet. If Ellie takes someone on, she enters each pay run from her payroll software.",
        tax: "£2,960 of Income Tax and Class 4 NI estimated so far, ready for the 31 January payment.",
        period: "Q2 is ready: income and expenses by HMRC category, with a readiness check before it goes.",
        acct: "Priya at Dale & Shaw sees the same books and files the MTD update from her practice software.",
      },
      scene: {
        ins: [
          ["KB", "Kirkstall Brewing", "£1,850"],
          ["MD", "Moor & Dale", "£2,400"],
          ["OC", "Ochre Café", "£850"],
        ],
        outs: [
          ["Studio rent", "£450"],
          ["Print shop", "£320"],
          ["Software", "£42"],
        ],
        sentence: "Invoice Kirkstall Brewing £1,850 for labels",
        inv: "INV-0042",
        amt: "£1,850",
        vendor: "Train ticket",
        vamt: "£23.40",
        category: "Car, van and travel",
      },
    },
    {
      key: "landlord",
      label: "Landlord",
      name: "Pickering Lets",
      caption: "Pickering Lets, Tom Pickering’s two flats in York · this tax year so far",
      more: { label: "BillingEase for landlords", href: ROUTES.landlords.href },
      inPaid: 9600,
      inExp: 1600,
      outPaid: 3980,
      outSch: 560,
      tax: 1240,
      ex: {
        inv: "October’s rent for each flat is recorded against the right property, £800 a month each.",
        pay: "Both tenants pay by standing order. You mark the month’s rent received in a tap.",
        rem: "If a month’s rent is late, a polite email reminder goes to that tenant.",
        bills: "The boiler repair (£340) and the letting agent’s fee (£96) are listed against Flat 1.",
        att: "Attach the plumber’s invoice as a PDF. It’s filed under Repairs and maintenance.",
        every: "Landlord insurance and the agent’s fee are set up once as every-month costs.",
        payroll: "No payroll needed. Mortgage interest is kept apart from other costs, ready for the tax credit.",
        tax: "£1,240 of Income Tax estimated so far, after the finance-cost reduction.",
        period: "Each MTD quarter shows rent and property costs by HMRC category, per flat and in total.",
        acct: "Tom’s accountant sees both properties and files the quarterly update for him.",
      },
      scene: {
        ins: [
          ["F1", "Flat 1 rent", "£800"],
          ["F2", "Flat 2 rent", "£800"],
          ["PS", "Parking space", "£60"],
        ],
        outs: [
          ["Mortgage interest", "£410"],
          ["Boiler repair", "£340"],
          ["Agent fee", "£96"],
        ],
        sentence: "Rent from Flat 2, £800 for October",
        inv: "RENT-OCT",
        amt: "£800",
        vendor: "Plumber",
        vamt: "£340.00",
        category: "Repairs and maintenance",
      },
    },
    {
      key: "trades",
      label: "Electrician",
      name: "Aire Valley Electrical",
      caption: "Aire Valley Electrical, Dan Brook’s business in Bradford · this tax year so far",
      more: { label: "BillingEase for small businesses", href: ROUTES.smallBusinesses.href },
      inPaid: 31200,
      inExp: 6400,
      outPaid: 14100,
      outSch: 2300,
      tax: 4180,
      ex: {
        inv: "“Invoice Ochre Café £2,160 for the rewire, plus VAT” becomes a VAT invoice with the VAT shown.",
        pay: "The café paid on the card machine. You record it as a card payment and the invoice shows as paid.",
        rem: "A polite email reminder goes before the £1,440 for the shop fit-out is due.",
        bills: "The wholesaler’s bill (£1,280) is listed with its due date. Pay it part now, part later.",
        att: "Photograph the receipt for cable and fittings and attach it to the expense.",
        every: "Van lease and phone are set up once as every-month costs.",
        payroll: "Dan pays an apprentice. He enters each pay run from his payroll software and the cost lands in the books.",
        tax: "£4,180 of Income Tax and Class 4 NI estimated so far, plus a VAT summary for each VAT quarter.",
        period: "Mileage at 45p a mile is added from the log, and each quarter is checked before it goes.",
        acct: "His accountant sees the same books and files the MTD and VAT returns.",
      },
      scene: {
        ins: [
          ["OC", "Ochre Café", "£2,160"],
          ["PP", "Pennine Physio", "£1,440"],
          ["LP", "Leeds Print Fest", "£620"],
        ],
        outs: [
          ["Wholesaler", "£1,280"],
          ["Van lease", "£289"],
          ["Apprentice", "£1,120"],
        ],
        sentence: "Invoice Ochre Café £2,160 for the rewire",
        inv: "INV-0318",
        amt: "£2,592",
        vendor: "Cable and fittings",
        vamt: "£86.40",
        category: "Cost of goods",
      },
    },
  ],
  lk: [
    {
      key: "serendib",
      label: "Design studio",
      name: "Serendib Design Studio",
      caption: "Serendib Design Studio, Ayesha Fernando’s studio in Colombo 03 · this year of assessment so far",
      more: { label: "BillingEase for small businesses", href: ROUTES.smallBusinesses.href },
      inPaid: 3860000,
      inExp: 1420000,
      outPaid: 2140000,
      outSch: 690000,
      tax: 410000,
      ex: {
        inv: "“Invoice Kandyan Spice Co Rs 250,000 for packaging design” becomes a Tax Invoice with SSCL and VAT on their own lines.",
        pay: "Galle Fort Boutique Hotel paid by cheque. You record the cheque number and bank, and the invoice shows as paid.",
        rem: "Lanka Agri Exports gets a polite reminder by email and WhatsApp before Rs 302,375 is due.",
        bills: "Office rent and the printer’s Tax Invoice sit in one list with their due dates. Input VAT is counted for the return.",
        att: "Photograph the courier receipt and attach it to the expense.",
        every: "Rent, internet and the leased printer are set up once as every-month costs.",
        payroll: "Five people paid on the 25th: EPF 8% and 12%, ETF 3% and APIT worked out, payslips ready.",
        tax: "Rs 410,000 of income tax estimated so far, with the quarterly instalment dates on Home.",
        period: "September’s VAT and SSCL summary, laid out in the order of the return, due 20 October.",
        acct: "Ruwan at Jayasinghe & Co sees the same books and gets the year-end figures in TaxWise.lk.",
      },
      scene: {
        ins: [
          ["KS", "Kandyan Spice", "Rs 302,375"],
          ["GF", "Galle Fort Hotel", "Rs 186,000"],
          ["LA", "Lanka Agri", "Rs 120,950"],
        ],
        outs: [
          ["Payroll", "Rs 640,000"],
          ["Office rent", "Rs 180,000"],
          ["Internet", "Rs 12,500"],
        ],
        sentence: "Invoice Kandyan Spice Rs 250,000 for packaging",
        inv: "TI-0187",
        amt: "Rs 302,375",
        vendor: "Courier receipt",
        vamt: "Rs 2,450",
        category: "Postage and courier",
      },
    },
    {
      key: "bakery",
      label: "Bakery",
      name: "Kandy Hill Bakery",
      caption: "Kandy Hill Bakery, Chaminda Perera’s bakery in Kandy · this year of assessment so far",
      more: { label: "BillingEase for sole proprietors", href: ROUTES.soleTraders.href },
      inPaid: 2940000,
      inExp: 260000,
      outPaid: 1980000,
      outSch: 240000,
      tax: 120000,
      ex: {
        inv: "“Invoice Hill Country Tea Estates Rs 48,000 for the staff tea-time order” becomes a ready-to-send invoice.",
        pay: "The estate paid by LankaQR. You record it and the invoice shows as paid.",
        rem: "A polite WhatsApp reminder goes before the Rs 36,500 Udawatta Inn order is due.",
        bills: "The flour mill’s bill (Rs 186,000) is listed with its due date. Pay part now and the rest later.",
        att: "Photograph the market receipt for butter and eggs and attach it to the expense.",
        every: "Shop rent, electricity and gas are set up once as every-month costs.",
        payroll: "Four bakers paid monthly, with EPF, ETF and APIT worked out and payslips ready to send.",
        tax: "Rs 120,000 of income tax estimated so far, with the quarterly instalment dates on Home.",
        period: "Not VAT registered yet. BillingEase warns as turnover gets close to the threshold.",
        acct: "His practitioner sees the same books and takes the year into the TaxWise.lk return.",
      },
      scene: {
        ins: [
          ["HC", "Hill Country Tea", "Rs 48,000"],
          ["CS", "Counter sales", "Rs 31,200"],
          ["UI", "Udawatta Inn", "Rs 36,500"],
        ],
        outs: [
          ["Flour mill", "Rs 186,000"],
          ["Wages", "Rs 210,000"],
          ["Gas", "Rs 14,800"],
        ],
        sentence: "Invoice Hill Country Tea Rs 48,000 for orders",
        inv: "INV-0221",
        amt: "Rs 48,000",
        vendor: "Market receipt",
        vamt: "Rs 6,840",
        category: "Cost of sales",
      },
    },
    {
      key: "guesthouse",
      label: "Guesthouse",
      name: "Ahangama Surf Lodge",
      caption: "Ahangama Surf Lodge, Nadeesha Silva’s guesthouse on the south coast · this year of assessment so far",
      more: { label: "BillingEase for small businesses", href: ROUTES.smallBusinesses.href },
      inPaid: 4120000,
      inExp: 880000,
      outPaid: 2460000,
      outSch: 520000,
      tax: 330000,
      ex: {
        inv: "“Invoice Southern Trails Travel Rs 165,000 for six nights” becomes a ready-to-send invoice.",
        pay: "The tour company paid by bank transfer. You record it and the invoice shows as paid.",
        rem: "A polite reminder goes by email and WhatsApp a week before the group booking is due.",
        bills: "The laundry service and the fish supplier are listed with their due dates.",
        att: "Attach the plumber’s bill as a PDF. It’s filed under Repairs.",
        every: "Lease, electricity and Wi-Fi are set up once as every-month costs.",
        payroll: "Three staff paid monthly, EPF, ETF and APIT worked out, payslips ready.",
        tax: "Rs 330,000 of income tax estimated so far, with the quarterly instalment dates on Home.",
        period: "VAT and SSCL summaries for each period, ready for the return.",
        acct: "Her practitioner sees the same books and files the returns.",
      },
      scene: {
        ins: [
          ["CT", "Southern Trails", "Rs 165,000"],
          ["WI", "Walk-in guests", "Rs 54,000"],
          ["SC", "Surf school", "Rs 38,000"],
        ],
        outs: [
          ["Staff", "Rs 285,000"],
          ["Lease", "Rs 150,000"],
          ["Laundry", "Rs 22,400"],
        ],
        sentence: "Invoice Southern Trails Rs 165,000 for six nights",
        inv: "INV-0093",
        amt: "Rs 165,000",
        vendor: "Plumber’s bill",
        vamt: "Rs 18,500",
        category: "Repairs",
      },
    },
  ],
};

/** Coming in − Going out = profit; the estimated tax is set aside; the rest is yours to keep. */
export function sampleNumbers(b: SampleBusiness) {
  const inT = b.inPaid + b.inExp;
  const outT = b.outPaid + b.outSch;
  const profit = inT - outT;
  return { inT, outT, profit, tax: b.tax, keep: profit - b.tax };
}
