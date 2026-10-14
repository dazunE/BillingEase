/**
 * Copy for /for/small-businesses (prototype SiteTeams, reworked): businesses
 * with staff. Sri Lanka: full payroll with EPF, ETF, APIT and payslips, and
 * people and access (owner, practitioner, office admin). UK: payroll records
 * entered from your payroll software, VAT invoices and your accountant.
 * Every person, business and figure is invented and illustrative.
 */
import type { ByCountry } from "./country";
import { HOME_ICONS as IC } from "./home";
import { ROUTES } from "./routes";

export const SMALL_META = {
  title: "For small businesses",
  description:
    "Invoices with the tax done right, bills and suppliers, and payroll: full EPF, ETF, APIT and payslips in Sri Lanka, payroll records from your payroll software in the UK. Everyone sees what their job needs.",
};

/** Above this many people signing in, a business talks to sales (decision kept from the prototype's Team plan). */
export const TEAM_LIMIT = 10;

type Cell = "yes" | "no" | string;
export type RoleCol = { key: string; label: string; hint: string; desc: string; who: string };
export type PermRow = { label: string; sub: string; cells: Cell[] };

type Feature = { icon: string; tint: "violet" | "orange" | "dark" | "green" | "yellow" | "grey"; title: string; tag: string; body: string; link?: { label: string; href: string } };

export type SmallPage = {
  chip: string;
  hero: { title: string; lead: string; link: { label: string; href: string } };
  scene: { docTitle: string; docSub: string; rows: [string, string][]; total: string; stamp: string; people: [string, string, string, string]; note: string; hand: string };
  meet: { title: string; story: string; byline: string; first: string; caption: string };
  roles: { kicker: string; title: string; lead: string; cols: RoleCol[]; rows: PermRow[]; note: string };
  features: { title: string; lead: string; items: Feature[] };
  payroll: { kicker: string; title: string; lead: string; banner: string };
  invoice: { kicker: string; title: string; lead: string; points: [string, string][]; doc: { kind: string; from: string; ids: string; to: string; rows: [string, string][]; total: string; foot: string } };
  quotes: { title: string; main: { text: string; name: string; role: string }; side: { text: string; name: string; role: string }[] };
  plan: { title: string; why: string; rows: { name: string; line: string; value: string }[] };
  faqIntro: string;
  faq: { q: string; a: string }[];
  close: { title: string };
};

