/**
 * Copy for the home page (/). Country-specific copy is `{ uk, lk }`.
 * Sample businesses live in ./samples.ts, plans in ./plans.ts.
 */
import type { ByCountry, Copy } from "./country";
import { ROUTES } from "./routes";

export const HOME_META = {
  title: "BillingEase · Your whole business in three numbers",
  description:
    "Bookkeeping, invoicing and payroll you enter by hand, for sole traders and landlords in the UK and small businesses in Sri Lanka. Coming in − Going out = Yours to keep.",
};

export const HERO = {
  title: "Your whole business in three numbers.",
  lead: {
    uk: "Invoices, expenses and Making Tax Digital quarters for sole traders and landlords. You see what’s coming in, what’s going out, and what’s yours to keep. Your accountant sees the same books.",
    lk: "Tax Invoices, expenses and payroll for small businesses in Sri Lanka. You see what’s coming in, what’s going out, and what’s yours to keep. Your practitioner sees the same books.",
  } satisfies Copy,
  flowIn: "FROM CUSTOMERS",
  flowOut: "TO BILLS AND COSTS",
  cta: "See your three numbers",
  ctaNote: "Free to start. No card needed.",
  sampleNote: "Sample business and illustrative figures.",
  tapHint: "Tap any number to see what sits behind it.",
};

/** The panels behind each of the three numbers. `ex` names the sample's example (see SampleBusiness.ex). */
export type PanelItem = { icon: string; title: Copy; tag: Copy; ex: "inv" | "pay" | "rem" | "bills" | "att" | "every" | "payroll" | "tax" | "period" | "acct" };

const IC = {
  doc: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M8 13h8M8 17h5",
  coins: "M12 6c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 3v6c0 1.7 3.6 3 8 3s8-1.3 8-3V3M4 9v6c0 1.7 3.6 3 8 3s8-1.3 8-3V9",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4",
  bill: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  clip: "M20 11.5 12 19.5a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17.5a2 2 0 0 1-3-3l7.5-7.5",
  repeat: "M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4",
  people: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8",
  safe: "M4 5h16v14H4zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M12 9v1M8 19v2M16 19v2",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  chat: "M4 5h16v11H8l-4 4zM8 9h8M8 12h5",
  shield: "M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6zM9 12l2 2 4-4",
  car: "M5 16h14M6 16l1.5-5h9L18 16M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  house: "M3 11 12 4l9 7M5 10v10h14V10M10 20v-5h4v5",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
};
export const HOME_ICONS = IC;

export const PANELS: Record<"in" | "out" | "keep", { name: string; href: string; lead: Copy; items: PanelItem[] }> = {
  in: {
    name: "Coming in",
    href: ROUTES.comingIn.href,
    lead: "Invoices out, payments recorded, nobody forgotten.",
    items: [
      { icon: IC.doc, title: "Invoices in a sentence", tag: { uk: "Invoices, quotes, credit notes", lk: "Tax Invoices, quotes, credit notes" }, ex: "inv" },
      { icon: IC.coins, title: "Payments you record", tag: { uk: "Bank transfer, card machine, cash, cheque", lk: "Bank transfer, cheque, cash, LankaQR" }, ex: "pay" },
      { icon: IC.bell, title: "Polite reminders", tag: { uk: "By email", lk: "By email and WhatsApp" }, ex: "rem" },
    ],
  },
  out: {
    name: "Going out",
    href: ROUTES.goingOut.href,
    lead: { uk: "Every pound out, in the right HMRC category.", lk: "Every rupee out, in the right category for your return." },
    items: [
      { icon: IC.bill, title: "Bills and suppliers", tag: "Paid in full or in part", ex: "bills" },
      { icon: IC.clip, title: "Expenses with the paperwork", tag: "A photo or PDF attached", ex: "att" },
      { icon: IC.repeat, title: "Every-month costs", tag: "Set up once", ex: "every" },
      { icon: IC.people, title: "Payroll", tag: { uk: "Records from your payroll software", lk: "EPF, ETF, APIT and payslips" }, ex: "payroll" },
    ],
  },
  keep: {
    name: "Yours to keep",
    href: ROUTES.yoursToKeep.href,
    lead: "What’s left after tax, so you can actually spend it.",
    items: [
      { icon: IC.safe, title: "Tax, estimated as you go", tag: { uk: "Income Tax and Class 4 NI", lk: "Income tax on business profit" }, ex: "tax" },
      { icon: IC.calendar, title: { uk: "MTD quarters", lk: "VAT and SSCL periods" }, tag: { uk: "Checked before they go", lk: "In the order of the return" }, ex: "period" },
      { icon: IC.person, title: "Your accountant, same books", tag: { uk: "They file, you don’t", lk: "Year-end to TaxWise.lk" }, ex: "acct" },
    ],
  },
};

