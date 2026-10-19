/**
 * Copy for /going-out (prototype SiteGoingOut). Country copy is `{ uk, lk }`.
 * Every business, supplier and person is invented; figures are illustrative.
 */
import type { ByCountry, Copy } from "./country";

export const GOING_OUT_META = {
  title: "Going out",
  description: "Expenses and bills you add by hand with the photo or PDF attached, every-month costs, suppliers, and payroll: records from your payroll software in the UK, full EPF, ETF and APIT in Sri Lanka.",
};

export const GO_HERO = {
  kicker: "Going out",
  title: { uk: "Every pound out, in the right box.", lk: "Every rupee out, in the right line." } satisfies Copy,
  lead: {
    uk: "Add an expense in seconds with the photo or PDF attached. Pick the category once, in plain words, and it lands in the right HMRC box for the quarter. Bills, every-month costs and payroll records sit alongside.",
    lk: "Add an expense in seconds with the photo or PDF attached. Pick the category once and it lands on the right line for your return, with input VAT counted on Tax Invoices. Bills, every-month costs and payroll sit alongside.",
  } satisfies Copy,
  small: "Attachments on every plan. Snap a receipt and BillingEase drafts the expense; nothing goes in until you approve it.",
};

export type SampleExpense = { vendor: string; total: number; date: string; cat: string; box: string; inputVat?: number; use?: number };

export const GO_EXPENSES: ByCountry<{ start: number; cats: string[]; list: SampleExpense[] }> = {
  uk: {
    start: 9180,
    cats: ["Car, van and travel", "Office costs", "Premises", "Advertising", "Phone and internet"],
    list: [
      { vendor: "Train ticket, Leeds to Harrogate", total: 23.4, date: "3 Oct", cat: "Car, van and travel", box: "Car, van and travel expenses" },
      { vendor: "Mobile phone bill", total: 36, date: "4 Oct", cat: "Phone and internet", box: "Phone, fax, stationery and other office costs", use: 70 },
      { vendor: "Printer ink and paper", total: 48.6, date: "5 Oct", cat: "Office costs", box: "Phone, fax, stationery and other office costs" },
      { vendor: "Portfolio site hosting", total: 12, date: "6 Oct", cat: "Advertising", box: "Advertising and business entertainment costs" },
    ],
  },
  lk: {
    start: 2830000,
    cats: ["Postage and courier", "Printing", "Travel", "Rent", "Utilities"],
    list: [
      { vendor: "Courier receipt", total: 2450, date: "3 Oct", cat: "Postage and courier", box: "Business income schedule" },
      { vendor: "Printer’s Tax Invoice", total: 54280, date: "4 Oct", cat: "Printing", box: "Business income schedule", inputVat: 8280 },
      { vendor: "Three-wheeler to client, Kollupitiya", total: 850, date: "5 Oct", cat: "Travel", box: "Business income schedule" },
      { vendor: "Electricity bill", total: 18600, date: "6 Oct", cat: "Utilities", box: "Business income schedule" },
    ],
  },
};

export const GO_SORT = {
  kicker: "Categories",
  title: { uk: "HMRC’s boxes, in words you’d use.", lk: "The return’s lines, in words you’d use." } satisfies Copy,
  lead: {
    uk: "Choose “Office costs” and BillingEase files it in the right self-employment or property box underneath. Anything that isn’t allowable is marked, and a phone you also use at home gets a business-use share.",
    lk: "Choose “Printing” and BillingEase puts it on the right line of the business income schedule underneath. Equipment is kept apart as a capital item for allowances, and input VAT on a supplier’s Tax Invoice is counted for the return.",
  } satisfies Copy,
  small: { uk: "Plain names on screen, HMRC’s names underneath for your accountant.", lk: "Plain names on screen, the schedule line underneath for your practitioner." } satisfies Copy,
  rows: {
    uk: [
      { id: "a", n: "Client lunch, Ochre Café", d: "7 Oct", a: 38.5, pick: "" },
      { id: "b", n: "Laptop stand", d: "7 Oct", a: 45, pick: "" },
      { id: "c", n: "Parking, Harrogate", d: "8 Oct", a: 6.8, pick: "" },
      { id: "d", n: "Stock photo licence", d: "8 Oct", a: 29, pick: "" },
    ],
    lk: [
      { id: "a", n: "Client lunch, Galle Face", d: "7 Oct", a: 8400, pick: "" },
      { id: "b", n: "Drawing tablet", d: "7 Oct", a: 96000, pick: "" },
      { id: "c", n: "Fuel for the car", d: "8 Oct", a: 12500, pick: "" },
      { id: "d", n: "Font licence", d: "8 Oct", a: 14200, pick: "" },
    ],
  },
  cats: {
    uk: [
      { c: "Office costs", note: "" },
      { c: "Car, van and travel", note: "" },
      { c: "Entertaining", note: "Not allowable" },
      { c: "Advertising", note: "" },
      { c: "Personal", note: "Stays out of Going out" },
    ],
    lk: [
      { c: "Printing", note: "" },
      { c: "Travel", note: "" },
      { c: "Entertainment", note: "Check with your practitioner" },
      { c: "Equipment", note: "Capital item, for allowances" },
      { c: "Personal", note: "Stays out of Going out" },
    ],
  },
};