const UK: SmallPage = {
  chip: "Small businesses",
  hero: {
    title: "One set of books. Payroll in its place.",
    lead: "VAT invoices, bills and suppliers, a VAT summary each quarter, and payroll records entered from your payroll software so staff costs land in the books. Your accountant sees all of it and files.",
    link: { label: "How Going out works", href: ROUTES.goingOut.href },
  },
  scene: {
    docTitle: "PAY RUN · 25 OCT",
    docSub: "From payroll software",
    rows: [
      ["Gross pay", "£1,120"],
      ["PAYE and NI", "−£20"],
      ["Employer pension", "£34"],
    ],
    total: "£1,154",
    stamp: "RECORDED",
    people: ["Owner", "Accountant", "Electrician", "Apprentice"],
    note: "Pay run entered · staff costs £1,154",
    hand: "costs in the books",
  },
  meet: {
    title: "Meet Dan. He wires shops, not spreadsheets.",
    story:
      "Dan Brook runs Aire Valley Electrical in Bradford: rewires, shop fit-outs and the odd emergency call. He’s VAT registered, pays an apprentice through a payroll app and has an accountant who files his VAT and MTD updates. This is his tax year so far.",
    byline: "Dan Brook · Aire Valley Electrical · Bradford",
    first: "Dan",
    caption: "Aire Valley Electrical · this tax year so far",
  },
  roles: {
    kicker: "People and access",
    title: "You and your accountant. Each in your lane.",
    lead: "In the UK, the people who sign in are you and your accountant. Staff are in your payroll records; they don’t need a login. Pick a role to see what it can do.",
    cols: [
      { key: "owner", label: "Owner", hint: "Everything", desc: "Everything, including settings and closing the account.", who: "Dan Brook, Aire Valley Electrical" },
      { key: "acct", label: "Accountant", hint: "Books, quarters, reports", desc: "Sees every entry, fixes categories and sends your quarterly and VAT updates from their own software. Can’t send invoices or change settings.", who: "His accountant, invited by email" },
    ],
    rows: [
      { label: "Send quotes and invoices", sub: "And record payments by hand", cells: ["yes", "no"] },
      { label: "Enter expenses, bills and mileage", sub: "With photos or PDFs attached", cells: ["yes", "Fix only"] },
      { label: "Change categories and add journal entries", sub: "Moving amounts between categories by hand", cells: ["yes", "yes"] },
      { label: "Send your quarterly updates", sub: "From their own software", cells: ["Ask them", "yes"] },
      { label: "See payroll records", sub: "Pay runs entered from payroll software", cells: ["yes", "yes"] },
      { label: "Download reports", sub: "Profit and loss, quarters, VAT", cells: ["yes", "yes"] },
      { label: "Change the business profile", sub: "Name, UTR, VAT number, invoice branding", cells: ["yes", "no"] },
      { label: "Invite and remove people", sub: "From Settings", cells: ["yes", "no"] },
    ],
    note: "Access is set by role, so there’s nothing to configure. Only the owner changes settings.",
  },
  features: {
    title: "Built for more than one pair of hands.",
    lead: "The same calm three numbers, with what a business with staff and VAT needs underneath.",
    items: [
      { icon: IC.doc, tint: "violet", title: "VAT invoices", tag: "Coming in", body: "When you’re VAT registered, invoices carry your VAT number and VAT at 20%, 5%, 0% or exempt, line by line.", link: { label: "How Coming in works", href: ROUTES.comingIn.href } },
      { icon: IC.chart, tint: "dark", title: "A VAT summary each quarter", tag: "Yours to keep", body: "Output VAT from invoices, input VAT from bills, net to pay, for your accountant to file through their MTD VAT software.", link: { label: "How Yours to keep works", href: ROUTES.yoursToKeep.href } },
      { icon: IC.people, tint: "orange", title: "Payroll records", tag: "Going out", body: "Enter each pay run from your payroll software. Staff costs and what you owe HMRC land in the books, with the 22nd as a reminder.", link: { label: "How Going out works", href: ROUTES.goingOut.href } },
      { icon: IC.bill, tint: "orange", title: "Bills and suppliers", tag: "Paid in full or in part", body: "The wholesaler’s bill with its due date, paid half now and half later, with the PDF attached.", link: { label: "See bills", href: ROUTES.goingOut.href } },
      { icon: IC.car, tint: "yellow", title: "Mileage", tag: "Simplified rates", body: "Log business miles in the van or car and BillingEase adds them at the simplified rate per mile.", link: { label: "See mileage", href: ROUTES.goingOut.href } },
      { icon: IC.person, tint: "green", title: "Your accountant, inside", tag: "Free seat", body: "They see the same books, fix categories and send your updates. No more emailed spreadsheets.", link: { label: "For accountants", href: ROUTES.accountants.href } },
    ],
  },
  payroll: {
    kicker: "Payroll records",
    title: "Run payroll where you do now. See it in your books.",
    lead: "Copy each pay run’s totals from your payroll software’s summary. BillingEase posts staff costs to Going out and what you owe HMRC to the books, so your three numbers include your people.",
    banner: "Run payroll and report to HMRC through your payroll software. BillingEase keeps the records.",
  },
  invoice: {
    kicker: "VAT invoices",
    title: "VAT on the invoice, and in the summary.",
    lead: "Once you’re VAT registered, every invoice shows your VAT number and the VAT on each line. Every bill you enter counts its input VAT. Each VAT quarter, the summary is ready for your accountant.",
    points: [
      ["Rates per line.", "20%, 5%, 0% or exempt, so mixed work is easy."],
      ["Input VAT from bills.", "Counted as you enter them, with the PDF attached."],
      ["Filed by your accountant.", "From their MTD VAT software. BillingEase doesn’t file."],
    ],
    doc: {
      kind: "VAT INVOICE · INV-0318",
      from: "Aire Valley Electrical, Bradford",
      ids: "VAT reg. no. GB 000 0000 00 (sample)",
      to: "Ochre Café, Leeds",
      rows: [
        ["Rewire, ground floor", "£1,680.00"],
        ["Consumer unit", "£480.00"],
        ["VAT at 20%", "£432.00"],
      ],
      total: "£2,592.00",
      foot: "Paid on the card machine · recorded 18 Oct",
    },
  },
  quotes: {
    title: "From people who run a business with staff",
    main: { text: "Payroll stays in the payroll app. I type in the totals once a month and my numbers finally include what the apprentice actually costs.", name: "Dan Brook", role: "Aire Valley Electrical, Bradford" },
    side: [
      { text: "The VAT summary is ready before my accountant asks. That’s the whole point.", name: "Joanne Pike", role: "Café owner, Halifax" },
      { text: "Bills paid half now, half later, and it still adds up.", name: "Marcus Hall", role: "Builder, Wakefield" },
    ],
  },
  plan: {
    title: "Businesses with staff pick MTD ready.",
    why: "Free covers invoices, expenses and your three numbers. MTD ready adds VAT invoices, quarters with readiness checks, mileage and repeating invoices. Payroll records are included.",
    rows: [
      { name: "Payroll records", line: "For everyone your payroll software pays. No per-person fee.", value: "Included" },
      { name: "Your accountant", line: "They sign in free and never count.", value: "Free" },
    ],
  },
  faqIntro: "What owners ask before they move the business over.",
  faq: [
    { q: "Does BillingEase run payroll in the UK?", a: "No. Run payroll and report to HMRC (RTI) through your payroll software as you do now. BillingEase keeps a record of each pay run so staff costs and what you owe HMRC are in your books." },
    { q: "Can my office manager sign in?", a: "In the UK the people who sign in are you and your accountant. Office admin access is available for Sri Lankan businesses today." },
    { q: "Does it file my VAT return?", a: "No. BillingEase prepares a VAT summary each VAT quarter. Your accountant files it through their MTD VAT software." },
    { q: "Can I run more than one business?", a: "Each account keeps the books for one business. For a second business, sign up separately." },
    { q: "Does it connect to my bank or card machine?", a: "No. You record payments yourself, including card machine takings, against each invoice." },
    { q: `We’re bigger than ${TEAM_LIMIT} people. Is it for us?`, a: "Talk to us first. Write to hello@billingease.app and we’ll tell you honestly whether it fits." },
  ],
  close: { title: "Your people in the numbers. The filing with your accountant." },
};