export const KEEP_PANEL_NOTE = {
  hand: "Every payment, split as it lands.",
  body: {
    uk: "Most of it is yours. Some goes in the envelope for Income Tax and NI, so January is never a surprise.",
    lk: "Most of it is yours. Some goes in the envelope for income tax, so the instalment dates are never a surprise.",
  } satisfies Copy,
};

/* ─── Needs you (the Home screen, simplified) ─────────────────────────── */

export type Task = { id: string; icon: string; tint: "late" | "due" | "violet"; title: string; body: string; cta: string; doneText: string; log: string };

export const NEEDS_YOU: ByCountry<{ person: string; lead: string; chips: [string, string, string]; tasks: Task[]; activity: { t: string; when: string }[] }> = {
  uk: {
    person: "Ellie",
    lead: "You add what happened. Home keeps a short list of what needs you, including requests from your accountant. Try it: this is Ellie’s Sunday morning at Harper Studio.",
    chips: ["Q2 ready for Priya", "INV-0042 paid", "£2,960 set aside for tax"],
    tasks: [
      {
        id: "request",
        icon: IC.chat,
        tint: "violet",
        title: "Priya asked for records for 12–25 September",
        body: "Dale & Shaw need two more weeks of expenses before they file Q2 by 7 November.",
        cta: "I’ve added them",
        doneText: "Priya can see the records. Her request is cleared.",
        log: "You answered Priya’s request for 12–25 September",
      },
      {
        id: "late",
        icon: "M12 8v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
        tint: "late",
        title: "Ochre Café is 12 days late",
        body: "£850 for the menu design. One reminder has gone; a personal note might do it.",
        cta: "Send a reminder",
        doneText: "Reminder sent to Sam at Ochre Café.",
        log: "Reminder sent to Ochre Café for £850",
      },
      {
        id: "sort",
        icon: "M4 6h16M4 12h10M4 18h6",
        tint: "due",
        title: "2 expenses have no category",
        body: "Q3 started on 6 October. Pick a category so they count in the right HMRC box.",
        cta: "Pick categories",
        doneText: "Both sorted: Office costs, and Car, van and travel.",
        log: "Categorised 2 expenses for Q3",
      },
    ],
    activity: [
      { t: "Recorded Moor & Dale Outdoor’s £2,400 bank transfer", when: "Today, 9:12" },
      { t: "Sent invoice INV-0042 to Kirkstall Brewing Co", when: "Yesterday" },
      { t: "Shared the Q2 summary with Dale & Shaw", when: "6 Oct" },
      { t: "Attached a train ticket to an expense", when: "5 Oct" },
      { t: "Added broadband (£28) as an every-month cost", when: "1 Oct" },
    ],
  },
  lk: {
    person: "Ayesha",
    lead: "You add what happened. Home keeps a short list of what needs you, including requests from your practitioner. Try it: this is Ayesha’s Sunday morning at Serendib Design Studio.",
    chips: ["VAT and SSCL summary ready", "Cheque recorded", "Payslips ready"],
    tasks: [
      {
        id: "vat",
        icon: IC.calendar,
        tint: "due",
        title: "September VAT and SSCL is due 20 October",
        body: "The summary is ready in the order of the return. Check it, then share it with Ruwan to file.",
        cta: "Share with Ruwan",
        doneText: "Shared with Ruwan at Jayasinghe & Co.",
        log: "Shared the September VAT and SSCL summary",
      },
      {
        id: "payroll",
        icon: IC.people,
        tint: "violet",
        title: "October payroll for 5 people",
        body: "Salaries, EPF 8% and 12%, ETF 3% and APIT are worked out. Payslips are ready once you save the run.",
        cta: "Save the pay run",
        doneText: "Pay run saved. Payslips and the EPF, ETF and APIT schedules are ready.",
        log: "Saved the October pay run for 5 people",
      },
      {
        id: "late",
        icon: "M12 8v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
        tint: "late",
        title: "Galle Fort Boutique Hotel is 18 days late",
        body: "Rs 186,000 for the brochure. One email has gone; a WhatsApp might be quicker.",
        cta: "Send a WhatsApp reminder",
        doneText: "Reminder sent to Dinesh on WhatsApp.",
        log: "WhatsApp reminder sent to Galle Fort Boutique Hotel",
      },
    ],
    activity: [
      { t: "Recorded a cheque from Kandyan Spice Co for Rs 302,375", when: "Today, 9:40" },
      { t: "Sent Tax Invoice TI-0187 to Lanka Agri Exports", when: "Yesterday" },
      { t: "Attached a courier receipt to an expense", when: "8 Oct" },
      { t: "Emailed September payslips to 5 people", when: "26 Sep" },
      { t: "Added office rent (Rs 180,000) as an every-month cost", when: "1 Sep" },
    ],
  },
};

