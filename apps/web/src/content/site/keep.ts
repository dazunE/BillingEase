/**
 * Copy for /yours-to-keep (prototype SiteKeep). Country copy is `{ uk, lk }`.
 * Sample businesses are invented; every figure and rate is illustrative.
 */
import type { ByCountry, Copy } from "./country";

export const KEEP_META = {
  title: "Yours to keep",
  description: "Profit after estimated tax, MTD quarters and landlord mode in the UK, VAT and SSCL periods and the TaxWise.lk hand-off in Sri Lanka, with proper double-entry books underneath.",
};

export const KEEP_HERO = {
  kicker: "Yours to keep",
  title: "Know what’s actually yours.",
  lead: {
    uk: "Money in the bank isn’t all yours. Some is owed to suppliers, some to HMRC. BillingEase takes those out first, so the number in the jar is what you can really spend.",
    lk: "Money in the bank isn’t all yours. Some is owed to suppliers, some is VAT and SSCL you collected, some is income tax. BillingEase takes those out first, so the number in the jar is what you can really spend.",
  } satisfies Copy,
  small: "Reports and your tax estimate are on every plan.",
};

export const KEEP_CALC: ByCountry<{ sample: { inc: number; out: number; pct: number }; alt: { inc: number; out: number; pct: number }; max: number; step: number; who: string; alt_who: string; taxLabel: string }> = {
  uk: { sample: { inc: 2840, out: 920, pct: 15 }, alt: { inc: 4200, out: 1100, pct: 20 }, max: 12000, step: 10, who: "Harper Studio, October", alt_who: "a busier month", taxLabel: "Income Tax and NI" },
  lk: { sample: { inc: 528000, out: 283000, pct: 15 }, alt: { inc: 900000, out: 420000, pct: 18 }, max: 2000000, step: 5000, who: "Serendib Design Studio, October", alt_who: "a busier month", taxLabel: "income tax" },
};

export const KEEP_TAX = {
  kicker: "The tax estimate",
  title: { uk: "January stops being a surprise.", lk: "Instalment dates stop being a surprise." } satisfies Copy,
  lead: {
    uk: "Every time you add income or a cost, BillingEase re-estimates your Income Tax and Class 4 NI for the tax year and takes it out of Yours to keep. When a payment is due, you already know the number.",
    lk: "Every time you add income or a cost, BillingEase re-estimates your income tax for the year of assessment and takes it out of Yours to keep. VAT and SSCL you collected never count as yours.",
  } satisfies Copy,
  steps: {
    uk: [
      { n: "1", t: "Profit, as you go", d: "Income minus allowable costs, in HMRC’s categories, for the tax year from 6 April.", v: "So far: £19,220", tint: "bg-tint" },
      { n: "2", t: "Tax estimated on it", d: "Income Tax and Class 4 NI at this year’s rates, landlord finance costs included. It leaves your number, so it never feels like yours.", v: "Estimated: £2,960", tint: "bg-[#FFF6E0]" },
      { n: "3", t: "Ready when it’s due", d: "Payments on account on 31 January and 31 July sit on Home with the amount next to them.", v: "Next: 31 Jan 2027", tint: "bg-pos-bg" },
    ],
    lk: [
      { n: "1", t: "Profit, as you go", d: "Income minus costs, on the lines of the business income schedule, for the year from 1 April.", v: "So far: Rs 2,450,000", tint: "bg-tint" },
      { n: "2", t: "Tax estimated on it", d: "Income tax at this year’s rates and reliefs. VAT and SSCL you collected are kept apart; they were never yours.", v: "Estimated: Rs 410,000", tint: "bg-[#FFF6E0]" },
      { n: "3", t: "Ready when it’s due", d: "Quarterly instalment dates sit on Home with the amount next to them.", v: "Next: 15 Nov 2026", tint: "bg-pos-bg" },
    ],
  },
  dates: {
    uk: { label: "Income Tax payments on Home (illustrative)", items: [["31 Jan 2026", "£1,180", "Paid 28 Jan"], ["31 Jul 2026", "£1,180", "Paid 30 Jul"], ["31 Jan 2027", "£1,780", "Balancing payment and first payment on account"], ["31 Jul 2027", "£1,180", "Second payment on account"]] },
    lk: { label: "Income tax instalments on Home (illustrative)", items: [["15 Aug 2026", "Rs 102,500", "Paid 12 Aug"], ["15 Nov 2026", "Rs 102,500", "Next, on Home"], ["15 Feb 2027", "Rs 102,500", "Third instalment"], ["15 May 2027", "Rs 102,500", "Fourth instalment"]] },
  } satisfies ByCountry<{ label: string; items: [string, string, string][] }>,
  note: { uk: "Who pays on account and how much depends on last year’s bill. Your accountant can set it for you.", lk: "Instalment rules depend on your circumstances. Your practitioner can set them for you." } satisfies Copy,
};