export const GO_BILLS = {
  kicker: "Bills and every-month costs",
  title: "Recorded once, paid when you choose.",
  lead: "Enter a bill once and mark it paid in full or in parts as you pay it from your bank. Rent and subscriptions sit in one list, added to Going out each month.",
  bill: {
    uk: { ref: "PS-2207", due: "18 Oct 2026", who: "Leeds Print Shop", what: "Poster print run for Leeds Print Fest", amt: 320, step: 20, also: [["Studio rent · every month on the 1st", 450], ["Accountant’s fee · due 31 Oct", 180]] as [string, number][] },
    lk: { ref: "PR-0412", due: "18 Oct 2026", who: "Colombo Print House", what: "Catalogue print run for Lanka Agri Exports", amt: 54280, step: 2000, also: [["Office rent · every month on the 1st", 180000], ["Leased printer · due 25 Oct", 14500]] as [string, number][] },
  },
  monthly: {
    uk: [
      ["1st", "Studio rent", 450],
      ["3rd", "Broadband", 28],
      ["5th", "Mobile phone (70% business)", 25],
      ["8th", "Design software", 42],
      ["12th", "Cloud storage", 8],
      ["20th", "Professional insurance", 19],
    ],
    lk: [
      ["1st", "Office rent", 180000],
      ["3rd", "Internet", 12500],
      ["5th", "Mobile phones", 6800],
      ["10th", "Design software", 14200],
      ["15th", "Leased printer", 14500],
      ["20th", "Cleaning service", 9000],
    ],
  } satisfies ByCountry<[string, string, number][]>,
};

export const GO_PEOPLE = {
  kicker: "People you pay",
  title: { uk: "Suppliers and staff, recorded properly.", lk: "Suppliers and payroll, worked out properly." } satisfies Copy,
  lead: {
    uk: "Know who you owe and what you’ve paid them this year. If you employ people, enter each pay run from your payroll software and the costs land in your books.",
    lk: "Know who you owe and what you’ve paid them this year. Pay your team with EPF, ETF and APIT worked out, payslips ready, and the monthly schedules to pay and file.",
  } satisfies Copy,
  suppliers: {
    uk: [
      ["LP", "Leeds Print Shop", "Printing", 2140, "£320 due 18 Oct", "#FDE6D6"],
      ["KS", "Kirkgate Studios", "Studio rent", 3150, "Paid up", "#EEE8FF"],
      ["DS", "Dale & Shaw", "Accountants", 540, "£180 due 31 Oct", "#E2F6D5"],
    ],
    lk: [
      ["CP", "Colombo Print House", "Printing · Tax Invoices", 412000, "Rs 54,280 due 18 Oct", "#FDE6D6"],
      ["LO", "Liberty Office Spaces", "Office rent", 1260000, "Paid up", "#EEE8FF"],
      ["JC", "Jayasinghe & Co", "Tax practitioner", 90000, "Rs 30,000 due 31 Oct", "#E2F6D5"],
    ],
  } satisfies ByCountry<[string, string, string, number, string, string][]>,
  payroll: {
    uk: {
      title: "Payroll records",
      sub: "Entered from your payroll software",
      banner: "Run payroll and report to HMRC through your payroll software. BillingEase keeps the records.",
      run: "Pay run · 25 October 2026 · Aire Valley Electrical (sample)",
      people: [["JB", "Jamie Booth, apprentice", 1120, "#FDE6D6"]] as [string, string, number, string][],
    },
    lk: {
      title: "Payroll",
      sub: "EPF, ETF, APIT and payslips",
      banner: "BillingEase calculates payroll. Pay EPF, ETF and APIT and file returns through the EPF, ETF and IRD channels.",
      run: "Pay run · 25 October 2026 · Serendib Design Studio (sample)",
      people: [
        ["DS", "Dilani Silva", 200000, "#EEE8FF"],
        ["KR", "Kasun Rathnayake", 150000, "#FDE6D6"],
        ["NM", "Nimali Mendis", 120000, "#E2F6D5"],
      ] as [string, string, number, string][],
    },
  },
};

