/**
 * Copy for /accountants (prototype SitePartners, reworked): UK practices on
 * the TaxWise practice workbench, and Sri Lankan tax practitioners on
 * TaxWise.lk. Prices come from ./plans.ts. Practices, clients and figures are
 * invented. Anything marked `next: true` is coming in the next phase.
 */
import type { ByCountry } from "./country";
import { HOME_ICONS as IC } from "./home";
import type { PracticeSceneText } from "@/components/site/illustrations/audience/PracticeScene";

export const ACCT_META = {
  title: "For accountants and tax practitioners",
  description:
    "Clients keep their records in BillingEase; you see the same books from the TaxWise practice workbench (UK) or TaxWise.lk (Sri Lanka), send requests, and file from your own software. Priced per client.",
};

export type GetItem = { icon: string; title: string; body: string; next?: boolean; preview: { head: string; rows: [string, string, ("pos" | "due" | "info" | "grey" | "violet")?][]; foot: string } };

export type AcctPage = {
  chip: string;
  hero: { title: string; lead: string; note: string };
  scene: PracticeSceneText;
  clients: { kicker: string; title: string; lead: string; items: { icon: string; tint: "violet" | "orange" | "green" | "yellow"; title: string; body: string }[] };
  get: { kicker: string; title: string; items: GetItem[] };
  how: { kicker: string; title: string; lead: string; steps: { title: string; body: string; next?: boolean }[] };
  quote: { text: string; name: string; role: string };
  next: { title: string; lead: string; items: { title: string; body: string }[] };
  pricing: { title: string; why: string; rows: { name: string; line: string; value: string }[] };
  talk: { title: string; body: string };
  faq: { q: string; a: string }[];
  close: { title: string; lead: string };
};