export type Report = { key: string; q: string; formal: string; period: string; answerLabel: string; answer: string; answerSub: string; rows: [string, string | number, number?][] };

export const KEEP_REPORTS: ByCountry<Report[]> = {
  uk: [
    { key: "make", q: "How much did I make?", formal: "Profit and loss", period: "6 April to 5 October 2026", answerLabel: "Profit this tax year so far", answer: "£19,220", answerSub: "Before £2,960 estimated Income Tax and NI", rows: [["Sales", "£28,400"], ["Car, van and travel", "−£1,140"], ["Premises (studio rent)", "−£2,700"], ["Phone, stationery and office costs", "−£1,980"], ["Advertising", "−£520"], ["Other allowable costs", "−£2,840"], ["Profit", "£19,220", 700]] },
    { key: "own", q: "What do I own?", formal: "Balance sheet", period: "as of 5 October 2026", answerLabel: "What the business is worth", answer: "£12,640", answerSub: "What you own minus what you owe", rows: [["Cash in the business account", "£9,860"], ["Customers owe you", "£3,750"], ["Equipment", "£1,400"], ["Bills you owe", "−£860"], ["Estimated tax so far", "−£1,510"]] },
    { key: "owed", q: "Who still owes me?", formal: "Aged receivables", period: "as of 5 October 2026", answerLabel: "Still to come in", answer: "£3,750", answerSub: "One invoice is late", rows: [["Kirkstall Brewing Co", 1850], ["Moor & Dale Outdoor", 1050], ["Ochre Café · 12 days late", 850]] },
  ],
  lk: [
    { key: "make", q: "How much did I make?", formal: "Profit and loss", period: "1 April to 5 October 2026", answerLabel: "Profit this year so far", answer: "Rs 2,450,000", answerSub: "Before Rs 410,000 estimated income tax", rows: [["Sales, excluding VAT and SSCL", "Rs 5,280,000"], ["Salaries, EPF and ETF", "−Rs 1,640,000"], ["Rent", "−Rs 720,000"], ["Printing and stationery", "−Rs 214,000"], ["Other costs", "−Rs 256,000"], ["Profit", "Rs 2,450,000", 700]] },
    { key: "own", q: "What do I own?", formal: "Balance sheet", period: "as of 5 October 2026", answerLabel: "What the business is worth", answer: "Rs 3,120,000", answerSub: "What you own minus what you owe", rows: [["Cash at bank", "Rs 2,380,000"], ["Customers owe you", "Rs 1,420,000"], ["Equipment", "Rs 640,000"], ["VAT and SSCL to pay", "−Rs 312,000"], ["EPF, ETF and APIT to pay", "−Rs 198,000"], ["Bills you owe", "−Rs 810,000"]] },
    { key: "owed", q: "Who still owes me?", formal: "Aged receivables", period: "as of 5 October 2026", answerLabel: "Still to come in", answer: "Rs 1,420,000", answerSub: "Two invoices are late", rows: [["Kandyan Spice Co", 604750], ["Lanka Agri Exports · 18 days late", 302375], ["Galle Fort Boutique Hotel · 9 days late", 186000], ["Ahangama Surf Lodge", 326875]] },
  ],
};

export const KEEP_FILE = {
  kicker: "Ready when they ask",
  title: { uk: "Quarters ready to file. Books that match the bank.", lk: "VAT and SSCL worked out. Books that match the bank." } satisfies Copy,
  lead: "The two jobs most likely to eat a weekend, done as you go and checked before anyone has to look.",
};

