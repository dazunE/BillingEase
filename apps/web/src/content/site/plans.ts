/**
 * Plans and prices per country, shared by the home page's pricing teaser, /pricing and the
 * "for" pages so they never disagree.
 *
 * Free covers the basics, with monthly limits (FREE_LIMITS). Pro is the plan that does what the
 * tax office asks (MTD in the UK; Tax Invoices, VAT, SSCL and payroll in Sri Lanka); Pro Plus adds
 * more people, more payroll, several businesses, Ask and the agents, and the API. Practices pay
 * per client. A person's first business gets Pro free for TRIAL_DAYS, then stays on Free unless they subscribe.
 * Yearly billing comes first (two months free); the first FOUNDING_SEATS yearly subscribers get a
 * founding price, kept while they stay subscribed.
 */
import { money, type ByCountry, type SiteCountry } from "./country";

export type Plan = {
  id: "free" | "pro" | "plus" | "practice";
  name: string;
  /** Short line under the name, e.g. "For getting started". */
  tag: string;
  /** What it costs a month when billed yearly (`yearly / 12`); 0 for Free. The headline number everywhere. */
  price: number;
  /** Month-to-month price, or null when the plan is free or billed yearly only. */
  monthly: number | null;
  /** Price for a year, billed up front (per client for practices). */
  yearly: number;
  /** Founding-member price for a year, if offered. */
  founding?: number;
  /** Shown after the price, e.g. "/ month" or "per client / month". */
  per: string;
  line: string;
  features: string[];
  cta: string;
  /** "signup" goes to /sign-up?country=…; anything else is a path. */
  href: "signup" | string;
  /** The highlighted card. */
  popular?: boolean;
  /** People who can sign in, the accountant or practitioner not counted. */
  people: number;
  /** Payroll: employees included, then a price per extra employee a month (Sri Lanka). */
  staff?: { included: number; each: number };
  /** Per-client plans: the fewest clients billed. */
  minClients?: number;
};

export const TRIAL_DAYS = 30;
export const FOUNDING_SEATS = 100;

/** What Free allows each calendar month. The API enforces the same numbers. */
export const FREE_LIMITS = { invoices: 10, attachments: 20, receiptScans: 5 };

export const PRICE_NOTE = `Free stays free. Your first business gets Pro free for ${TRIAL_DAYS} days, no card needed, then stays on Free unless you choose a plan.`;

/** The line under a plan's headline price, e.g. "Billed yearly at £120, or £12 month to month". */
export function billingLine(p: Plan, country: SiteCountry): string {
  if (p.price === 0) return "Free for as long as you like";
  const year = p.minClients ? `Billed yearly, ${money(p.yearly, country)} per client, from ${p.minClients} clients` : `Billed yearly at ${money(p.yearly, country)}`;
  return p.monthly != null ? `${year}, or ${money(p.monthly, country)} month to month` : year;
}

/** "First 100 members: £84 a year, kept while you stay subscribed". */
export function foundingLine(p: Plan, country: SiteCountry): string | null {
  return p.founding != null ? `First ${FOUNDING_SEATS} members: ${money(p.founding, country)} a year, kept while you stay subscribed` : null;
}

const L = FREE_LIMITS;

