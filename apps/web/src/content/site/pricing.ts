/**
 * Copy for /pricing (prototype SitePricing). Plans and prices come from
 * ./plans.ts (PLANS, PRICE_NOTE, TRIAL_DAYS, FOUNDING_SEATS).
 */
import type { ByCountry, Copy } from "./country";
import { FOUNDING_SEATS, FREE_LIMITS, TRIAL_DAYS } from "./plans";

export const PRICING_META = {
  title: "Pricing",
  description: "Plans in pounds for the UK and in rupees for Sri Lanka: Free for the basics, Pro for MTD or Tax Invoices and payroll, Pro Plus for bigger teams, and a per-client price for accountants and practitioners.",
};

export const PRICING_HERO = {
  kicker: "Pricing",
  title: "Start free. Upgrade when it pays for itself.",
  lead: {
    uk: "Every plan keeps your three numbers up to date, with proper books underneath. Free covers a few invoices a month; Pro adds the quarters, VAT and landlord mode Making Tax Digital asks of you.",
    lk: "Every plan keeps your three numbers up to date, with proper books underneath. Free covers a few invoices a month; Pro adds Tax Invoices with VAT and SSCL, and payroll.",
  } satisfies Copy,
  draft: `Founding price for the first ${FOUNDING_SEATS} members`,
};

