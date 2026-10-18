/**
 * Help centre answers (/help). Every answer describes what the app does
 * today; links go to the app's real pages (signed in) or to site pages.
 * Things that aren't built yet say so plainly. Never claim anything in the
 * site brief's "Not offered" list.
 */
import type { Copy, SiteCountry } from "./country";
import { guideHref, legalHref, ROUTES } from "./routes";

export type HelpTopicId = "start" | "invoices" | "expenses" | "tax" | "accountant" | "account";

export const HELP_TOPICS: { id: HelpTopicId; name: Copy; line: Copy; icon: string; tint: "violet" | "orange" | "green" | "grey" }[] = [
  { id: "start", name: "Getting started", line: "Signing up, setup and your three numbers", icon: "M5 12h14M13 6l6 6-6 6", tint: "violet" },
  { id: "invoices", name: "Invoices and getting paid", line: { uk: "Quotes, VAT invoices, payments, reminders", lk: "Quotes, Tax Invoices, cheques, reminders" }, icon: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M8 13h8M8 17h5", tint: "violet" },
  { id: "expenses", name: "Expenses and bills", line: "Costs, attachments, suppliers, every month", icon: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6", tint: "orange" },
  { id: "tax", name: "Tax and Ask", line: { uk: "Yours to keep, VAT, MTD and Ask", lk: "Yours to keep, VAT, SSCL and Ask" }, icon: "M19 5 5 19M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M16.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3", tint: "green" },
  { id: "accountant", name: { uk: "Your accountant", lk: "Your tax practitioner" }, line: "Shared books, corrections and filing", icon: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8", tint: "orange" },
  { id: "account", name: "Account and data", line: "Signing in, your data, closing", icon: "M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6zM9 12l2 2 4-4", tint: "grey" },
];

export type HelpAnswer = {
  id: string;
  topic: HelpTopicId;
  q: Copy;
  a: Copy;
  link?: Copy<{ label: string; href: string }>;
  /** Shown only for this country. */
  only?: SiteCountry;
  popular?: boolean;
  /** Extra search words. */
  words: string;
};

const APP = {
  home: "/app",
  newInvoice: "/app/in/invoices/new",
  invoices: "/app/in/invoices",
  quotes: "/app/in/quotes",
  repeating: "/app/in/repeating",
  customers: "/app/in/customers",
  prices: "/app/in/prices",
  out: "/app/out",
  bills: "/app/out/bills",
  newBill: "/app/out/bills/new",
  monthly: "/app/out/monthly",
  suppliers: "/app/out/suppliers",
  ask: "/app/ask",
  profile: "/app/settings/business",
  search: "/app/search",
};

export const HELP: HelpAnswer[] = [
  // Getting started
  {
    id: "sign-up",
    topic: "start",
    popular: true,
    q: "What do I need to sign up?",
    a: {
      uk: "An email address, a password and a few minutes. You choose the United Kingdom, then answer a few questions about your business: sole trader, landlord or both, whether you’re VAT registered, how your quarters run, and cash or invoice basis. Not sure of an answer? Pick the closest; you can change it later in Business profile. No card is needed.",
      lk: "An email address, a password and a few minutes. You choose Sri Lanka, then answer a few questions about your business: its type, your TIN, and whether you’re registered for VAT and SSCL. Not sure of an answer? Pick the closest; you can change it later in Business profile. No card is needed.",
    },
    link: { label: "Create an account", href: ROUTES.signUp.href },
    words: "register create account start setup free card",
  },
  {
    id: "country-fixed",
    topic: "start",
    q: "Can I change my country later?",
    a: "No. Your country sets the currency, the tax year, the expense categories and the tax rules, so it stays fixed once your business is set up. Each account has one business. If you also have a business in the other country, sign up again with a different email address.",
    words: "country uk sri lanka change move second business several",
  },
  {
    id: "three-numbers",
    topic: "start",
    popular: true,
    q: "What do the three numbers on Home mean?",
    a: {
      uk: "Coming in is what you’ve invoiced or been paid, Going out is what you’ve spent, and Yours to keep is what’s left after the tax we estimate you’ll owe (Income Tax and Class 4 National Insurance). VAT is left out of all three, because it isn’t yours. Use the period switch on Home to see this quarter, this tax year or another period.",
      lk: "Coming in is what you’ve invoiced or been paid, Going out is what you’ve spent, and Yours to keep is what’s left after the income tax we estimate you’ll owe. VAT and SSCL are left out of all three, because they aren’t yours. Use the period switch on Home to see this month, this year of assessment or another period.",
    },
    link: { label: "Open Home", href: APP.home },
    words: "home coming in going out yours to keep profit numbers dashboard period",
  },
  {
    id: "bring-data",
    topic: "start",
    q: "Can I bring my customers and invoices over from a spreadsheet or another app?",
    a: "Not yet: there’s no import, so you add customers and open invoices by hand. Pick a clean start date (the first day of a month or quarter), add the customers you invoice and any invoices still unpaid, and keep your old records as they are for your accountant.",
    words: "import csv spreadsheet migrate switch move quickbooks xero excel",
  },
  // Invoices
  {
    id: "first-invoice",
    topic: "invoices",
    popular: true,
    q: "How do I send my first invoice?",
    a: "Press New, then New invoice. Choose or add the customer, add a line for each thing you did, check the dates, and press Save and send. Your customer gets an email with the invoice as a PDF, and the amount shows in Coming in straight away. You can also download the PDF from the invoice page and send it yourself.",
    link: { label: "Start a new invoice", href: APP.newInvoice },
    words: "bill create send invoice new pdf email",
  },
  {
    id: "vat-invoice",
    topic: "invoices",
    only: "uk",
    q: "How do I send VAT invoices?",
    a: "Say you’re VAT registered when you set up, or later in Business profile, and add your VAT number. From then on each invoice is a VAT invoice: every line has a VAT rate (20%, 5%, 0% or exempt), and the totals show the VAT separately.",
    link: { label: "Open Business profile", href: APP.profile },
    words: "vat invoice registered number rate 20%",
  },
  {
    id: "tax-invoice",
    topic: "invoices",
    only: "lk",
    popular: true,
    q: "How do I issue a Tax Invoice with VAT and SSCL?",
    a: "Say you’re registered for VAT (and SSCL) when you set up, or later in Business profile, and add your TIN and VAT registration number. From then on each invoice is titled Tax Invoice, with VAT at 18% and SSCL at 2.5% on their own lines.",
    link: { label: "Open Business profile", href: APP.profile },
    words: "tax invoice vat sscl tin registration 18% 2.5%",
  },
  {
    id: "get-paid",
    topic: "invoices",
    popular: true,
    q: "How do customers pay me?",
    a: {
      uk: "However you agree with them: bank transfer, your card machine or cash. Your bank details go on every invoice. When the money arrives, open the invoice and choose Record a payment. BillingEase doesn’t take card payments online.",
      lk: "However you agree with them: bank transfer, cheque, cash or LankaQR. Your bank details go on every invoice. When the money arrives, open the invoice and choose Record a payment; for a cheque, add its number and bank. BillingEase doesn’t take card payments online.",
    },
    link: { label: "See your invoices", href: APP.invoices },
    words: "pay payment record bank transfer cheque cash lankaqr card machine paid",
  },
  {
    id: "part-payment",
    topic: "invoices",
    q: "A customer paid part of an invoice. What do I do?",
    a: "Record the payment for the amount you received. The invoice stays open with the rest still owed, and you can record the next payment when it arrives.",
    link: { label: "See your invoices", href: APP.invoices },
    words: "part partial payment instalment balance owed",
  },
  {
    id: "reminders",
    topic: "invoices",
    q: "Can I send a reminder for an unpaid invoice?",
    a: {
      uk: "Yes. Open the invoice and send a reminder by email; it goes with the PDF attached, and you can change the message first. Overdue invoices are listed on Coming in, so you can remind from there too.",
      lk: "Yes. Open the invoice and send a reminder by email with the PDF attached, or choose WhatsApp to open it with the message ready to send. Overdue invoices are listed on Coming in, so you can remind from there too.",
    },
    link: { uk: { label: "See your invoices", href: APP.invoices }, lk: { label: "Guide: getting paid by cheque and LankaQR", href: guideHref("cheques-lankaqr-and-getting-paid") } },
    words: "reminder overdue late chase nudge whatsapp email",
  },
  {
    id: "quotes",
    topic: "invoices",
    q: "How do quotes work?",
    a: "Make a quote the same way as an invoice and send it. When your customer says yes, mark it accepted, then turn it into an invoice without typing anything again. A quote isn’t income until it becomes an invoice.",
    link: { label: "See your quotes", href: APP.quotes },
    words: "quote estimate accept accepted convert invoice",
  },
  {
    id: "repeating",
    topic: "invoices",
    q: "Can an invoice repeat every month?",
    a: "Yes. Set up a repeating invoice with the customer, the lines and how often it runs. By default each run makes a draft for you to check and send; you can choose to have it sent on the day instead.",
    link: { label: "See repeating invoices", href: APP.repeating },
    words: "repeat recurring retainer monthly subscription schedule",
  },
  {
    id: "credit-note",
    topic: "invoices",
    q: "I made a mistake on an invoice I’ve sent. How do I fix it?",
    a: "Don’t change a sent invoice. Issue a credit note from it for the amount that’s wrong, then send a new invoice if needed. Your books keep both, so you and your accountant can see what happened.",
    link: { label: "Guide: invoice, quote or credit note?", href: guideHref("invoice-quote-or-credit-note") },
    words: "mistake wrong edit credit note refund money back cancel void",
  },
  // Expenses
  {
    id: "expense",
    topic: "expenses",
    popular: true,
    q: "How do I record an expense?",
    a: {
      uk: "Press New, then Record an expense. Add the amount, the date, the supplier and the category (in HMRC’s categories), and the business share if you use it partly for yourself. Attach a photo or PDF of the receipt. BillingEase keeps the file with the expense; it doesn’t read receipts for you.",
      lk: "Press New, then Record an expense. Add the amount, the date, the supplier and the category, and attach a photo or PDF of the receipt. BillingEase keeps the file with the expense; it doesn’t read receipts for you.",
    },
    link: { label: "Open Going out", href: APP.out },
    words: "expense receipt cost spend record photo pdf attach category",
  },
  {
    id: "bills",
    topic: "expenses",
    q: "What’s the difference between an expense and a bill?",
    a: "An expense is something you’ve already paid. A bill is something you owe a supplier and will pay later. Add a bill when it arrives, then mark it paid in full or in part when you pay it; it counts in Going out either way, and Going out shows what’s still to pay.",
    link: { label: "Add a bill", href: APP.newBill },
    words: "bill supplier owe pay later due part paid",
  },
  {
    id: "every-month",
    topic: "expenses",
    q: "Can BillingEase remember costs I pay every month?",
    a: "Yes. Set up rent, software, insurance and anything else that repeats under Every month, with the amount and the day. They’re listed together, so you can see what your month costs before it starts.",
    link: { label: "Open Every month", href: APP.monthly },
    words: "every month recurring rent subscription regular costs",
  },
  {
    id: "bank-feeds",
    topic: "expenses",
    q: "Can I connect my bank or card?",
    a: "No. BillingEase has no bank or card feeds: you enter sales and costs yourself, which is also what keeps each record checked by a person. Once a month, compare your bank statement’s closing balance with your books to make sure nothing is missing.",
    words: "bank feed connect sync card open banking import statement",
  },
  // Tax
  {
    id: "yours-to-keep",
    topic: "tax",
    q: "How is Yours to keep worked out?",
    a: {
      uk: "It’s your profit (Coming in minus Going out) less an estimate of the Income Tax and Class 4 National Insurance you’ll owe on it. It’s an estimate from the rates for the tax year, not a tax bill. Your accountant works out the real figure.",
      lk: "It’s your profit (Coming in minus Going out) less an estimate of the income tax you’ll owe on it for the year of assessment. It’s an estimate, not a tax bill. Your tax practitioner works out the real figure.",
    },
    words: "yours to keep tax estimate income tax national insurance profit set aside",
  },
  {
    id: "filing",
    topic: "tax",
    popular: true,
    q: "Does BillingEase file my tax returns?",
    a: {
      uk: "No. BillingEase keeps the records in HMRC’s categories, ready for each Making Tax Digital quarter. Your accountant sends the quarterly updates, the final declaration and any VAT return from their own software.",
      lk: "No. BillingEase keeps the books and works out your VAT and SSCL for each period. You or your tax practitioner file with the IRD; at the end of the year of assessment, your books go to TaxWise.lk for your income tax return.",
    },
    link: { label: "Guide: working with your accountant", href: guideHref("working-with-your-accountant") },
    words: "file filing return hmrc ird mtd submit vat return",
  },
  {
    id: "mtd",
    topic: "tax",
    only: "uk",
    q: "Am I ready for Making Tax Digital for Income Tax?",
    a: "If you record your income and costs in BillingEase as they happen, your records are digital and already in HMRC’s categories, which is what MTD asks for. Whether you need to join, and when, depends on your income: the guide explains the dates.",
    link: { label: "Guide: getting ready for MTD", href: guideHref("getting-ready-for-mtd-for-income-tax") },
    words: "mtd making tax digital quarterly update ready",
  },
  {
    id: "ask",
    topic: "tax",
    q: "What is Ask, and can I trust its answers?",
    a: {
      uk: "Ask answers questions in plain words from your own books and from official sources such as gov.uk and HMRC’s manuals, and lists the sources it used. It’s AI, so it can be wrong, and it never files anything. When a question needs judgement, ask your accountant.",
      lk: "Ask answers questions in plain words from your own books and from official sources such as the IRD’s guidance, and lists the sources it used. It’s AI, so it can be wrong, and it never files anything. When a question needs judgement, ask your tax practitioner.",
    },
    link: { label: "Open Ask", href: APP.ask },
    words: "ask ai question answer sources chat",
  },
  // Accountant
  {
    id: "accountant-see",
    topic: "accountant",
    popular: true,
    q: { uk: "How does my accountant see my books?", lk: "How does my tax practitioner see my books?" },
    a: {
      uk: "Through the accountant link: your accountant’s practice sees the same books you do, from their TaxWise practice tool. The link is being built now and arrives with the practice tool; until then, your invoices and quotes download as PDFs to share.",
      lk: "Through the practitioner link: your tax practitioner sees the same books you do, from the TaxWise.lk practitioner tool. The link is being built now and arrives with the practitioner tool; until then, your invoices and quotes download as PDFs to share.",
    },
    link: { label: "BillingEase for accountants", href: ROUTES.accountants.href },
    words: "accountant practitioner invite access share books practice taxwise",
  },
  {
    id: "corrections",
    topic: "accountant",
    q: "Can I change something from a period that’s already filed?",
    a: "Filed periods are locked, so the numbers your accountant sent stay the same. Corrections are never made by quietly changing the past: they’re recorded as a new entry that reverses the old one, so both of you can see what changed and when. Tell your accountant when you need one.",
    words: "change edit delete correction locked filed period reverse mistake",
  },
  // Account
  {
    id: "password",
    topic: "account",
    q: "I’ve forgotten my password.",
    a: "On the sign-in page, choose Forgot your password and enter your email. We’ll send a link to set a new one.",
    link: { label: "Reset your password", href: "/forgot-password" },
    words: "password forgot reset sign in login locked out",
  },
  {
    id: "two-step",
    topic: "account",
    q: "Is there two-step sign-in?",
    a: "Not yet. Until it arrives, use a long password you don’t use anywhere else, and sign out on shared computers.",
    words: "2fa two factor mfa authenticator security sign in",
  },
  {
    id: "export",
    topic: "account",
    q: "Can I export my data?",
    a: "Your invoices and quotes download as PDFs from their pages. A full export of your books isn’t available yet. If you need a copy of your data before then, write to us and we’ll help.",
    words: "export download backup data csv pdf leave copy",
  },
  {
    id: "data-apart",
    topic: "account",
    q: "Who can see my books?",
    a: "You, and, once the accountant link arrives, the accountant or practitioner you choose. Each business’s data is kept apart from every other business’s. Nobody at BillingEase looks at your books unless you ask us to help with something specific.",
    link: { label: "Privacy policy", href: legalHref("privacy") },
    words: "privacy who see data access staff secure",
  },
  {
    id: "close",
    topic: "account",
    q: "How do I close my account?",
    a: "Write to us from the email address you signed up with and we’ll close it. Some records may have to be kept for a period the law sets for tax records; the privacy policy explains what and for how long.",
    link: { label: "Privacy policy", href: legalHref("privacy") },
    words: "delete close remove account erase cancel",
  },
];

export const HELP_PAGE = {
  kicker: "Help centre",
  title: "How can we help?",
  lead: "Short answers in plain words, about what BillingEase does today. If they don’t do it, write to us and a person reads every message.",
  tries: { uk: ["send an invoice", "VAT", "expense", "MTD", "password"], lk: ["Tax Invoice", "cheque", "WhatsApp", "SSCL", "password"] },
};

/** Answers for a country, in topic order. */
export function helpFor(country: SiteCountry): HelpAnswer[] {
  return HELP.filter((h) => !h.only || h.only === country);
}