export const NEEDS_YOU_COPY = {
  title: "Home tells you what needs you.",
  more: { label: "See everything BillingEase does", href: ROUTES.features.href },
  listTitle: "Needs you",
  listAside: "Things only you can decide",
  logTitle: "Recent activity",
  logAside: "Latest first",
  logNote: "A plain list of what changed and who changed it. Nothing happens behind your back.",
  allClear: "All clear.",
  allClearBody: "Nothing else needs you today. Go enjoy your Sunday.",
  again: "Run it again",
  undo: "Undo",
};

/* ─── How it works ────────────────────────────────────────────────────── */

export const STEPS: { title: string; body: Copy; link: { label: string; href: string } }[] = [
  {
    title: "Send an invoice",
    body: { uk: "Write a sentence or fill in the form. When the money arrives, record the payment.", lk: "Write a sentence and get a Tax Invoice. When the money arrives, record the transfer, cheque or LankaQR payment." },
    link: { label: "More on Coming in", href: ROUTES.comingIn.href },
  },
  {
    title: "Note what goes out",
    body: "Add expenses and bills by hand with a photo or PDF attached. Set every-month costs up once.",
    link: { label: "More on Going out", href: ROUTES.goingOut.href },
  },
  {
    title: "Keep what’s yours",
    body: { uk: "See profit after estimated Income Tax and NI, quarter by quarter.", lk: "See profit after estimated income tax, with VAT and SSCL kept apart." },
    link: { label: "How Yours to keep works", href: ROUTES.yoursToKeep.href },
  },
];

/* ─── Features: everything behind the three numbers ───────────────────── */

export type FeatureLine = { icon: string; title: Copy; body: Copy; only?: "uk" | "lk" };

export const FEATURES: { title: string; lead: Copy; columns: { key: "in" | "out" | "keep"; name: string; href: string; items: FeatureLine[] }[]; shared: FeatureLine[] } = {
  title: "Everything sits behind one of three numbers",
  lead: { uk: "Built for HMRC’s categories and the tax year from 6 April.", lk: "Built for the IRD’s rules and the year of assessment from 1 April." },
  columns: [
    {
      key: "in",
      name: "Coming in",
      href: ROUTES.comingIn.href,
      items: [
        { icon: IC.doc, title: { uk: "Invoices and VAT invoices", lk: "Tax Invoices with VAT and SSCL" }, body: { uk: "VAT shown when you’re registered.", lk: "VAT 18% and SSCL 2.5% on their own lines." } },
        { icon: IC.repeat, title: "Quotes, credit notes, repeating invoices", body: "Turn an accepted quote into an invoice in one step." },
        { icon: IC.coins, title: "Payments you record", body: { uk: "Bank transfer, card machine, cash or cheque.", lk: "Bank transfer, cheque, cash or LankaQR." } },
        { icon: IC.bell, title: "Reminders", body: { uk: "Polite emails before and after the due date.", lk: "By email and WhatsApp." } },
      ],
    },
    {
      key: "out",
      name: "Going out",
      href: ROUTES.goingOut.href,
      items: [
        { icon: IC.clip, title: "Expenses with attachments", body: "A photo or PDF on every expense and bill." },
        { icon: IC.bill, title: "Bills and suppliers", body: "Mark a bill paid in full or in part." },
        { icon: IC.people, title: { uk: "Payroll records", lk: "Payroll with EPF, ETF and APIT" }, body: { uk: "Enter pay runs from your payroll software.", lk: "Payslips and the monthly schedules to file." } },
        { icon: IC.car, title: "Mileage", body: "A mileage log at the simplified rates.", only: "uk" },
      ],
    },
    {
      key: "keep",
      name: "Yours to keep",
      href: ROUTES.yoursToKeep.href,
      items: [
        { icon: IC.safe, title: "Tax estimate", body: { uk: "Income Tax and Class 4 NI, with payments on account.", lk: "Income tax on profit, with quarterly instalments." } },
        { icon: IC.calendar, title: { uk: "MTD quarters", lk: "VAT and SSCL periods" }, body: { uk: "Totals by HMRC category, checked before they go.", lk: "Summaries in the order of the IRD return." } },
        { icon: IC.house, title: "Landlord mode", body: "Properties, shares and mortgage interest kept apart.", only: "uk" },
        { icon: IC.send, title: "Year-end to TaxWise.lk", body: "Profit, allowances, VAT and payroll totals sent into the return.", only: "lk" },
        { icon: IC.chart, title: "Reports", body: "Profit and loss, balance sheet, who owes what." },
      ],
    },
  ],
  shared: [
    { icon: IC.chat, title: "Ask", body: { uk: "Plain answers with sources from gov.uk and HMRC. When it needs judgement, check with your accountant.", lk: "Plain answers with sources from the IRD and EPF rules. When it needs judgement, check with your practitioner." } },
    { icon: IC.person, title: { uk: "Your accountant, same books", lk: "Your practitioner, same books" }, body: { uk: "They see every quarter, send requests and file for you.", lk: "They see every period, send requests and get the year-end hand-off." } },
    { icon: IC.shield, title: "Your books, kept safe", body: "An append-only ledger: nothing is edited in place, corrections are recorded, and filed periods are locked." },
  ],
};