export const PLANS: ByCountry<Plan[]> = {
  uk: [
    {
      id: "free",
      name: "Free",
      tag: "For getting started",
      price: 0,
      monthly: null,
      yearly: 0,
      per: "",
      line: "Invoices, expenses and your three numbers, for a few invoices a month.",
      features: ["Your three numbers in pounds", `${L.invoices} invoices a month, unlimited quotes and customers`, `Expenses and bills, ${L.attachments} photos or PDFs a month`, `${L.receiptScans} receipt photos read for you a month`, "HMRC categories built in", "Just you"],
      cta: "Start free",
      href: "signup",
      people: 1,
    },
    {
      id: "pro",
      name: "Pro",
      tag: "Most popular",
      price: 10,
      monthly: 12,
      yearly: 120,
      founding: 84,
      per: "/ month",
      line: "Everything a sole trader or landlord needs for Making Tax Digital quarters.",
      features: ["Unlimited invoices and attachments", "MTD quarters with readiness checks", "VAT invoices and VAT periods", "Landlord mode and mileage", "Repeating invoices and reminders", "Income Tax and NI estimate", "Receipt photos and bank statements read for you", "You, your accountant and 1 more person"],
      cta: `Try Pro free for ${TRIAL_DAYS} days`,
      href: "signup",
      popular: true,
      people: 2,
    },
    {
      id: "plus",
      name: "Pro Plus",
      tag: "Growing businesses",
      price: 20,
      monthly: 24,
      yearly: 240,
      founding: 168,
      per: "/ month",
      line: "Pro for a bigger setup: a team, several businesses, Ask and the agents.",
      features: ["Everything in Pro", "Up to 10 people, your accountant free", "Up to 3 businesses on one plan", "Ask: questions about your books, answered", "An agent that drafts reminders for late invoices, for you to check", "API and AI assistant connector (MCP)", "Priority help from a person"],
      cta: "Start free, upgrade any time",
      href: "signup",
      people: 10,
    },
    {
      id: "practice",
      name: "For practices",
      tag: "Accountants and bookkeepers",
      price: 4,
      monthly: null,
      yearly: 48,
      per: "per client / month",
      line: "Give clients BillingEase and see every quarter from the TaxWise practice workbench.",
      features: ["Each client gets everything in Pro", "Quarter status and requests", "Lock a quarter once filed (next phase)", "Your practice name on their books", "Billed yearly, from 10 clients"],
      cta: "Talk to us",
      href: "/accountants",
      people: 1,
      minClients: 10,
    },
  ],
  lk: [
    {
      id: "free",
      name: "Free",
      tag: "For getting started",
      price: 0,
      monthly: null,
      yearly: 0,
      per: "",
      line: "Invoices, expenses and your three numbers, for a few invoices a month.",
      features: ["Your three numbers in rupees", `${L.invoices} invoices a month, unlimited quotes and customers`, `Expenses and bills, ${L.attachments} photos or PDFs a month`, "Record bank transfers, cheques, cash and LankaQR", `${L.receiptScans} receipt photos read for you a month`, "Just you"],
      cta: "Start free",
      href: "signup",
      people: 1,
    },
    {
      id: "pro",
      name: "Pro",
      tag: "Most popular",
      price: 3250,
      monthly: 3900,
      yearly: 39000,
      founding: 27000,
      per: "/ month",
      line: "Tax Invoices, VAT and SSCL, and payroll for a small team.",
      features: ["Unlimited invoices and attachments", "Tax Invoices with VAT 18% and SSCL 2.5%", "VAT and SSCL period summaries", "Payroll with EPF, ETF, APIT and payslips for 5 people, then Rs 300 a person a month", "Email and WhatsApp reminders", "Receipt photos and bank statements read for you", "Year-end hand-off to TaxWise.lk", "You, your practitioner and 1 more person"],
      cta: `Try Pro free for ${TRIAL_DAYS} days`,
      href: "signup",
      popular: true,
      people: 2,
      staff: { included: 5, each: 300 },
    },
    {
      id: "plus",
      name: "Pro Plus",
      tag: "Growing businesses",
      price: 6500,
      monthly: 7800,
      yearly: 78000,
      founding: 54000,
      per: "/ month",
      line: "Pro for a bigger team: more payroll, several businesses, Ask and the agents.",
      features: ["Everything in Pro", "Payroll for 25 people, then Rs 250 a person a month", "Up to 10 people signing in, your practitioner free", "Up to 3 businesses on one plan", "Ask: questions about your books, answered", "An agent that drafts reminders for late invoices, for you to check", "API and AI assistant connector (MCP)"],
      cta: "Start free, upgrade any time",
      href: "signup",
      people: 10,
      staff: { included: 25, each: 250 },
    },
    {
      id: "practice",
      name: "For practitioners",
      tag: "Tax practitioners and firms",
      price: 625,
      monthly: null,
      yearly: 7500,
      per: "per client / month",
      line: "See every client’s books from the TaxWise.lk practitioner tool.",
      features: ["Each client gets everything in Pro", "Monthly VAT, SSCL and payroll position", "Requests to clients", "Lock a period once filed (next phase)", "Billed yearly, from 10 clients"],
      cta: "Talk to us",
      href: "/accountants",
      people: 1,
      minClients: 10,
    },
  ],
};