/** "What every plan includes" (replaces the prototype's payment add-ons: we take no payment fees). */
export const PRICING_INCLUDED = {
  title: "No add-ons, no fees on your money.",
  lead: "BillingEase never handles your customers’ payments, so there’s nothing taken out of them. These come with every plan, Free included.",
  items: [
    { icon: "M12 6c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 3v6c0 1.7 3.6 3 8 3s8-1.3 8-3V3M4 9v6c0 1.7 3.6 3 8 3s8-1.3 8-3V9", tint: "#EEE8FF", name: "No fees on payments", price: { uk: "£0 per payment", lk: "Rs 0 per payment" }, line: { uk: "Customers pay you by transfer, card machine, cash or cheque. You record it; we take nothing.", lk: "Customers pay you by transfer, cheque, cash or LankaQR. You record it; we take nothing." }, where: "Every plan" },
    { icon: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M8 13h8M8 17h5", tint: "#FDE6D6", name: "Unlimited quotes and customers", price: { uk: "No cap", lk: "No cap" }, line: { uk: `As many quotes and customers as you need, each as a PDF. Free sends ${FREE_LIMITS.invoices} invoices a month; Pro has no cap.`, lk: `As many quotes and customers as you need, each as a PDF. Free sends ${FREE_LIMITS.invoices} Tax Invoices a month; Pro has no cap.` }, where: "Every plan" },
    { icon: "M20 11.5 12 19.5a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17.5a2 2 0 0 1-3-3l7.5-7.5", tint: "#E2F6D5", name: "Attachments on every cost", price: { uk: "Photos and PDFs", lk: "Photos and PDFs" }, line: { uk: "Attach the receipt or bill to each expense, so the paperwork is where HMRC expects it.", lk: "Attach the receipt or Tax Invoice to each expense, so the paperwork is where the IRD expects it." }, where: "Every plan" },
  ],
};

export const PRICING_CALC = {
  title: "Which plan fits?",
  lead: "Tell us a few things about your business. We’ll suggest a plan and add it up, billed yearly.",
  presets: {
    uk: [
      { label: "Freelance designer", v: { mtd: false, landlord: false, vat: false, people: 1, practice: false, clients: 20 } },
      { label: "Landlord, two flats", v: { mtd: true, landlord: true, vat: false, people: 2, practice: false, clients: 20 } },
      { label: "Agency, 6 people", v: { mtd: true, landlord: false, vat: true, people: 6, practice: false, clients: 20 } },
      { label: "Accountancy practice", v: { mtd: true, landlord: false, vat: false, people: 3, practice: true, clients: 40 } },
    ],
    lk: [
      { label: "Freelance designer", v: { vat: false, staff: 0, people: 1, practice: false, clients: 20 } },
      { label: "Design studio, 5 staff", v: { vat: true, staff: 5, people: 2, practice: false, clients: 20 } },
      { label: "Restaurant, 30 staff", v: { vat: true, staff: 30, people: 4, practice: false, clients: 20 } },
      { label: "Tax practice", v: { vat: false, staff: 0, people: 3, practice: true, clients: 40 } },
    ],
  },
  maxPeople: 10,
};

type Cell = boolean | string;
/** A feature row: name, hint, then one cell per plan in PLANS order (Free, Pro, Pro Plus, practices). */
export type CompareRow = [string, string, Cell, Cell, Cell, Cell];
export type CompareGroup = { id: string; name: string; dot: string; rows: CompareRow[] };

const F = FREE_LIMITS;

export const PRICING_COMPARE: ByCountry<CompareGroup[]> = {
  uk: [
    {
      id: "in",
      name: "Coming in",
      dot: "#7A5AF8",
      rows: [
        ["Invoices", "Written in a sentence, sent as PDF", `${F.invoices} a month`, "Unlimited", "Unlimited", "Each client: unlimited"],
        ["Quotes and customers", "", "Unlimited", "Unlimited", "Unlimited", "Unlimited"],
        ["Payments you record", "Bank transfer, card machine, cash, cheque", true, true, true, true],
        ["Repeating invoices and reminders", "Drafted or emailed on the day", false, true, true, true],
        ["VAT invoices", "When you’re VAT registered", false, true, true, true],
      ],
    },
    {
      id: "out",
      name: "Going out",
      dot: "#E0752D",
      rows: [
        ["Expenses and bills", "With a photo or PDF attached", `${F.attachments} attachments a month`, "Unlimited", "Unlimited", "Unlimited"],
        ["Receipt photos read for you", "Amount, date and supplier filled in", `${F.receiptScans} a month`, true, true, true],
        ["Bank statement import", "Any bank’s CSV or PDF, checked by you", false, true, true, true],
        ["HMRC categories", "Plain names, MTD categories underneath", true, true, true, true],
        ["Landlord mode and mileage", "Properties, mortgage interest, simplified mileage", false, true, true, true],
      ],
    },
    {
      id: "keep",
      name: "Yours to keep",
      dot: "#B9A3FF",
      rows: [
        ["Your three numbers", "Coming in − Going out = Yours to keep", true, true, true, true],
        ["MTD quarters", "With readiness checks", false, true, true, true],
        ["Income Tax and NI estimate", "Payments on account on Home", false, true, true, true],
        ["Ask", "Questions about your books, answered", false, false, true, false],
        ["Reminder agent", "Drafts chasers for late invoices, for you to check", false, false, true, false],
      ],
    },
    {
      id: "people",
      name: "People and businesses",
      dot: "#18161F",
      rows: [
        ["Who signs in", "Your accountant never counts", "Just you", "You and 1 more", "Up to 10 people", "Your practice and each client"],
        ["Your accountant sees the same books", "Requests on your Home", false, true, true, true],
        ["Businesses on one plan", "", "1", "1", "Up to 3", "1 per client"],
        ["API and AI assistant connector", "Personal access tokens and MCP", false, false, true, false],
      ],
    },
    {
      id: "practice",
      name: "For practices",
      dot: "#4F7F49",
      rows: [
        ["Quarter status and requests", "Every client in the TaxWise practice workbench", false, false, false, true],
        ["Lock a quarter once filed", "", false, false, false, true],
        ["Your practice name on their books", "", false, false, false, true],
      ],
    },
  ],
  lk: [
    {
      id: "in",
      name: "Coming in",
      dot: "#7A5AF8",
      rows: [
        ["Invoices", "Written in a sentence, sent as PDF", `${F.invoices} a month`, "Unlimited", "Unlimited", "Each client: unlimited"],
        ["Quotes and customers", "", "Unlimited", "Unlimited", "Unlimited", "Unlimited"],
        ["Payments you record", "Bank transfer, cheque, cash, LankaQR", true, true, true, true],
        ["Tax Invoices with VAT and SSCL", "VAT 18% and SSCL 2.5% on their own lines", false, true, true, true],
        ["Reminders by email and WhatsApp", "Already written, you press send", false, true, true, true],
      ],
    },
    {
      id: "out",
      name: "Going out",
      dot: "#E0752D",
      rows: [
        ["Expenses and bills", "With a photo or PDF attached", `${F.attachments} attachments a month`, "Unlimited", "Unlimited", "Unlimited"],
        ["Receipt photos read for you", "Amount, date and supplier filled in", `${F.receiptScans} a month`, true, true, true],
        ["Bank statement import", "Any bank’s CSV or PDF, checked by you", false, true, true, true],
        ["Payroll", "EPF, ETF, APIT and payslips", false, "5 people, then Rs 300 each a month", "25 people, then Rs 250 each a month", true],
      ],
    },
    {
      id: "keep",
      name: "Yours to keep",
      dot: "#B9A3FF",
      rows: [
        ["Your three numbers", "Coming in − Going out = Yours to keep", true, true, true, true],
        ["VAT and SSCL period summaries", "In the order of the IRD return", false, true, true, true],
        ["Year-end hand-off to TaxWise.lk", "Figures straight into the return", false, true, true, true],
        ["Ask", "Questions about your books, answered", false, false, true, false],
        ["Reminder agent", "Drafts chasers for late invoices, for you to check", false, false, true, false],
      ],
    },
    {
      id: "people",
      name: "People and businesses",
      dot: "#18161F",
      rows: [
        ["Who signs in", "Your practitioner never counts", "Just you", "You and 1 more", "Up to 10 people", "Your firm and each client"],
        ["Your practitioner sees the same books", "Requests on your Home", false, true, true, true],
        ["Businesses on one plan", "", "1", "1", "Up to 3", "1 per client"],
        ["API and AI assistant connector", "Personal access tokens and MCP", false, false, true, false],
      ],
    },
    {
      id: "practice",
      name: "For practitioners",
      dot: "#4F7F49",
      rows: [
        ["Monthly VAT, SSCL and payroll position", "Every client in the TaxWise.lk practitioner tool", false, false, false, true],
        ["Requests to clients", "", false, false, false, true],
        ["Lock a period once filed", "", false, false, false, true],
      ],
    },
  ],
};

export const PRICING_QUOTES: ByCountry<{ plan: string; quote: string; name: string; role: string; tint: "violet" | "orange" | "grey" }[]> = {
  uk: [
    { plan: "On Free", quote: "Invoices and a handful of receipts a month. Free covers it, and my three numbers are always up to date.", name: "Ellie Harper", role: "Harper Studio, Leeds (sample business)", tint: "grey" },
    { plan: "On Pro", quote: "Two flats, mortgage interest kept apart, and every quarter ready for my accountant before she asks.", name: "Tom Pickering", role: "Pickering Lets, York (sample business)", tint: "violet" },
    { plan: "For practices", quote: "Forty clients, one list of quarters. I can see who’s ready to file and who needs a nudge.", name: "Priya Shah", role: "Dale & Shaw, Leeds (sample practice)", tint: "orange" },
  ],
  lk: [
    { plan: "On Free", quote: "I’m not VAT registered yet, so Free is enough: invoices, expenses and the three numbers.", name: "Kasun Rathnayake", role: "Freelance illustrator, Kandy (sample)", tint: "grey" },
    { plan: "On Pro", quote: "Tax Invoices with SSCL on its own line and payroll for five people. It pays for itself in the first pay run.", name: "Ayesha Fernando", role: "Serendib Design Studio, Colombo 03 (sample business)", tint: "violet" },
    { plan: "For practitioners", quote: "Every client’s VAT and payroll position each month, and the year straight into TaxWise.lk.", name: "Ruwan Jayasinghe", role: "Jayasinghe & Co (sample practice)", tint: "orange" },
  ],
};

export const PRICING_SALES = {
  title: { uk: "More than 10 people, or books for clients?", lk: "More than 10 people, or books for clients?" } satisfies Copy,
  body: "Bigger teams and practices get a person who’ll set you up and price it around how you work. A short call, no pressure.",
  acct: {
    uk: "practices pay per client, billed yearly from 10 clients, from the TaxWise practice workbench. Your clients get everything in Pro.",
    lk: "practitioners pay per client, billed yearly from 10 clients, from the TaxWise.lk practitioner tool. Your clients get everything in Pro.",
  } satisfies Copy,
};

export const PRICING_FAQ: ByCountry<{ q: string; a: string }[]> = {
  uk: [
    { q: "Is Free really free?", a: `Yes, with no time limit and no card needed: ${FREE_LIMITS.invoices} invoices and ${FREE_LIMITS.attachments} attachments a month, unlimited quotes and customers, and your three numbers.` },
    { q: "How does the free trial work?", a: `Your first business gets Pro free for ${TRIAL_DAYS} days, with no card needed. At the end you stay on Free unless you choose a plan, and nothing you’ve entered is lost.` },
    { q: "What is the founding price?", a: `The first ${FOUNDING_SEATS} businesses to subscribe yearly to Pro or Pro Plus pay the founding price, and keep it for as long as they stay subscribed.` },
    { q: "Can I pay monthly?", a: "Yes, Pro and Pro Plus can be paid month to month. Paying yearly costs two months less, and the founding price is yearly only." },
    { q: "Do you take a fee when customers pay me?", a: "No. Customers pay you directly and you record the payment. BillingEase never handles the money, so there are no payment fees." },
    { q: "What does my accountant pay?", a: "Nothing to see your books on Pro or Pro Plus: your accountant never counts as a person on your plan. Practices that put clients on BillingEase pay per client, billed yearly from 10 clients, and their clients get everything in Pro." },
    { q: "Are prices with or without VAT?", a: "Any VAT is shown before you pay, on the checkout page and on your receipt." },
    { q: "What happens if I move back to Free?", a: "Everything stays: your books, invoices and attachments. New invoices and attachments count against Free’s monthly limits, and Pro features become read-only." },
  ],
  lk: [
    { q: "Is Free really free?", a: `Yes, with no time limit and no card needed: ${FREE_LIMITS.invoices} invoices and ${FREE_LIMITS.attachments} attachments a month, unlimited quotes and customers, and your three numbers.` },
    { q: "How does the free trial work?", a: `Your first business gets Pro free for ${TRIAL_DAYS} days, with no card needed. At the end you stay on Free unless you choose a plan, and nothing you’ve entered is lost.` },
    { q: "What is the founding price?", a: `The first ${FOUNDING_SEATS} businesses to subscribe yearly to Pro or Pro Plus pay the founding price, and keep it for as long as they stay subscribed.` },
    { q: "Can I pay monthly?", a: "Yes, Pro and Pro Plus can be paid month to month. Paying yearly costs two months less, and the founding price is yearly only." },
    { q: "How is payroll priced?", a: "Pro includes payroll for 5 people, then Rs 300 a person a month. Pro Plus includes 25, then Rs 250 a person a month." },
    { q: "Do you take a fee when customers pay me?", a: "No. Customers pay you directly by transfer, cheque, cash or LankaQR and you record it. BillingEase never handles the money." },
    { q: "What does my practitioner pay?", a: "Nothing to see your books on Pro or Pro Plus: your practitioner never counts as a person on your plan. Practitioners who put clients on BillingEase pay per client, billed yearly from 10 clients, and their clients get everything in Pro." },
    { q: "What happens if I move back to Free?", a: "Everything stays: your books, invoices and attachments. New invoices and attachments count against Free’s monthly limits, and Pro features become read-only." },
  ],
};

export const PRICING_CTA = {
  kicker: "Free for as long as you like",
  title: { uk: "See your three numbers before you pay a penny.", lk: "See your three numbers before you pay a rupee." } satisfies Copy,
};