export const KEEP_ACCT = {
  kicker: { uk: "Your accountant and the quarter", lk: "Your practitioner and the year" } satisfies Copy,
  title: "Hand over the books, not a shoebox.",
  lead: {
    uk: "Proper double-entry books are kept underneath the three numbers. Your accountant sees the same books, files the update from their own software, and the quarter is locked once it’s filed.",
    lk: "Proper double-entry books are kept underneath the three numbers. Your practitioner sees the same books, files the returns, and gets the year-end figures in TaxWise.lk. Filed periods are locked.",
  } satisfies Copy,
  can: {
    uk: [
      ["Sees every quarter, report and entry", true],
      ["Sends requests that appear on your Home", true],
      ["Files your MTD update from their practice software", true],
      ["Can’t send your invoices or change your password", false],
    ],
    lk: [
      ["Sees every period, report and entry", true],
      ["Sends requests that appear on your Home", true],
      ["Gets the year-end figures in TaxWise.lk", true],
      ["Can’t send your invoices or change your password", false],
    ],
  } satisfies ByCountry<[string, boolean][]>,
  person: { uk: ["PS", "Priya Shah, Dale & Shaw", "Accountant for Harper Studio"], lk: ["RJ", "Ruwan Jayasinghe, Jayasinghe & Co", "Practitioner for Serendib Design Studio"] } satisfies ByCountry<[string, string, string]>,
  lock: {
    uk: { title: "Lock the quarter", sub: "Q2 · 6 July to 5 October 2026", period: "Q2", items: [["sorted", "Every expense has a category", "84 entries, none waiting"], ["bank", "Checked against the bank statement", "Business account matches to the penny"], ["sent", "Summary sent to Dale & Shaw", "Sent 6 Oct"], ["filed", "Update filed by your accountant", "Tick this once Priya has filed"]] },
    lk: { title: "Lock the period", sub: "September 2026 · VAT and SSCL", period: "September", items: [["sorted", "Every bill and invoice entered", "61 entries, none waiting"], ["bank", "Checked against the bank statement", "Current account matches to the rupee"], ["sent", "Summary shared with Jayasinghe & Co", "Shared 8 Oct"], ["filed", "VAT and SSCL return filed", "Tick this once Ruwan has filed"]] },
  } satisfies ByCountry<{ title: string; sub: string; period: string; items: [string, string, string][] }>,
};

export const KEEP_PROOF = {
  uk: { quote: "Last January the money for the tax bill was just there. My accountant said it was the first time a client sent a quarter with nothing to fix.", name: "Ellie Harper", role: "Harper Studio, Leeds (sample business)", jar: "£16,260" },
  lk: { quote: "The VAT and SSCL summary is ready before my practitioner asks. At year end the figures went straight into the return.", name: "Ayesha Fernando", role: "Serendib Design Studio, Colombo 03 (sample business)", jar: "Rs 2,040,000" },
};

export const KEEP_FAQ: ByCountry<{ q: string; a: string }[]> = {
  uk: [
    { q: "How is Yours to keep worked out?", a: "Coming in minus Going out is your profit. BillingEase estimates Income Tax and Class 4 NI on it for the tax year, at the year’s rates, and takes that off. What’s left is Yours to keep. It’s an estimate; your accountant works out the final bill." },
    { q: "Does BillingEase file my MTD updates?", a: "No. It keeps your records in HMRC’s categories and gets each quarter ready with readiness checks. Your accountant files from their practice software, and the quarter is locked once it’s filed." },
    { q: "I’m a landlord. Does it handle property?", a: "Yes, in landlord mode: properties with your ownership share, rent and costs in the property categories, and mortgage interest kept apart for the basic-rate tax credit. The £1,000 property allowance is used when it’s better for you." },
    { q: "What does the VAT summary do?", a: "If you’re VAT registered, it adds up the VAT on your invoices and costs for each VAT quarter. Your accountant files the VAT return from their software." },
    { q: "Can I change something in a filed quarter?", a: "Not by accident. Filed quarters are locked. If something really needs fixing, your accountant posts a correcting entry; nothing is rewritten or deleted." },
  ],
  lk: [
    { q: "How is Yours to keep worked out?", a: "Coming in minus Going out is your profit. BillingEase estimates income tax on it for the year of assessment, at the year’s rates and reliefs, and takes that off. VAT and SSCL you collected are never counted as yours. It’s an estimate; your practitioner confirms the final figure." },
    { q: "Does BillingEase file VAT or SSCL returns?", a: "No. You get a summary for each period laid out in the order of the IRD return, with output VAT, input VAT from your bills, and SSCL. You or your practitioner enter it on the return. A RAMIS connection may come later." },
    { q: "What is the TaxWise.lk hand-off?", a: "At year end, Send to TaxWise.lk moves your business income, expenses by schedule line, capital allowance items, VAT and SSCL totals and payroll totals into your TaxWise.lk return, or your practitioner’s file for you." },
    { q: "Why is SSCL separate from VAT?", a: "SSCL is its own levy with no input credit, so it gets its own line on the invoice and its own summary. Rates are checked against ird.gov.lk before launch." },
    { q: "Can I change something in a filed period?", a: "Not by accident. Filed periods are locked. If something needs fixing, your practitioner posts a correcting entry; nothing is rewritten or deleted." },
  ],
};

export const KEEP_CTA = {
  kicker: "Yours to keep",
  title: "Find out what’s really yours.",
  text: "Add this month’s invoices and costs. The jar fills in with what’s left after tax.",
};