export const GO_QUOTES = {
  uk: [
    { quote: "I photograph the receipt in the car park and type the total. That’s it. At the end of the quarter there’s nothing in a shoebox.", name: "Ellie Harper", role: "Harper Studio, Leeds (sample business)", tint: "orange" as const },
    { quote: "The boiler repair goes against Flat 1 and the mortgage interest stays on its own. My accountant stopped asking which property was which.", name: "Tom Pickering", role: "Pickering Lets, York (sample business)", tint: "violet" as const },
  ],
  lk: [
    { quote: "The printer’s Tax Invoice goes in once and the input VAT is counted. My practitioner gets the VAT summary without asking me for a single bill.", name: "Ayesha Fernando", role: "Serendib Design Studio, Colombo 03 (sample business)", tint: "orange" as const },
    { quote: "Payslips used to take an evening. Now EPF and ETF are worked out when I save the pay run, and the schedules are ready to file.", name: "Chaminda Perera", role: "Kandy Hill Bakery, Kandy (sample business)", tint: "violet" as const },
  ],
};

export const GO_FAQ: ByCountry<{ q: string; a: string }[]> = {
  uk: [
    { q: "Does BillingEase read my receipts?", a: "If you want it to. Send a photo or PDF of a receipt or a supplier’s bill and BillingEase reads it with AI, checks that the amounts add up, and drafts the expense or bill for you. It waits in For you to check: nothing goes into your books until you approve it, and you can change any detail first. Or type it in yourself, as before." },
    { q: "Does it connect to my bank or cards?", a: "No. There are no bank or card feeds. You add expenses and bills yourself; most sole traders and landlords have a handful a week." },
    { q: "Which categories does it use?", a: "HMRC’s self-employment and property categories, the ones MTD quarterly updates use, with plain names on screen. Your accountant sees HMRC’s names underneath." },
    { q: "Can I pay bills from BillingEase?", a: "No. Pay from your bank as you do today, then mark the bill paid in full or in part. Going out stays right either way." },
    { q: "Does it run payroll?", a: "Not in the UK. Run payroll and report to HMRC through your payroll software, then enter each pay run in BillingEase so the costs land in your books." },
    { q: "Can I log mileage?", a: "Yes. Log business miles and the allowance is added at the simplified rates. Rates are checked against gov.uk before launch." },
  ],
  lk: [
    { q: "Does BillingEase read my receipts?", a: "If you want it to. Send a photo or PDF of a receipt or a supplier’s bill and BillingEase reads it with AI, checks that the amounts add up, and drafts the expense or bill for you. It waits in For you to check: nothing goes into your books until you approve it, and you can change any detail first. Or type it in yourself, as before." },
    { q: "Does it connect to my bank?", a: "No. Sri Lanka has no bank feeds, so you add expenses and bills yourself. Importing a bank statement from a CSV file is planned, not available yet." },
    { q: "How is input VAT handled?", a: "When a supplier gives you a Tax Invoice, enter its VAT and it’s counted as input VAT in that period’s VAT summary. SSCL has no input credit, so it isn’t counted back." },
    { q: "What does payroll work out?", a: "Earnings, EPF at 8% for the employee and 12% for you, ETF at 3%, and APIT from the current tables, then net pay and a payslip. You also get the monthly EPF, ETF and APIT schedules and a bank salary list." },
    { q: "Does BillingEase pay EPF or file APIT for me?", a: "No. You pay and file through the EPF, ETF and IRD channels as you do today. BillingEase gives you the figures and the schedules, and puts the dates on Home." },
    { q: "Can I record a cheque I wrote to a supplier?", a: "Yes. Mark the bill paid by cheque with its number, in full or in part." },
  ],
};

export const GO_CTA = {
  kicker: "Going out",
  title: "Add tonight’s receipts in a minute.",
  text: "Attach the photo, type the total, pick the category. Going out and your three numbers update straight away.",
};
