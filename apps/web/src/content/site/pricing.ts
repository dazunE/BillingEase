/**
 * Copy for /pricing (prototype SitePricing). Plans and prices come from
 * ./plans.ts (PLANS, PRICE_NOTE): prices are placeholders until decided.
 */
import type { ByCountry, Copy } from "./country";

export const PRICING_META = {
  title: "Pricing",
  description: "Plans in pounds for the UK and in rupees for Sri Lanka: free to start, a paid plan for MTD or Tax Invoices and payroll, and a per-client price for accountants and practitioners. Prices are placeholders while we finish pricing.",
};

export const PRICING_HERO = {
  kicker: "Pricing",
  title: "Start free. Upgrade when it pays for itself.",
  lead: {
    uk: "Every plan keeps your three numbers up to date, with proper books underneath. Pay only when you want MTD quarters, landlord mode and your accountant on the same books.",
    lk: "Every plan keeps your three numbers up to date, with proper books underneath. Pay only when you need Tax Invoices with VAT and SSCL, payroll, or your practitioner on the same books.",
  } satisfies Copy,
  draft: "Placeholder prices, not final",
};

/** "What every plan includes" (replaces the prototype's payment add-ons: we take no payment fees). */
export const PRICING_INCLUDED = {
  title: "No add-ons, no fees on your money.",
  lead: "BillingEase never handles your customers’ payments, so there’s nothing taken out of them. These come with every plan, Free included.",
  items: [
    { icon: "M12 6c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 3v6c0 1.7 3.6 3 8 3s8-1.3 8-3V3M4 9v6c0 1.7 3.6 3 8 3s8-1.3 8-3V9", tint: "#EEE8FF", name: "No fees on payments", price: { uk: "£0 per payment", lk: "Rs 0 per payment" }, line: { uk: "Customers pay you by transfer, card machine, cash or cheque. You record it; we take nothing.", lk: "Customers pay you by transfer, cheque, cash or LankaQR. You record it; we take nothing." }, where: "Every plan" },
    { icon: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M8 13h8M8 17h5", tint: "#FDE6D6", name: "Unlimited invoices and quotes", price: { uk: "No monthly cap", lk: "No monthly cap" }, line: { uk: "As many invoices, quotes, credit notes and customers as you need, each as a PDF.", lk: "As many Tax Invoices, quotes, credit notes and customers as you need, each as a PDF." }, where: "Every plan" },
    { icon: "M20 11.5 12 19.5a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17.5a2 2 0 0 1-3-3l7.5-7.5", tint: "#E2F6D5", name: "Attachments on every cost", price: { uk: "Photos and PDFs", lk: "Photos and PDFs" }, line: { uk: "Attach the receipt or bill to each expense, so the paperwork is where HMRC expects it.", lk: "Attach the receipt or Tax Invoice to each expense, so the paperwork is where the IRD expects it." }, where: "Every plan" },
  ],
};

export const PRICING_CALC = {
  title: "Which plan fits?",
  lead: "Tell us a few things about your business. We’ll suggest a plan and add it up, at today’s placeholder prices.",
  presets: {
    uk: [
      { label: "Freelance designer", v: { mtd: false, landlord: false, vat: false, people: 1, practice: false, clients: 20 } },
      { label: "Landlord, two flats", v: { mtd: true, landlord: true, vat: false, people: 2, practice: false, clients: 20 } },
      { label: "Accountancy practice", v: { mtd: true, landlord: false, vat: false, people: 3, practice: true, clients: 40 } },
    ],
    lk: [
      { label: "Freelance designer", v: { vat: false, staff: 0, people: 1, practice: false, clients: 20 } },
      { label: "Design studio, 5 staff", v: { vat: true, staff: 5, people: 2, practice: false, clients: 20 } },
      { label: "Tax practice", v: { vat: false, staff: 0, people: 3, practice: true, clients: 40 } },
    ],
  },
  maxPeople: 10,
};

type Cell = boolean | string;
export type CompareGroup = { id: string; name: string; dot: string; rows: [string, string, Cell, Cell, Cell][] };

export const PRICING_COMPARE: ByCountry<CompareGroup[]> = {
  uk: [
    {
      id: "in",
      name: "Coming in",
      dot: "#7A5AF8",
      rows: [
        ["Invoices, quotes and customers", "Written in a sentence, sent as PDF", "Unlimited", "Unlimited", "Each client: unlimited"],
        ["Payments you record", "Bank transfer, card machine, cash, cheque", true, true, true],
        ["Repeating invoices", "Drafted or emailed on the day", false, true, true],
        ["VAT invoices", "When you’re VAT registered", false, true, true],
      ],
    },
    {
      id: "out",
      name: "Going out",
      dot: "#E0752D",
      rows: [
        ["Expenses and bills", "With a photo or PDF attached", true, true, true],
        ["HMRC categories", "Plain names, MTD categories underneath", true, true, true],
        ["Landlord mode and mileage", "Properties, mortgage interest, simplified mileage", false, true, true],
      ],
    },
    {
      id: "keep",
      name: "Yours to keep",
      dot: "#B9A3FF",
      rows: [
        ["Your three numbers", "Coming in − Going out = Yours to keep", true, true, true],
        ["MTD quarters", "With readiness checks", false, true, true],
        ["Income Tax and NI estimate", "Payments on account on Home", false, true, true],
      ],
    },
    {
      id: "people",
      name: "People",
      dot: "#18161F",
      rows: [
        ["Who signs in", "", "Just you", "You and your accountant", "Your practice and each client"],
        ["Your accountant sees the same books", "Requests on your Home", false, true, true],
      ],
    },
    {
      id: "practice",
      name: "For practices",
      dot: "#4F7F49",
      rows: [
        ["Quarter status and requests", "Every client in the TaxWise practice workbench", false, false, true],
        ["Lock a quarter once filed", "", false, false, true],
        ["Your practice name on their books", "", false, false, true],
      ],
    },
  ],
  lk: [
    {
      id: "in",
      name: "Coming in",
      dot: "#7A5AF8",
      rows: [
        ["Invoices, quotes and customers", "Written in a sentence, sent as PDF", "Unlimited", "Unlimited", "Each client: unlimited"],
        ["Payments you record", "Bank transfer, cheque, cash, LankaQR", true, true, true],
        ["Tax Invoices with VAT and SSCL", "VAT 18% and SSCL 2.5% on their own lines", false, true, true],
        ["Reminders by email and WhatsApp", "Already written, you press send", false, true, true],
      ],
    },
    {
      id: "out",
      name: "Going out",
      dot: "#E0752D",
      rows: [
        ["Expenses and bills", "With a photo or PDF attached", true, true, true],
        ["Payroll", "EPF, ETF, APIT and payslips", false, true, true],
      ],
    },
    {
      id: "keep",
      name: "Yours to keep",
      dot: "#B9A3FF",
      rows: [
        ["Your three numbers", "Coming in − Going out = Yours to keep", true, true, true],
        ["VAT and SSCL period summaries", "In the order of the IRD return", false, true, true],
        ["Year-end hand-off to TaxWise.lk", "Figures straight into the return", false, true, true],
      ],
    },
    {
      id: "people",
      name: "People",
      dot: "#18161F",
      rows: [["Who signs in", "", "Just you", "You and your practitioner", "Your firm and each client"]],
    },
    {
      id: "practice",
      name: "For practitioners",
      dot: "#4F7F49",
      rows: [
        ["Monthly VAT, SSCL and payroll position", "Every client in the TaxWise.lk practitioner tool", false, false, true],
        ["Requests to clients", "", false, false, true],
        ["Lock a period once filed", "", false, false, true],
      ],
    },
  ],
};

export const PRICING_QUOTES: ByCountry<{ plan: string; quote: string; name: string; role: string; tint: "violet" | "orange" | "grey" }[]> = {
  uk: [
    { plan: "On Free", quote: "Invoices and a handful of receipts a month. Free covers it, and my three numbers are always up to date.", name: "Ellie Harper", role: "Harper Studio, Leeds (sample business)", tint: "grey" },
    { plan: "On MTD ready", quote: "Two flats, mortgage interest kept apart, and every quarter ready for my accountant before she asks.", name: "Tom Pickering", role: "Pickering Lets, York (sample business)", tint: "violet" },
    { plan: "For practices", quote: "Forty clients, one list of quarters. I can see who’s ready to file and who needs a nudge.", name: "Priya Shah", role: "Dale & Shaw, Leeds (sample practice)", tint: "orange" },
  ],
  lk: [
    { plan: "On Free", quote: "I’m not VAT registered yet, so Free is enough: invoices, expenses and the three numbers.", name: "Kasun Rathnayake", role: "Freelance illustrator, Kandy (sample)", tint: "grey" },
    { plan: "On Business", quote: "Tax Invoices with SSCL on its own line and payroll for five people. It pays for itself in the first pay run.", name: "Ayesha Fernando", role: "Serendib Design Studio, Colombo 03 (sample business)", tint: "violet" },
    { plan: "For practitioners", quote: "Every client’s VAT and payroll position each month, and the year straight into TaxWise.lk.", name: "Ruwan Jayasinghe", role: "Jayasinghe & Co (sample practice)", tint: "orange" },
  ],
};

export const PRICING_SALES = {
  title: { uk: "More than 10 people, or books for clients?", lk: "More than 10 people, or books for clients?" } satisfies Copy,
  body: "Bigger teams and practices get a person who’ll set you up and price it around how you work. A short call, no pressure.",
  acct: {
    uk: "practices pay per client, from the TaxWise practice workbench. Your clients get everything in MTD ready.",
    lk: "practitioners pay per client, from the TaxWise.lk practitioner tool. Your clients get everything in Business.",
  } satisfies Copy,
};

export const PRICING_FAQ: ByCountry<{ q: string; a: string }[]> = {
  uk: [
    { q: "Are these the final prices?", a: "No. The prices on this page are placeholders while we finish pricing. Anything on the free plan stays free, and we’ll tell you the real price before you’re ever charged." },
    { q: "Is the free plan really free?", a: "Yes, with no time limit and no card needed. Invoices, quotes, expenses with attachments, HMRC categories and your three numbers, for as long as you like." },
    { q: "Do you take a fee when customers pay me?", a: "No. Customers pay you directly and you record the payment. BillingEase never handles the money, so there are no payment fees." },
    { q: "What does my accountant pay?", a: "Practices pay per client per month from the TaxWise practice workbench, and their clients get everything in MTD ready. If your accountant pays for you, you don’t pay us separately." },
    { q: "Are prices with or without VAT?", a: "That’s being decided with the final prices. We’ll show it clearly before anyone is charged." },
    { q: "What happens to my books if I leave?", a: "They stay yours. Invoices and quotes download as PDF today; a full export of your books is planned and will be on every plan." },
  ],
  lk: [
    { q: "Are these the final prices?", a: "No. The prices on this page are placeholders while we finish pricing. Anything on the free plan stays free, and we’ll tell you the real price before you’re ever charged." },
    { q: "Is the free plan really free?", a: "Yes, with no time limit and no card needed. Invoices, quotes, expenses with attachments and your three numbers, for as long as you like." },
    { q: "Do you take a fee when customers pay me?", a: "No. Customers pay you directly by transfer, cheque, cash or LankaQR and you record it. BillingEase never handles the money." },
    { q: "Is there a bundle with a TaxWise.lk return?", a: "We’re looking at one. For now, Business includes the year-end hand-off into your TaxWise.lk return." },
    { q: "What does my practitioner pay?", a: "Practitioners pay per client per month from the TaxWise.lk practitioner tool, and their clients get everything in Business." },
    { q: "What happens to my books if I leave?", a: "They stay yours. Tax Invoices, quotes and payslips download as PDF today; a full export of your books is planned and will be on every plan." },
  ],
};

export const PRICING_CTA = {
  kicker: "Free for as long as you like",
  title: { uk: "See your three numbers before you pay a penny.", lk: "See your three numbers before you pay a rupee." } satisfies Copy,
};
