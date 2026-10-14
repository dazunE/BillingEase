/**
 * Plans and prices per country, shared by the home page's pricing teaser and
 * /pricing so they never disagree. Prices are PLACEHOLDERS until the pricing
 * decision is made (spec section 14): always show PRICE_NOTE near them.
 */
import type { ByCountry } from "./country";

export type Plan = {
  id: string;
  name: string;
  /** Short line under the name, e.g. "For getting started". */
  tag: string;
  /** Monthly price in the country's currency (0 = free). */
  price: number;
  /** Shown after the price, e.g. "/ month" or "per client / month". */
  per: string;
  line: string;
  features: string[];
  cta: string;
  /** "signup" goes to /sign-up?country=…; anything else is a path. */
  href: "signup" | string;
  /** The highlighted card. */
  popular?: boolean;
};

export const PRICE_NOTE = "Prices are placeholders while we finish pricing. Everything on the free plan stays free.";

export const PLANS: ByCountry<Plan[]> = {
  uk: [
    {
      id: "free",
      name: "Free",
      tag: "For getting started",
      price: 0,
      per: "",
      line: "Invoices, expenses and your three numbers, for as long as you like.",
      features: ["Your three numbers in pounds", "Unlimited invoices, quotes and customers", "Expenses and bills with a photo or PDF attached", "HMRC categories built in", "Just you"],
      cta: "Start free",
      href: "signup",
    },
    {
      id: "mtd",
      name: "MTD ready",
      tag: "Most popular",
      price: 8,
      per: "/ month",
      line: "Everything a sole trader or landlord needs for Making Tax Digital quarters.",
      features: ["Everything in Free", "MTD quarters with readiness checks", "Landlord mode and mileage", "Repeating invoices and VAT invoices", "Income Tax and NI estimate", "Your accountant sees the same books"],
      cta: "Start free, upgrade later",
      href: "signup",
      popular: true,
    },
    {
      id: "practice",
      name: "For practices",
      tag: "Accountants and bookkeepers",
      price: 3,
      per: "per client / month",
      line: "Give clients BillingEase and see every quarter from the TaxWise practice workbench.",
      features: ["Each client gets everything in MTD ready", "Quarter status and requests", "Lock a quarter once filed", "Your practice name on their books"],
      cta: "Talk to us",
      href: "/accountants",
    },
  ],
  lk: [
    {
      id: "free",
      name: "Free",
      tag: "For getting started",
      price: 0,
      per: "",
      line: "Invoices, expenses and your three numbers, for as long as you like.",
      features: ["Your three numbers in rupees", "Unlimited invoices, quotes and customers", "Expenses and bills with a photo or PDF attached", "Record bank transfers, cheques, cash and LankaQR", "Just you"],
      cta: "Start free",
      href: "signup",
    },
    {
      id: "business",
      name: "Business",
      tag: "Most popular",
      price: 2900,
      per: "/ month",
      line: "Tax Invoices, VAT and SSCL, and payroll for a small team.",
      features: ["Everything in Free", "Tax Invoices with VAT 18% and SSCL 2.5%", "VAT and SSCL period summaries", "Payroll with EPF, ETF, APIT and payslips", "Email and WhatsApp reminders", "Year-end hand-off to TaxWise.lk"],
      cta: "Start free, upgrade later",
      href: "signup",
      popular: true,
    },
    {
      id: "practitioner",
      name: "For practitioners",
      tag: "Tax practitioners and firms",
      price: 750,
      per: "per client / month",
      line: "See every client’s books from the TaxWise.lk practitioner tool.",
      features: ["Monthly VAT, SSCL and payroll position", "Requests to clients", "Lock a period once filed", "Year-end figures straight into the return"],
      cta: "Talk to us",
      href: "/accountants",
    },
  ],
};