/* ─── Who it's for ────────────────────────────────────────────────────── */

export type WhoCard = { href: string; label: Copy; hint: Copy; body: Copy; cta: Copy; chip: string; tint: string; art: string };

const ART = {
  desk: "M30 74 V38 h66 v36 M18 80 h90 M60 74 v6 M126 62 h20 v14 a7 7 0 0 1 -7 7 h-6 a7 7 0 0 1 -7 -7 z M146 66 h4 a4 4 0 0 1 0 8 h-4 M42 50 h28 M42 60 h40",
  house: "M22 52 L60 24 L98 52 M30 46 V84 H90 V46 M52 84 V64 H68 V84 M38 54 h10 v10 h-10 z M72 54 h10 v10 h-10 z",
  shop: "M20 44 h90 l-8 -18 h-74 z M28 44 v40 h74 v-40 M56 84 v-24 h18 v24 M34 52 h14 v12 h-14 z M82 52 h14 v12 h-14 z",
  people: "M30 46 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 M20 86 a21 21 0 0 1 42 0 M70 42 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 M60 86 a21 21 0 0 1 42 0",
  globe: "M36 56 a28 28 0 1 0 56 0 a28 28 0 1 0 -56 0 M36 56 h56 M64 28 c13 9 13 47 0 56 c-13 -9 -13 -47 0 -56 M40 42 h48 M40 70 h48",
};

