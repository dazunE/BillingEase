/**
 * Copy for /countries (prototype SiteGlobal, reworked as "One product, two
 * countries"). The matrix follows section 2 of reports/BillingEase UK MVP
 * spec.html, without anything the app doesn't do (no imports, no feeds, no filing).
 */
import { HOME_ICONS as IC } from "./home";
import { ROUTES } from "./routes";

export const COUNTRIES_META = {
  title: "UK and Sri Lanka",
  description: "One product, two countries: what’s the same in the UK and Sri Lanka, what differs, why your country is fixed at sign-up, and where your data will live.",
};

export const COUNTRIES = {
  chip: "UK and Sri Lanka",
  hero: {
    title: "One product, two countries.",
    lead: "BillingEase works the same way in the United Kingdom and Sri Lanka: three numbers, invoices, expenses and your accountant on the same books. The country you pick at sign-up sets the currency, the tax year, the rules and the wording.",
    hand: "one country per business",
  },
  meet: {
    title: "Two businesses, the same three numbers.",
    lead: "A designer in Leeds and a design studio in Colombo. Same app, same equation, different rules underneath.",
  },
  pick: {
    kicker: "VAT, and SSCL, the way each country does it",
    title: "Pick a country. See its invoice.",
    lead: "BillingEase knows the tax names, the rates, the wording and the number formats for each country. Choose one to see the invoice it makes.",
  },
  same: {
    title: "What’s the same everywhere.",
    lead: "One codebase and one design. These work identically in both countries.",
    items: [
      { icon: IC.chart, tint: "violet" as const, title: "The three numbers", tag: "Coming in − Going out = Yours to keep", body: "“Yours to keep” is profit after the estimated tax for your country.", link: { label: "See all features", href: ROUTES.features.href } },
      { icon: IC.doc, tint: "violet" as const, title: "Invoices and quotes", tag: "Coming in", body: "A one-sentence composer, a full editor and PDFs. Quotes, credit notes and repeating invoices. Record payments by hand.", link: { label: "How Coming in works", href: ROUTES.comingIn.href } },
      { icon: IC.clip, tint: "orange" as const, title: "Expenses and bills", tag: "Going out", body: "Enter them by hand with a photo or PDF attached. Bills paid in full or in part, suppliers and every-month costs.", link: { label: "How Going out works", href: ROUTES.goingOut.href } },
      { icon: IC.safe, tint: "dark" as const, title: "Books that add up", tag: "Double-entry, append-only", body: "Every entry posts to a proper ledger. Corrections post a reversal; nothing is overwritten. Filed periods are locked.", link: { label: "Security", href: ROUTES.security.href } },
      { icon: IC.chat, tint: "green" as const, title: "Ask", tag: "AI answers with sources", body: "Questions answered from your country’s sources, clearly marked as AI, with “check with your accountant” when it needs judgement.", link: { label: "See all features", href: ROUTES.features.href } },
      { icon: IC.person, tint: "yellow" as const, title: "Your accountant, same books", tag: "Free on every plan", body: "They see what you see, send you requests and file from their own tools. BillingEase never files for you.", link: { label: "For accountants", href: ROUTES.accountants.href } },
    ],
  },
  matrix: {
    title: "What changes with your country.",
    lead: "A country pack switches the parts that differ. Rates and thresholds live in dated tables, so a Budget is a data update, not a new app.",
    rows: [
      ["Currency and tax year", "Pounds (£) · 6 April to 5 April", "Rupees (Rs) · year of assessment, 1 April to 31 March"],
      ["Business types", "Sole trader, landlord, or both", "Sole proprietor, partnership or company (books only; company tax stays with your practitioner)"],
      ["Expense categories", "HMRC self-employment and property categories, as used for MTD", "Categories that map to the business income lines in TaxWise.lk, plus capital items for allowances"],
      ["Accounting basis", "Cash basis by default, accruals optional", "Accruals by default (invoices count when issued), cash view available"],
      ["Periods on Home", "MTD quarters with readiness checks", "Monthly VAT and SSCL periods if registered; quarterly income tax instalments"],
      ["Invoices", "VAT invoices for VAT-registered businesses: 20%, 5%, 0% or exempt", "“Tax Invoice” with TIN and VAT number, VAT 18%, SSCL 2.5% as its own line, revised IRD layout"],
      ["Indirect tax report", "VAT summary per VAT quarter, filed by your accountant", "VAT and SSCL summaries per period, in the order of the IRD return"],
      ["Income tax estimate", "Income Tax and Class 4 NI, payments on account (31 Jan, 31 Jul)", "Income tax on business profit with Sri Lankan rates and reliefs, quarterly instalments"],
      ["Landlords", "Landlord mode: properties, shares, finance costs kept apart, £1,000 allowance", "Rent as an income line, handled in the TaxWise.lk return"],
      ["Mileage", "Mileage log at simplified rates", "Vehicle costs entered as expenses"],
      ["Payroll", "Records only: enter pay runs from your payroll software", "Full calculation: EPF 8% + 12%, ETF 3%, APIT, payslips and monthly schedules to pay and file yourself"],
      ["Getting paid", "Recorded by you: bank transfer, card machine, cash", "Recorded by you: bank transfer, cheque, cash, LankaQR"],
      ["Your accountant", "TaxWise practice workbench: quarter status and requests", "TaxWise.lk practitioner tool: client books and requests"],
      ["Year end", "A final-declaration pack for your practice (first due 31 January 2028)", "Profit, capital allowances, VAT, SSCL and payroll totals sent into your TaxWise.lk return"],
      ["Reminders", "By email", "By email and WhatsApp"],
      ["Language", "English", "English first; Sinhala and Tamil invoice templates next"],
    ] as [string, string, string][],
  },
  fixed: {
    kicker: "Why the country is fixed",
    title: "Chosen once, at sign-up.",
    lead: "Your country decides how every entry is recorded from the first one: the tax year it falls in, the category it maps to, the invoice wording, the payroll rules. Switching halfway would rewrite your history, so it stays put.",
    points: [
      ["One business, one country.", "Each account keeps the books for one business in one country."],
      ["Moving country means a new business.", "Sign up again for the new country; your old books stay as they were."],
      ["Both countries? Two sign-ups.", "A UK business and a Sri Lankan one are two separate accounts."],
    ] as [string, string][],
  },
  data: {
    kicker: "Data residency",
    title: "Where your data lives: still to be confirmed.",
    body: "We haven’t chosen the hosting region yet, and we won’t pretend otherwise. Here’s where the decision stands.",
    rows: [
      ["United Kingdom", "A UK or EU region, under UK GDPR."],
      ["Sri Lanka", "Being decided under the Personal Data Protection Act, whose core duties start on 1 January 2027."],
    ] as [string, string][],
    foot: "We’ll publish the region here and in our privacy notice before launch.",
  },
  faqIntro: "What people ask about the two countries.",
  faq: [
    { q: "Can I change my country later?", a: "No. Your country is fixed at sign-up because it decides how every entry is recorded. Moving country means signing up a new business." },
    { q: "I have a business in each country. Can I use one account?", a: "Not yet. Each account keeps the books for one business in one country, so you’d sign up twice." },
    { q: "Can I invoice a customer abroad in their currency?", a: "No. Your books are in your home currency only. Record a foreign invoice in £ or Rs and add a note with the original amount." },
    { q: "Does BillingEase file tax in either country?", a: "No. In the UK your accountant files your MTD updates and VAT; in Sri Lanka you or your practitioner file with the IRD, and the year goes to TaxWise.lk. Filing links may come later." },
    { q: "Is it in Sinhala or Tamil?", a: "English first. Sinhala and Tamil invoice templates and payslips are next." },
    { q: "Will you add other countries?", a: "Not for now. Adding a country means a new pack of rules and a local accountant channel, so we’re doing two well first." },
  ],
  close: { title: "Pounds or rupees, see what’s yours." },
};