const UK: AcctPage = {
  chip: "Accountants",
  hero: {
    title: "Your clients’ records, sorted before you open them.",
    lead: "Sole traders and landlords keep their records in BillingEase, in HMRC’s categories, with every quarter checked for gaps. You see the same books from the TaxWise practice workbench and file their Making Tax Digital updates from your own software.",
    note: "Priced per client. Clients can start free.",
  },
  scene: {
    practice: "Dale & Shaw · sample practice",
    title: "Your clients · Q2",
    badge: "Preview · next phase",
    rows: [
      { initials: "HS", name: "Harper Studio", sub: "Sole trader · Leeds", status: "Q2 ready", tone: "pos" },
      { initials: "PL", name: "Pickering Lets", sub: "Landlord · York", status: "Request open", tone: "violet" },
      { initials: "AV", name: "Aire Valley Electrical", sub: "Sole trader, VAT · Bradford", status: "2 to sort", tone: "due" },
      { initials: "ML", name: "Moss Lane Florist", sub: "Sole trader · Otley", status: "Due 7 Nov", tone: "info" },
      { initials: "CJ", name: "Calder Joinery", sub: "Invited 10 Oct", status: "Waiting to join", tone: "grey" },
    ],
    tiles: [
      ["Ready to file", "1", "grey"],
      ["Need the client", "2", "due"],
      ["Due 7 Nov", "4", "info"],
    ],
  },
  clients: {
    kicker: "What your clients get",
    title: "Clients who stop sending you shoeboxes.",
    lead: "They see three numbers they understand. Underneath, BillingEase keeps the records the way you’d keep them.",
    items: [
      { icon: IC.safe, tint: "violet", title: "Three numbers, every morning", body: "Coming in, going out and theirs to keep, after an Income Tax and NI estimate. They finally know where they stand." },
      { icon: IC.clip, tint: "orange", title: "Expenses in HMRC’s words", body: "Plain names on screen, the HMRC category underneath, a photo or PDF attached, business-use shares and mileage." },
      { icon: IC.calendar, tint: "green", title: "Quarters, checked", body: "Each MTD quarter shows gaps and uncategorised entries while the client can still fix them." },
      { icon: IC.chat, tint: "yellow", title: "Your requests on their Home", body: "“Please add records for 12–25 September” sits at the top of their Home and clears when they’ve done it." },
    ],
  },
  get: {
    kicker: "What you get",
    title: "Everything a practice needs, nothing the client has to learn.",
    items: [
      { icon: IC.doc, title: "The same books as the client", body: "Every entry, with its attachment, and totals by HMRC category for each quarter.", preview: { head: "Harper Studio · Q2 by HMRC category", rows: [["Turnover", "£11,840"], ["Car, van and travel", "£412"], ["Office costs", "£286"], ["Advertising", "£120"]], foot: "Every figure opens to its entries" } },
      { icon: IC.calendar, title: "Quarter status and readiness", body: "Which clients are ready, which have gaps, and what’s due when.", preview: { head: "Q2 · due 7 Nov", rows: [["Harper Studio", "Ready", "pos"], ["Aire Valley Electrical", "2 to sort", "due"], ["Pickering Lets", "Request open", "violet"]], foot: "Readiness checks run as the client works" } },
      { icon: IC.chat, title: "Requests to the client", body: "Ask for missing records in plain words. It appears on their Home and clears when done.", preview: { head: "New request to Pickering Lets", rows: [["What", "Records for 12–25 September"], ["Shows on", "Tom’s Home, at the top"], ["Clears", "When he’s added them"]], foot: "No more chasing by email" } },
      { icon: IC.chart, title: "Categories and journal entries", body: "Move an amount to the right category or add a journal entry. The client sees it explained in plain words.", preview: { head: "Journal entry · Aire Valley Electrical", rows: [["From", "Office costs"], ["To", "Cost of goods"], ["Amount", "£86.40"]], foot: "Corrections post a reversal; nothing is overwritten" } },
      { icon: IC.shield, title: "Lock a quarter once filed", body: "After you file, lock the quarter so nothing in it changes by accident.", next: true, preview: { head: "Q1 · filed 4 Aug", rows: [["Status", "Locked by Dale & Shaw", "grey"], ["Changes", "Need you to unlock", "grey"]], foot: "Coming in the next phase" } },
      { icon: IC.people, title: "Practice view: every client in one list", body: "All your clients’ quarters in one list, sorted by what needs you.", next: true, preview: { head: "Dale & Shaw · 5 clients", rows: [["Ready to file", "1", "pos"], ["Need the client", "2", "due"], ["Due 7 Nov", "4", "info"]], foot: "Coming in the next phase" } },
    ],
  },
  how: {
    kicker: "Invites and requests",
    title: "How it works with a client.",
    lead: "Either side can start. Your practice name sits on the client’s books once you’re linked.",
    steps: [
      { title: "Invite, either way", body: "Invite a client from the workbench, or the client invites you from Your accountant in their settings, by email." },
      { title: "See the same books", body: "Once linked you see every entry, fix categories and add journal entries. You can’t send invoices in their name or sign in as them." },
      { title: "Ask in plain words", body: "Send a request for missing records. It sits on the client’s Home until they’ve done it, then clears itself." },
      { title: "File from your software", body: "Take each quarter’s totals by HMRC category into the MTD software you already use. BillingEase never files." },
      { title: "Lock what you’ve filed", body: "Mark the quarter filed and lock it.", next: true },
    ],
  },
  quote: { text: "I open one list, see which clients are ready, and spend the week on advice instead of chasing receipts.", name: "Priya Shah", role: "Dale & Shaw, Leeds · invented example" },
  next: {
    title: "Coming in the next phase",
    lead: "We’re building these with our first partner practices. We’ll say here when they ship.",
    items: [
      { title: "Filing locks by the practice", body: "Mark a quarter filed and lock it, so the client can’t change it by accident." },
      { title: "Practice view", body: "Every client’s quarter in one list, sorted by what needs you." },
    ],
  },
  pricing: {
    title: "Priced per client.",
    why: "Your practice pays for the clients you bring on, and each of them gets everything in MTD ready. A client who already has their own plan can invite you at no cost to you.",
    rows: [
      { name: "Each client you bring on", line: "Gets everything in MTD ready, with your practice name on their books.", value: "Per client" },
      { name: "Clients on their own plan", line: "They invite you; your seat is free.", value: "Free for you" },
    ],
  },
  talk: { title: "Talk to our practice team", body: "Tell us about your practice and the software you file from. We’re starting with a few partner practices before the April 2027 wave." },
  faq: [
    { q: "Does BillingEase file MTD updates?", a: "No. You file from your own MTD software. BillingEase keeps the client’s records in HMRC’s categories and checks each quarter. HMRC has paused new MTD for Income Tax software until at least early 2027." },
    { q: "What can I see and do in a client’s books?", a: "Every entry and attachment, quarter totals by HMRC category, and reports. You can change categories, add journal entries and send requests. You can’t send invoices in their name, change their settings or sign in as them." },
    { q: "My client already uses BillingEase. How do I get in?", a: "Ask them to invite you from Your accountant in their settings. Once you accept, they appear in your list." },
    { q: "Who pays for the client’s plan?", a: "Either. You can bring clients on at the per-client price, or a client on their own plan can invite you at no cost to you." },
    { q: "Do clients connect their bank?", a: "No. Clients record payments and expenses by hand, with photos or PDFs attached. There are no bank feeds." },
    { q: "Where is client data kept, and how?", a: "Each business’s data is kept apart, and the ledger is append-only: corrections post a reversal. Hosting region is being confirmed; see our data processing terms." },
  ],
  close: { title: "Bring your first clients on.", lead: "Talk to us about the TaxWise practice workbench, per-client pricing and the April 2027 wave." },
};