const LK: SmallPage = {
  chip: "Small businesses",
  hero: {
    title: "One set of books. Everyone in their lane.",
    lead: "Tax Invoices with VAT and SSCL, payroll with EPF, ETF, APIT and payslips, and the schedules to pay and file each month. You, your practitioner and your office admin each see what your job needs.",
    link: { label: "How payroll works", href: ROUTES.goingOut.href },
  },
  scene: {
    docTitle: "PAY RUN · 25 OCT",
    docSub: "5 people",
    rows: [
      ["Gross pay", "Rs 640,000"],
      ["EPF 8%", "−Rs 51,200"],
      ["EPF 12%, ETF 3%", "Rs 96,000"],
    ],
    total: "Rs 736,000",
    stamp: "APPROVED",
    people: ["Owner", "Office admin", "Practitioner", "Designer"],
    note: "Payslips ready · 5 people",
    hand: "Ayesha said yes",
  },
  meet: {
    title: "Meet Ayesha. She runs a design studio of five.",
    story:
      "Ayesha Fernando runs Serendib Design Studio in Colombo 03: packaging, brand work and websites for hotels and exporters. Five people are paid on the 25th, Dilani in the office enters the bills and cheques, and Ruwan at Jayasinghe & Co prepares the VAT and SSCL figures. This is her year of assessment so far.",
    byline: "Ayesha Fernando · Serendib Design Studio · Colombo 03",
    first: "Ayesha",
    caption: "Serendib Design Studio · this year of assessment so far",
  },
  roles: {
    kicker: "People and access",
    title: "Everyone sees what their job needs. Nothing more.",
    lead: "Three roles cover a small business: you, your practitioner and an office admin for day-to-day entries. Pick one to see what it can do at Serendib Design Studio.",
    cols: [
      { key: "owner", label: "Owner", hint: "Everything", desc: "Everything, including payroll, settings and closing the account.", who: "Ayesha Fernando" },
      { key: "acct", label: "Practitioner", hint: "Books, VAT, payroll checks", desc: "Sees every entry, fixes categories and prepares your VAT, SSCL and income tax figures in TaxWise.lk. Can’t send invoices or change settings.", who: "Ruwan, Jayasinghe & Co" },
      { key: "admin", label: "Office admin", hint: "Day-to-day entries", desc: "Enters expenses and bills, records payments and cheques, and sends invoices. Can’t see salaries or change settings.", who: "Dilani, office manager" },
    ],
    rows: [
      { label: "Send quotes and Tax Invoices", sub: "And record payments: transfer, cheque, cash, LankaQR", cells: ["yes", "no", "yes"] },
      { label: "Enter expenses and bills", sub: "With photos or PDFs attached", cells: ["yes", "Fix only", "yes"] },
      { label: "Run payroll and payslips", sub: "EPF, ETF and APIT", cells: ["yes", "View and check", "no"] },
      { label: "See salaries", sub: "Pay runs and payslips", cells: ["yes", "yes", "no"] },
      { label: "Change categories and add journal entries", sub: "Moving amounts between categories by hand", cells: ["yes", "yes", "no"] },
      { label: "Prepare VAT and SSCL figures", sub: "For the return", cells: ["See them", "yes", "no"] },
      { label: "Download reports", sub: "Profit and loss, VAT and SSCL, payroll", cells: ["yes", "yes", "no"] },
      { label: "Change the business profile", sub: "Name, TIN, VAT number, invoice branding", cells: ["yes", "no", "no"] },
      { label: "Invite and remove people", sub: "From Settings", cells: ["yes", "no", "no"] },
    ],
    note: `Up to ${TEAM_LIMIT} people can sign in to one business; your practitioner doesn’t count. Access is set by role, so there’s nothing to configure.`,
  },
  features: {
    title: "Built for more than one pair of hands.",
    lead: "The same calm three numbers, with what a business with staff, VAT and SSCL needs underneath.",
    items: [
      { icon: IC.doc, tint: "violet", title: "Tax Invoices", tag: "Coming in", body: "Titled “Tax Invoice”, with your TIN and VAT number, VAT at 18% and SSCL at 2.5% on its own line, in the revised IRD layout.", link: { label: "How Coming in works", href: ROUTES.comingIn.href } },
      { icon: IC.chart, tint: "dark", title: "VAT and SSCL summaries", tag: "Each period", body: "Output tax, input tax from your bills and net payable, laid out in the order of the IRD return for you or your practitioner to enter.", link: { label: "How Yours to keep works", href: ROUTES.yoursToKeep.href } },
      { icon: IC.people, tint: "orange", title: "Payroll, worked out", tag: "EPF, ETF, APIT", body: "A monthly pay run with EPF 8% and 12%, ETF 3% and APIT from the current tables. Approving it posts everything to the books.", link: { label: "How Going out works", href: ROUTES.goingOut.href } },
      { icon: IC.doc, tint: "orange", title: "Payslips and schedules", tag: "To pay and file yourself", body: "PDF payslips to email or download, plus EPF and ETF schedules, the APIT schedule and the bank salary transfer list.", link: { label: "See payroll", href: ROUTES.goingOut.href } },
      { icon: IC.bell, tint: "violet", title: "Reminders that get answered", tag: "Email and WhatsApp", body: "Polite reminders to customers by email or WhatsApp, and payment dates for EPF, ETF and APIT on your Home.", link: { label: "See reminders", href: ROUTES.comingIn.href } },
      { icon: IC.person, tint: "green", title: "Your practitioner, inside", tag: "Free seat", body: "They see the same books, send requests and get the year-end figures straight into TaxWise.lk.", link: { label: "For tax practitioners", href: ROUTES.accountants.href } },
    ],
  },
  payroll: {
    kicker: "Payroll, worked out",
    title: "Payroll in minutes. Payslips ready.",
    lead: "Enter each person’s salary once. Every month BillingEase works out EPF, ETF and APIT, makes the payslips and the schedules, and posts it all to your books when you approve. Try one person.",
    banner: "BillingEase calculates payroll. Pay EPF, ETF and APIT and file returns through the EPF, ETF and IRD channels.",
  },
  invoice: {
    kicker: "Tax Invoices",
    title: "VAT and SSCL on their own lines.",
    lead: "Registered businesses issue Tax Invoices in the revised IRD layout. SSCL is a separate levy, so it has its own line and its own summary. Every bill you enter counts its input VAT.",
    points: [
      ["TIN and VAT number on every invoice.", "From your business profile."],
      ["SSCL as its own line.", "And its own period summary, with no input credit."],
      ["Ready for the return.", "Summaries in the order of the IRD return. No RAMIS connection yet."],
    ],
    doc: {
      kind: "TAX INVOICE · TI-0187",
      from: "Serendib Design Studio, Colombo 03",
      ids: "TIN 000000000 · VAT 000000000-7000 (sample)",
      to: "Kandyan Spice Co, Kandy",
      rows: [
        ["Packaging design", "Rs 250,000.00"],
        ["SSCL 2.5%", "Rs 6,250.00"],
        ["VAT 18%", "Rs 46,125.00"],
      ],
      total: "Rs 302,375.00",
      foot: "Layout from the spec; how SSCL sits in the VAT base is confirmed before launch",
    },
  },
  quotes: {
    title: "From people who run a team",
    main: { text: "Payroll used to take me a Saturday with a calculator. Now I check five payslips, say yes, and the EPF and ETF schedules are waiting for me.", name: "Ayesha Fernando", role: "Serendib Design Studio, Colombo 03" },
    side: [
      { text: "Dilani enters the cheques and bills. She never sees salaries, and I never chase her for receipts.", name: "Roshan de Mel", role: "Printing business, Negombo" },
      { text: "My practitioner sees the VAT and SSCL figures every month instead of a box in March.", name: "Shirani Wijesekera", role: "Guest house, Ella" },
    ],
  },
  plan: {
    title: "Businesses with staff pick Business.",
    why: "Business has Tax Invoices with VAT and SSCL, payroll with EPF, ETF, APIT and payslips, WhatsApp reminders and the year-end hand-off to TaxWise.lk.",
    rows: [
      { name: "People who sign in", line: `Up to ${TEAM_LIMIT}: you, office admins and others. Your practitioner never counts.`, value: `Up to ${TEAM_LIMIT}` },
      { name: "Payroll", line: "Pay runs, payslips and schedules for everyone you pay.", value: "Included" },
    ],
  },
  faqIntro: "What owners ask before they invite the rest of the office.",
  faq: [
    { q: "Does BillingEase pay EPF, ETF and APIT for me?", a: "No. It works them out and gives you the schedules and the bank salary transfer list. You pay and file through the EPF, ETF and IRD channels as you do now." },
    { q: "Which APIT tables does it use?", a: "The current tables, held as dated data so a Budget change is an update, not a new version. Your practitioner can check every payslip." },
    { q: "What can my office admin see?", a: "Invoices, bills, expenses and payments. Not salaries, payroll or settings." },
    { q: `How many people can sign in?`, a: `Up to ${TEAM_LIMIT} on one business, and your practitioner never counts. More than ${TEAM_LIMIT}? Talk to us and we’ll set you up.` },
    { q: "Does it file VAT and SSCL with the IRD?", a: "No. It prepares the period summaries in the order of the return. You or your practitioner file. There’s no RAMIS connection yet." },
    { q: "Can I run more than one business?", a: "Each account keeps the books for one business. For a second business, sign up separately." },
  ],
  close: { title: "Give everyone a lane. Keep the final say." },
};

export const SMALL: ByCountry<SmallPage> = { uk: UK, lk: LK };

/** UK pay run example for the records demo (illustrative, typed in from payroll software). */
export const UK_PAYRUN = { gross: 1120, paye: 14, eeNi: 6, erNi: 0, erPension: 34, eePension: 22 };
/** Sri Lanka payslip example (spec section 5): monthly salary Rs 200,000. */
export const LK_PAYSLIP = { basic: 200000, allowance: 0 };
export const LK_RATES = { epfEe: 0.08, epfEr: 0.12, etf: 0.03 };
