/**
 * About (/about). Only what's true today: no founders' story, team, office,
 * investors or customer numbers until they can be stated. Dates come from
 * the git history; "Planned" items come from the spec's timeline and say so.
 */
import type { Copy } from "./country";

export const ABOUT = {
  kicker: "About BillingEase",
  title: "Your whole business in three numbers.",
  lead: {
    uk: "BillingEase is bookkeeping, invoicing and payroll records you enter by hand, for sole traders and landlords in the UK getting ready for Making Tax Digital. It starts from one idea: Coming in − Going out = Yours to keep.",
    lk: "BillingEase is bookkeeping, invoicing and payroll you enter by hand, for small businesses and sole proprietors in Sri Lanka. It starts from one idea: Coming in − Going out = Yours to keep.",
  } as Copy,
  why: {
    title: "Why BillingEase exists",
    body: [
      "Most bookkeeping software is built for the person who files the return, not the person who runs the business. It asks about accounts receivable, accruals and suspense accounts, when what you want to know is simpler: what’s coming in, what’s going out, and what’s yours to keep.",
      "So that’s the whole app. Every screen sits behind one of those three numbers, and every feature has to answer one question before it ships: which number does this help you understand?",
      "The accounting is still there, done properly underneath: a double-entry ledger your accountant can rely on. You just don’t have to speak it.",
    ],
    jargon: ["Accounts receivable", "Accrual basis", "Unapplied credits", "Trial balance", "Journal entry", "Chart of accounts", "Suspense account", "Retained earnings"],
  },
  beliefs: {
    title: "What we believe",
    lead: "Five rules we use to decide what to build, and just as often, what not to.",
    items: [
      { title: "Plain words first", body: "If we must use a word like “accruals”, it goes in small print under a word you already use.", icon: "M4 6h16M4 12h10M4 18h7", tint: "violet" },
      { title: "Only ask when we need you", body: "Home tells you what needs you today, and stays quiet about the rest.", icon: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0", tint: "orange" },
      { title: "You enter it, so you trust it", body: "No bank feeds guessing what a payment was. Every entry is one you made, with the receipt attached.", icon: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z", tint: "violet" },
      { title: "Corrections leave a trail", body: "Nothing is quietly changed. A correction is a new entry that reverses the old one, and filed periods are locked.", icon: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5", tint: "orange" },
      { title: "Your accountant sees what you see", body: "One set of books, shared with the person who files. No exports by email, no second copy.", icon: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8", tint: "violet" },
    ] as { title: string; body: string; icon: string; tint: "violet" | "orange" }[],
    rule: "If it needs a manual, it isn’t done.",
  },
  countries: {
    title: "Two countries, one app",
    lead: "You choose your country when you sign up. It sets the currency, the tax year, the categories and the rules. Everything else is the same.",
    uk: ["Pounds, tax year 6 April to 5 April", "HMRC’s categories, ready for each Making Tax Digital quarter", "VAT invoices when you’re VAT registered", "Landlord records, mortgage interest kept apart", "Payroll records from your payroll software", "Your accountant files"],
    lk: ["Rupees, year of assessment 1 April to 31 March", "Tax Invoices with VAT 18% and SSCL 2.5% on their own lines", "Payments by transfer, cheque, cash and LankaQR", "Payroll with EPF, ETF and APIT, and payslips", "Reminders on WhatsApp", "Year-end hand-off to TaxWise.lk"],
  },
  timeline: {
    title: "So far, and what’s next",
    lead: "Dates from our own history. Plans are plans: they may move.",
    items: [
      { when: "3 Oct 2026", title: "A clickable prototype", body: "Every screen drawn first as a design you can click through.", planned: false },
      { when: "4 Oct 2026", title: "Three numbers", body: "The whole app redrawn around Coming in, Going out and Yours to keep.", planned: false },
      { when: "11 Oct 2026", title: "Two countries", body: "The plan for the UK and Sri Lanka, and the prototype redrawn for both.", planned: false },
      { when: "11 Oct 2026", title: "The first build", body: "Sign-up by country, invoices and Tax Invoices, expenses and bills, Home and Ask.", planned: false },
      { when: "14 Oct 2026", title: "This website", body: "In pounds or rupees, depending on where you are.", planned: false },
      { when: "Jan 2027", title: "Sri Lanka", body: "Planned launch, with tax practitioners and direct sign-ups.", planned: true },
      { when: "Apr 2027", title: "United Kingdom", body: "Planned public launch, for the first wider Making Tax Digital wave.", planned: true },
    ],
  },
};
