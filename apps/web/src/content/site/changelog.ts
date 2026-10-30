/**
 * What's new (/changelog). Real entries only, dated from the git history
 * (`git log --format='%ad %s' --date=short`). Newest first.
 */
import { guideHref, ROUTES } from "./routes";

export type ChangeTag = "New" | "Improved" | "Fixed";
export type ChangeVisual = "countries" | "taxInvoice" | "goingOut" | "home" | "spec" | "prototype";

export type ChangeEntry = {
  id: string;
  /** ISO date of the commit. */
  date: string;
  tag: ChangeTag;
  title: string;
  body: string;
  points?: string[];
  visual?: ChangeVisual;
  link?: { label: string; href: string };
};

export const CHANGELOG: ChangeEntry[] = [
  {
    id: "capture-agent",
    date: "2026-10-18",
    tag: "New",
    title: "Snap a receipt or bill: BillingEase reads it for you to check",
    body: "Send a photo or PDF of a receipt or a supplier’s bill and BillingEase reads it, checks that the amounts and the VAT (and SSCL in Sri Lanka) add up, and drafts the expense or bill. It waits in For you to check until you approve it, and you can change any detail first. Ask now runs on Google’s Gemini, and you can see what the AI costs your business each month.",
  },
  {
    id: "site-two-countries",
    date: "2026-10-14",
    tag: "New",
    title: "This website, for the UK and Sri Lanka",
    body: "The site now opens in your country, with prices in pounds or rupees and the parts that differ between the two (Making Tax Digital in the UK; Tax Invoices, SSCL and payroll in Sri Lanka). Switch country from the header at any time.",
    link: { label: "What changes with your country", href: ROUTES.countries.href },
  },
  {
    id: "repeating-bill-day",
    date: "2026-10-11",
    tag: "Fixed",
    title: "Repeating invoices keep their bill day",
    body: "A monthly invoice due on the 31st now bills on the 28th in February and goes back to the 31st in March, instead of drifting to the 28th for good.",
  },
  {
    id: "numbers-without-vat",
    date: "2026-10-11",
    tag: "Improved",
    title: "The three numbers leave out VAT and SSCL",
    body: "VAT you charge, VAT you pay and SSCL aren’t yours to keep, so Coming in, Going out and Yours to keep now leave them out. They’re shown on their own, for your return.",
    link: { label: "Guide: writing a Sri Lankan Tax Invoice", href: guideHref("writing-a-sri-lankan-tax-invoice") },
  },
  {
    id: "coming-in",
    date: "2026-10-11",
    tag: "New",
    title: "Invoices, Tax Invoices and quotes",
    body: "The first build of Coming in: invoices with a PDF and an email to your customer, quotes you mark accepted and turn into invoices, repeating invoices, credit notes, customers and a price list. Record payments yourself, and send reminders.",
    points: [
      "UK: VAT invoices when you’re VAT registered",
      "Sri Lanka: Tax Invoices with VAT 18% and SSCL 2.5% on their own lines",
      "Sri Lanka: payments by cheque, with its number and bank, and reminders on WhatsApp",
    ],
    visual: "taxInvoice",
    link: { label: "More about Coming in", href: ROUTES.comingIn.href },
  },
  {
    id: "going-out",
    date: "2026-10-11",
    tag: "New",
    title: "Expenses, bills and every-month costs",
    body: "The first build of Going out: record an expense with a photo or PDF attached, add bills and mark them paid in full or in part, keep suppliers, and set up the costs you pay every month.",
    points: ["Categories for your country, HMRC’s in the UK", "Business-use share for things you use partly yourself", "What’s still to pay, in one list"],
    visual: "goingOut",
    link: { label: "More about Going out", href: ROUTES.goingOut.href },
  },
  {
    id: "home-ask",
    date: "2026-10-11",
    tag: "New",
    title: "Home and Ask",
    body: "Home shows your three numbers for the period you choose and what needs you next. Ask answers questions from your own books and official sources, lists the sources, and suggests your accountant when it needs judgement. Search and notifications arrived at the same time.",
    visual: "home",
    link: { label: "More about Yours to keep", href: ROUTES.yoursToKeep.href },
  },
  {
    id: "sign-up-country",
    date: "2026-10-11",
    tag: "New",
    title: "Sign up by country",
    body: "Sign-up starts by choosing the United Kingdom or Sri Lanka. Setup then asks only what applies there, and your country sets the currency, the tax year and the rules from the first screen.",
    points: ["UK: sole trader, landlord or both; VAT; quarter dates; cash or invoice basis", "Sri Lanka: business type, TIN, VAT and SSCL registration", "One business per account, with its data kept apart"],
    visual: "countries",
    link: { label: "UK and Sri Lanka", href: ROUTES.countries.href },
  },
  {
    id: "spec",
    date: "2026-10-11",
    tag: "New",
    title: "The plan: one product, two countries",
    body: "We wrote down what BillingEase is for: UK sole traders and landlords getting ready for Making Tax Digital, and small businesses in Sri Lanka, with entries you make by hand and an accountant who sees the same books. Bank feeds, card payments, receipt reading and the US are out.",
    visual: "spec",
  },
  {
    id: "prototype",
    date: "2026-10-03",
    tag: "New",
    title: "The clickable prototype",
    body: "Every screen started as a clickable design, built around three numbers: Coming in, Going out and Yours to keep. In October it was redrawn for the UK and Sri Lanka, with country packs, two sample businesses, Sri Lankan payroll and UK payroll records.",
    visual: "prototype",
  },
];

export const CHANGELOG_PAGE = {
  kicker: "What’s new",
  title: "Every update, in plain words.",
  lead: "What changed in BillingEase, and what it means for your books. Small fixes that don’t change how you work aren’t listed.",
};