export const WHO = {
  title: "Made for the way you work",
  lead: {
    uk: "Tell BillingEase whether you’re a sole trader, a landlord or both. It shows what you need and keeps the rest out of the way.",
    lk: "Tell BillingEase your business type, whether you’re VAT registered and whether you employ people. It shows what you need and keeps the rest out of the way.",
  } satisfies Copy,
  cards: {
    uk: [
      { href: ROUTES.soleTraders.href, label: "Sole traders", hint: "Ready for Making Tax Digital", body: "Invoices, expenses in HMRC’s categories and every MTD quarter ready for your accountant.", cta: "For sole traders", chip: "Q2 ready", tint: "#EEE8FF", art: ART.desk },
      { href: ROUTES.landlords.href, label: "Landlords", hint: "One flat or several", body: "Rent and costs per property, ownership shares, and mortgage interest kept apart.", cta: "For landlords", chip: "Flat 2: £800", tint: "#FDE6D6", art: ART.house },
      { href: ROUTES.smallBusinesses.href, label: "Small businesses", hint: "With VAT or staff", body: "VAT invoices, a VAT summary each quarter, and payroll records from your payroll software.", cta: "For small businesses", chip: "VAT invoice sent", tint: "#E2F6D5", art: ART.shop },
      { href: ROUTES.accountants.href, label: "Accountants", hint: "Practices and bookkeepers", body: "Every client’s quarter in one place, requests that clear themselves, and a lock once filed.", cta: "For accountants", chip: "Quarter locked", tint: "#FFF0B8", art: ART.people },
    ],
    lk: [
      { href: ROUTES.smallBusinesses.href, label: "Small businesses", hint: "Partnerships and companies", body: "Tax Invoices with VAT and SSCL, payroll with EPF, ETF and APIT, and books your practitioner can trust.", cta: "For small businesses", chip: "Tax Invoice sent", tint: "#EEE8FF", art: ART.shop },
      { href: ROUTES.soleTraders.href, label: "Sole proprietors", hint: "Freelancers and one-person businesses", body: "Invoices, expenses and an income tax estimate, with the year handed to TaxWise.lk.", cta: "For sole proprietors", chip: "Rs 48,000 paid", tint: "#FDE6D6", art: ART.desk },
      { href: ROUTES.accountants.href, label: "Tax practitioners", hint: "Firms using TaxWise.lk", body: "Each client’s VAT, SSCL and payroll position every month, and the year straight into the return.", cta: "For practitioners", chip: "Year sent", tint: "#E2F6D5", art: ART.people },
      { href: ROUTES.countries.href, label: "UK and Sri Lanka", hint: "One product, two countries", body: "Rupees, the year of assessment and Sri Lankan rules, chosen when you sign up.", cta: "What changes by country", chip: "Rs and £", tint: "#FFF0B8", art: ART.globe },
    ],
  } satisfies ByCountry<WhoCard[]>,
};

/* ─── Pricing teaser ──────────────────────────────────────────────────── */

export const PRICING_TEASER = {
  title: "Pricing",
  lead: { uk: "Start free and stay free as long as it fits. Prices in pounds.", lk: "Start free and stay free as long as it fits. Prices in rupees." } satisfies Copy,
  compare: { title: "Compare plans", body: "Every feature side by side, what practices pay, and what happens when you change plan.", cta: "See full pricing", href: ROUTES.pricing.href },
};

/* ─── FAQ ─────────────────────────────────────────────────────────────── */

export const HOME_FAQ: ByCountry<{ q: string; a: string }[]> = {
  uk: [
    { q: "Do I need to know accounting?", a: "No. You work with three numbers and plain words. Proper double-entry books are kept underneath, in HMRC’s categories, for your accountant (or for you) whenever you want to look." },
    { q: "Does it connect to my bank?", a: "No. You add income and expenses yourself, with a photo or PDF attached when you have one. Most sole traders and landlords have a handful of entries a week, and it keeps the books exactly as you meant them." },
    { q: "Will BillingEase file my MTD updates to HMRC?", a: "No. BillingEase keeps your records in HMRC’s categories and gets each quarter ready. Your accountant files the update from their practice software, and the quarter is locked once it’s filed." },
    { q: "Does it run payroll?", a: "In the UK, BillingEase keeps payroll records: you enter each pay run from your payroll software and the costs land in your books. Run payroll and report to HMRC through your payroll software." },
    { q: "Is the free plan really free?", a: "Yes, with no time limit and no card needed. Prices for the paid plans are still being finalised; anything on the free plan stays free." },
  ],
  lk: [
    { q: "Do I need to know accounting?", a: "No. You work with three numbers and plain words. Proper double-entry books are kept underneath for your practitioner (or for you) whenever you want to look." },
    { q: "Does it make Tax Invoices with VAT and SSCL?", a: "Yes. When you’re registered, invoices are titled Tax Invoice with your TIN and VAT number, VAT at 18% and SSCL at 2.5% on its own line. Rates are checked against ird.gov.lk before launch." },
    { q: "Will BillingEase file my VAT or payroll returns?", a: "No. You get VAT and SSCL summaries in the order of the return, and EPF, ETF and APIT schedules. You or your practitioner file them through the IRD, EPF and ETF channels." },
    { q: "Does it connect to my bank?", a: "No. You record payments yourself: bank transfer, cheque (with its number and bank), cash or LankaQR. Expenses and bills take a photo or PDF." },
    { q: "Is the free plan really free?", a: "Yes, with no time limit and no card needed. Prices for the paid plans are still being finalised; anything on the free plan stays free." },
  ],
};

export const CLOSING = {
  kicker: (name: string, year: string) => `${name} this ${year}`,
  title: (keep: string) => `${keep} is yours to keep. What’s yours?`,
  cta: "See your three numbers",
  signIn: "I already have an account",
};