const LK: AcctPage = {
  chip: "Tax practitioners",
  hero: {
    title: "Your clients’ books, ready for the return.",
    lead: "Small businesses keep their books, Tax Invoices and payroll in BillingEase. You see their monthly VAT and SSCL position and payroll schedules from the TaxWise.lk practitioner tool, and at year end the figures go straight into their income tax return.",
    note: "Priced per client. Clients can start free.",
  },
  scene: {
    practice: "Jayasinghe & Co · sample firm",
    title: "Your clients · September",
    badge: "Preview · next phase",
    rows: [
      { initials: "SD", name: "Serendib Design Studio", sub: "VAT and SSCL · Colombo 03", status: "Sep ready", tone: "pos" },
      { initials: "KH", name: "Kandy Hill Bakery", sub: "Payroll · Kandy", status: "Payroll checked", tone: "pos" },
      { initials: "GF", name: "Galle Fort Boutique Hotel", sub: "VAT and SSCL · Galle", status: "Request open", tone: "violet" },
      { initials: "LA", name: "Lanka Agri Exports", sub: "VAT · Kurunegala", status: "3 to sort", tone: "due" },
      { initials: "NT", name: "Nuwara Tea Rooms", sub: "Invited 9 Oct", status: "Waiting to join", tone: "grey" },
    ],
    tiles: [
      ["Ready", "2", "grey"],
      ["Need the client", "2", "due"],
      ["VAT due 20 Oct", "3", "info"],
    ],
  },
  clients: {
    kicker: "What your clients get",
    title: "Clients who stop bringing you a bag of receipts.",
    lead: "They see three numbers they understand. Underneath, BillingEase keeps the books the way you’d keep them.",
    items: [
      { icon: IC.safe, tint: "violet", title: "Three numbers, every morning", body: "Coming in, going out and theirs to keep, after an income tax estimate. They finally know where they stand." },
      { icon: IC.doc, tint: "orange", title: "Tax Invoices done right", body: "TIN and VAT number, VAT 18% and SSCL 2.5% on its own line, in the revised IRD layout." },
      { icon: IC.people, tint: "green", title: "Payroll with payslips", body: "EPF, ETF and APIT worked out, payslips made, and the monthly schedules ready to pay and file." },
      { icon: IC.chat, tint: "yellow", title: "Your requests on their Home", body: "“Please add September’s bills” sits at the top of their Home and clears when they’ve done it." },
    ],
  },
  get: {
    kicker: "What you get",
    title: "Everything a practitioner needs, nothing the client has to learn.",
    items: [
      { icon: IC.doc, title: "The same books as the client", body: "Every entry with its attachment, year-to-date profit and all their invoices and bills.", preview: { head: "Serendib Design Studio · year to date", rows: [["Business income", "Rs 5,280,000"], ["Expenses", "Rs 2,830,000"], ["Profit", "Rs 2,450,000"]], foot: "Every figure opens to its entries" } },
      { icon: IC.calendar, title: "Monthly VAT and SSCL position", body: "Output tax, input tax from bills and net payable for each period, in the order of the IRD return.", preview: { head: "September · due 20 Oct", rows: [["Output VAT", "Rs 412,600"], ["Input VAT", "Rs 96,300"], ["SSCL", "Rs 57,300"]], foot: "Ready for you to enter on the return" } },
      { icon: IC.people, title: "Payroll and schedules", body: "Each pay run, payslips and the EPF, ETF and APIT schedules, ready for you to check.", preview: { head: "October pay run · 5 people", rows: [["Gross pay", "Rs 640,000"], ["EPF 8% + 12%", "Rs 128,000"], ["ETF 3%", "Rs 19,200"]], foot: "View and check; the owner approves" } },
      { icon: IC.send, title: "Year-end hand-off to TaxWise.lk", body: "Business income, expenses by schedule line, capital items, VAT, SSCL and payroll totals, straight into the client’s return.", preview: { head: "2026/27 · hand-off", rows: [["Business income", "By schedule line"], ["Capital items", "For allowances"], ["Payroll totals", "APIT per employee"]], foot: "After 31 March" } },
      { icon: IC.shield, title: "Lock a period once filed", body: "Lock a VAT and SSCL period after the return is filed, and the year after hand-off.", next: true, preview: { head: "August · filed 18 Sep", rows: [["Status", "Locked by Jayasinghe & Co", "grey"], ["Changes", "Need you to unlock", "grey"]], foot: "Coming in the next phase" } },
      { icon: IC.chart, title: "Practitioner view: every client in one list", body: "All your clients’ periods in one list, sorted by what needs you.", next: true, preview: { head: "Jayasinghe & Co · 5 clients", rows: [["Ready", "2", "pos"], ["Need the client", "2", "due"], ["VAT due 20 Oct", "3", "info"]], foot: "Coming in the next phase" } },
    ],
  },
  how: {
    kicker: "Invites and requests",
    title: "How it works with a client.",
    lead: "Either side can start. Your firm’s name sits on the client’s books once you’re linked.",
    steps: [
      { title: "Invite, either way", body: "Invite a client from TaxWise.lk, or the client invites you from Your accountant in their settings, by email." },
      { title: "See the same books", body: "Once linked you see every entry, check payroll and prepare VAT and SSCL figures. You can’t send invoices in their name or sign in as them." },
      { title: "Ask in plain words", body: "Send a request for missing bills or records. It sits on the client’s Home until they’ve done it, then clears itself." },
      { title: "File, then hand off", body: "Enter the VAT and SSCL summary on the IRD return each period. At year end the figures arrive in the client’s TaxWise.lk return." },
      { title: "Lock what you’ve filed", body: "Lock a period after filing, and the year after hand-off.", next: true },
    ],
  },
  quote: { text: "My clients’ VAT and SSCL figures are ready on the first of the month, and the year arrives in TaxWise.lk without anyone retyping it.", name: "Ruwan Jayasinghe", role: "Jayasinghe & Co, Colombo · invented example" },
  next: {
    title: "Coming in the next phase",
    lead: "We’re building these with our first practitioners. We’ll say here when they ship.",
    items: [
      { title: "Filing locks by the practitioner", body: "Lock a period once the return is filed, and the year after hand-off." },
      { title: "Practitioner view", body: "Every client’s period in one list, sorted by what needs you." },
    ],
  },
  pricing: {
    title: "Priced per client.",
    why: "Your firm pays for the clients you bring on, and each of them gets BillingEase for their books, Tax Invoices and payroll. A client who already has their own plan can invite you at no cost to you.",
    rows: [
      { name: "Each client you bring on", line: "Books, Tax Invoices, VAT and SSCL, and payroll, with your firm’s name on their books.", value: "Per client" },
      { name: "Clients on their own plan", line: "They invite you; your seat is free.", value: "Free for you" },
    ],
  },
  talk: { title: "Talk to our practitioner team", body: "Tell us about your firm and your clients. We’re starting with TaxWise.lk practitioners for the January 2027 launch." },
  faq: [
    { q: "Does BillingEase file with the IRD?", a: "No. It prepares VAT and SSCL summaries in the order of the return and the payroll schedules. You file. There’s no RAMIS connection yet." },
    { q: "What can I see and do in a client’s books?", a: "Every entry and attachment, VAT and SSCL figures, payroll and reports. You can change categories, add journal entries and send requests. You can’t send invoices in their name, change their settings or sign in as them." },
    { q: "How does the year-end hand-off work?", a: "After 31 March, business income, expenses by schedule line, capital items, VAT and SSCL totals and payroll totals go into the client’s TaxWise.lk return, or your file for that client." },
    { q: "Who pays for the client’s plan?", a: "Either. You can bring clients on at the per-client price, or a client on their own plan can invite you at no cost to you." },
    { q: "Do clients connect their bank?", a: "No. Clients record payments by hand: bank transfer, cheque, cash or LankaQR. There are no bank feeds in Sri Lanka." },
    { q: "Where is client data kept, and how?", a: "Each business’s data is kept apart, and the ledger is append-only: corrections post a reversal. The hosting region is being decided under the PDPA; see our data processing terms." },
  ],
  close: { title: "Bring your first clients on.", lead: "Talk to us about TaxWise.lk, per-client pricing and the January 2027 launch." },
};

export const ACCT: ByCountry<AcctPage> = { uk: UK, lk: LK };