/** The invoice preview per country (illustrative; layouts from the spec). */
export const COUNTRY_INVOICES = {
  uk: {
    flag: "UK",
    tax: "VAT",
    taxLine: "Value Added Tax, when you’re VAT registered",
    rates: [
      ["20%", "Standard rate"],
      ["5%", "Reduced rate"],
      ["0%", "Zero rate, or exempt"],
    ] as [string, string][],
    note: "Plus a VAT summary each VAT quarter, filed by your accountant.",
    doc: {
      kind: "VAT INVOICE",
      no: "INV-0318",
      date: "6 Oct 2026",
      from: "Aire Valley Electrical, Bradford",
      ids: "VAT reg. no. GB 000 0000 00 (sample)",
      to: "Ochre Café, Leeds",
      rows: [
        ["Rewire, ground floor", "£1,680.00"],
        ["Consumer unit", "£480.00"],
        ["VAT at 20%", "£432.00"],
      ] as [string, string][],
      total: "£2,592.00",
      pay: "Pay by bank transfer; sort code and account on the PDF",
    },
  },
  lk: {
    flag: "LK",
    tax: "VAT and SSCL",
    taxLine: "VAT, and the Social Security Contribution Levy as its own line",
    rates: [
      ["18%", "VAT, standard"],
      ["2.5%", "SSCL, its own line"],
      ["0%", "Zero-rated, or exempt"],
    ] as [string, string][],
    note: "Plus VAT and SSCL summaries each period, in the order of the IRD return.",
    doc: {
      kind: "TAX INVOICE",
      no: "TI-0187",
      date: "6 Oct 2026",
      from: "Serendib Design Studio, Colombo 03",
      ids: "TIN 000000000 · VAT 000000000-7000 (sample)",
      to: "Kandyan Spice Co, Kandy",
      rows: [
        ["Packaging design", "Rs 250,000.00"],
        ["SSCL 2.5%", "Rs 6,250.00"],
        ["VAT 18%", "Rs 46,125.00"],
      ] as [string, string][],
      total: "Rs 302,375.00",
      pay: "Pay by bank transfer, cheque or LankaQR",
    },
  },
};
