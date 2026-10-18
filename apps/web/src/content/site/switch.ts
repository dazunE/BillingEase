/**
 * Copy for /switch (prototype SiteSwitch). Honest about moving today: there is
 * no automatic import or migration. CSV import is planned and marked as such.
 */
import type { ByCountry, Copy } from "./country";

export const SWITCH_META = {
  title: "Switch to BillingEase",
  description: "Moving from spreadsheets, paper or another bookkeeping tool: what moving over looks like today, how long it takes, and what stays where it is. No automatic import yet; we say so.",
};

export const SWITCH_HERO = {
  kicker: "Switch to BillingEase",
  title: "Move in an evening. Start from your next invoice.",
  lead: {
    uk: "Coming from a spreadsheet, a box of receipts or another bookkeeping tool? There’s no automatic import yet, so here’s the honest version: add your customers and prices in a few minutes, start from your next invoice, and enter opening balances with your accountant. Your old records stay where they are.",
    lk: "Coming from a spreadsheet, a box of receipts or another bookkeeping tool? There’s no automatic import yet, so here’s the honest version: add your customers and prices in a few minutes, start from your next Tax Invoice, and enter opening balances with your practitioner. Your old records stay where they are.",
  } satisfies Copy,
  link: "See how a move works",
};

export type Source = {
  id: string;
  name: string;
  mono: string;
  tint: string;
  how: string;
  moves: { t: string; d: string; planned?: boolean }[];
  stays: string;
  progress: [string, number, number][];
  time: string;
  timeNote: string;
  steps: { t: string; d: string; mins: string }[];
  words: [string, string, string][];
};

export const SWITCH_SOURCES: ByCountry<Source[]> = {
  uk: [
    {
      id: "sheet",
      name: "a spreadsheet",
      mono: "XL",
      tint: "#E2F6D5",
      how: "You type them in once. Most people have a few dozen customers and prices.",
      moves: [
        { t: "Customers", d: "Name, email and address, typed in once. Add the ones you still bill; the rest can wait." },
        { t: "Prices", d: "What you sell and what you charge, saved for every invoice." },
        { t: "Unpaid invoices", d: "Add the ones still owed to you, so Coming in and your reminders are right from day one." },
        { t: "Every-month costs", d: "Rent, phone and software set up once." },
        { t: "Import customers from a CSV file", d: "Planned. Not in BillingEase yet.", planned: true },
      ],
      stays: "Last year’s rows stay in your spreadsheet. Keep it: HMRC expects you to keep records for at least 5 years after the 31 January deadline.",
      progress: [
        ["Customers", 18, 18],
        ["Prices", 9, 9],
        ["Unpaid invoices", 4, 4],
        ["Every-month costs", 5, 6],
      ],
      time: "About an hour",
      timeNote: "For a sole trader with a couple of dozen customers. Start at the beginning of a quarter if you can.",
      steps: [
        { t: "Pick your start date", d: "The start of the current MTD quarter is easiest. Everything from then on goes into BillingEase.", mins: "2 min" },
        { t: "Add who and what", d: "Customers you still bill, your prices, your suppliers and every-month costs.", mins: "30 to 45 min" },
        { t: "Open balances with your accountant", d: "Unpaid invoices, bills you owe and money in the bank on your start date. Your accountant can enter these for you.", mins: "15 min" },
      ],
      words: [
        ["A tab called Income", "Coming in", "Invoices, payments you record, credit notes"],
        ["A tab called Expenses", "Going out", "Expenses, bills and every-month costs"],
        ["Profit, minus what you think you’ll owe", "Yours to keep", "Profit after estimated Income Tax and NI"],
        ["Your own column of categories", "HMRC categories", "Plain names, the MTD boxes underneath"],
        ["A copy of last month’s invoice", "Repeating invoices", "Drafted or emailed on the day"],
        ["Total at the bottom", "Reports", "Profit and loss, balance sheet, who owes you"],
      ],
    },
    {
      id: "paper",
      name: "paper and receipts",
      mono: "✎",
      tint: "#FFF0B8",
      how: "No data to bring across: you start fresh, and the shoebox gets lighter from today.",
      moves: [
        { t: "Customers and prices", d: "Typed in once, from your invoice book or your head." },
        { t: "Receipts from today", d: "Photograph each one and attach it to the expense. Nothing is read automatically; you type the total." },
        { t: "Unpaid invoices", d: "Add what you’re still owed so nothing is forgotten." },
        { t: "Mileage", d: "Log journeys from today at the simplified rates." },
      ],
      stays: "Keep your paper records from before your start date. HMRC expects them kept for at least 5 years after the 31 January deadline.",
      progress: [
        ["Customers", 12, 12],
        ["Prices", 6, 6],
        ["Unpaid invoices", 3, 3],
        ["Receipts this week", 7, 9],
      ],
      time: "About 45 minutes",
      timeNote: "Then a minute or two each time you get a receipt.",
      steps: [
        { t: "Pick your start date", d: "Today, or the start of the current quarter if you’ll type in a few weeks of receipts.", mins: "2 min" },
        { t: "Add who and what", d: "Customers, prices and every-month costs.", mins: "30 min" },
        { t: "From today, attach as you go", d: "Snap the receipt, type the total, pick the category.", mins: "1 min each" },
      ],
      words: [
        ["The invoice book", "Coming in", "Invoices as PDFs, payments you record"],
        ["The shoebox", "Going out", "Expenses with the photo attached"],
        ["What’s left in the bank", "Yours to keep", "Profit after estimated Income Tax and NI"],
        ["Your accountant’s categories", "HMRC categories", "Chosen once per expense"],
        ["A diary of journeys", "Mileage", "At the simplified rates"],
        ["The envelope for the tax bill", "Tax estimate", "Updated with every entry"],
      ],
    },
    {
      id: "tool",
      name: "another bookkeeping tool",
      mono: "⇄",
      tint: "#EEE8FF",
      how: "There’s no automatic transfer from other tools. You add the essentials and keep the old tool for history.",
      moves: [
        { t: "Customers and prices", d: "Typed in once. Export a list from your old tool to copy from." },
        { t: "Unpaid invoices and bills", d: "Added as they stand on your start date." },
        { t: "Opening balances", d: "Bank and the balances your accountant gives you, entered on your start date." },
        { t: "Invoice numbering", d: "Choose your own prefix, so new invoice numbers never clash with old ones." },
        { t: "Import from a CSV file", d: "Planned for customers and expenses. Not in BillingEase yet.", planned: true },
      ],
      stays: "Your history stays in your old tool. Download its reports before you cancel, and keep them as long as HMRC asks.",
      progress: [
        ["Customers", 34, 34],
        ["Prices", 15, 15],
        ["Unpaid invoices and bills", 9, 9],
        ["Opening balances", 1, 1],
      ],
      time: "An evening",
      timeNote: "Best done at a quarter end, with your accountant’s balances to hand.",
      steps: [
        { t: "Pick your start date", d: "A quarter end, so the old tool holds everything before it and BillingEase everything after.", mins: "2 min" },
        { t: "Add who and what", d: "Customers, prices, suppliers and every-month costs, copied from your old tool’s lists.", mins: "45 to 60 min" },
        { t: "Opening balances", d: "Unpaid invoices and bills, bank, and anything else your accountant gives you.", mins: "20 min" },
      ],
      words: [
        ["Sales, receivables", "Coming in", "Invoices, payments you record, credit notes"],
        ["Purchases, payables", "Going out", "Expenses, bills and every-month costs"],
        ["Net profit", "Yours to keep", "Profit after estimated Income Tax and NI"],
        ["Estimates", "Quotes", "Mark accepted, turn into an invoice"],
        ["Recurring invoices", "Repeating invoices", "Drafted or emailed on the day"],
        ["Chart of accounts", "Categories", "HMRC’s names underneath"],
      ],
    },
  ],
  lk: [
    {
      id: "sheet",
      name: "a spreadsheet",
      mono: "XL",
      tint: "#E2F6D5",
      how: "You type them in once. Most businesses have a few dozen customers, prices and staff.",
      moves: [
        { t: "Customers", d: "Name, email, address and TIN when they’re VAT registered." },
        { t: "Prices", d: "What you sell and what you charge, saved for every Tax Invoice." },
        { t: "Employees", d: "Name, NIC, EPF number, start date and basic salary, for payroll." },
        { t: "Unpaid invoices", d: "Add the ones still owed to you, so Coming in and your reminders are right from day one." },
        { t: "Import customers from a CSV file", d: "Planned. Not in BillingEase yet.", planned: true },
      ],
      stays: "Earlier months stay in your spreadsheet. Keep them for as long as the IRD requires.",
      progress: [
        ["Customers", 22, 22],
        ["Prices", 11, 11],
        ["Employees", 5, 5],
        ["Unpaid invoices", 3, 4],
      ],
      time: "About an hour",
      timeNote: "For a small business with a handful of staff. Start at the beginning of a month if you can.",
      steps: [
        { t: "Pick your start date", d: "The first of the month, so VAT, SSCL and payroll periods line up.", mins: "2 min" },
        { t: "Add who and what", d: "Customers, prices, suppliers, employees and every-month costs.", mins: "40 to 60 min" },
        { t: "Opening balances with your practitioner", d: "Unpaid invoices, bills you owe and money in the bank on your start date.", mins: "15 min" },
      ],
      words: [
        ["A sheet called Sales", "Coming in", "Tax Invoices, payments you record, credit notes"],
        ["A sheet called Expenses", "Going out", "Expenses, bills and payroll"],
        ["Profit, minus the tax you expect", "Yours to keep", "Profit after estimated income tax"],
        ["A VAT column", "VAT and SSCL", "On their own lines, with a summary each period"],
        ["A salary sheet", "Payroll", "EPF, ETF, APIT and payslips"],
        ["Total at the bottom", "Reports", "Profit and loss, balance sheet, who owes you"],
      ],
    },
    {
      id: "paper",
      name: "paper and receipts",
      mono: "✎",
      tint: "#FFF0B8",
      how: "No data to bring across: you start fresh, and the file of bills gets lighter from today.",
      moves: [
        { t: "Customers and prices", d: "Typed in once, from your bill book." },
        { t: "Receipts and Tax Invoices from today", d: "Photograph each one and attach it. Nothing is read automatically; you type the total and any VAT." },
        { t: "Employees", d: "Added once, so next month’s payroll is worked out for you." },
        { t: "Cheques you’re waiting on", d: "Recorded against the invoice with the number and bank." },
      ],
      stays: "Keep your paper records from before your start date for as long as the IRD requires.",
      progress: [
        ["Customers", 14, 14],
        ["Prices", 8, 8],
        ["Employees", 4, 4],
        ["Bills this week", 6, 9],
      ],
      time: "About 45 minutes",
      timeNote: "Then a minute or two each time a bill arrives.",
      steps: [
        { t: "Pick your start date", d: "The first of this month or next.", mins: "2 min" },
        { t: "Add who and what", d: "Customers, prices, employees and every-month costs.", mins: "30 to 40 min" },
        { t: "From today, attach as you go", d: "Photograph the bill, type the total, pick the category.", mins: "1 min each" },
      ],
      words: [
        ["The bill book", "Coming in", "Tax Invoices as PDFs, payments you record"],
        ["The file of bills", "Going out", "Expenses with the photo attached"],
        ["What’s left in the bank", "Yours to keep", "Profit after estimated income tax"],
        ["The salary book", "Payroll", "EPF, ETF, APIT and payslips"],
        ["The VAT working", "VAT and SSCL summary", "In the order of the IRD return"],
        ["A note for the practitioner", "Requests", "They ask, it shows on your Home"],
      ],
    },
    {
      id: "tool",
      name: "another bookkeeping tool",
      mono: "⇄",
      tint: "#EEE8FF",
      how: "There’s no automatic transfer from other tools. You add the essentials and keep the old tool for history.",
      moves: [
        { t: "Customers and prices", d: "Typed in once. Export a list from your old tool to copy from." },
        { t: "Employees", d: "Added once, with EPF numbers and basic salaries." },
        { t: "Opening balances", d: "Bank and the balances your practitioner gives you, on your start date." },
        { t: "Invoice numbering", d: "Choose your own prefix, so new Tax Invoice numbers never clash with old ones." },
        { t: "Import from a CSV file", d: "Planned for customers, expenses and bank statements. Not in BillingEase yet.", planned: true },
      ],
      stays: "Your history stays in your old tool. Download its reports before you cancel.",
      progress: [
        ["Customers", 30, 30],
        ["Prices", 14, 14],
        ["Employees", 6, 6],
        ["Opening balances", 1, 1],
      ],
      time: "An evening",
      timeNote: "Best done at a month end, with your practitioner’s balances to hand.",
      steps: [
        { t: "Pick your start date", d: "A month end, so VAT, SSCL and payroll periods split cleanly.", mins: "2 min" },
        { t: "Add who and what", d: "Customers, prices, suppliers, employees and every-month costs.", mins: "45 to 60 min" },
        { t: "Opening balances", d: "Unpaid invoices and bills, bank, and anything else your practitioner gives you.", mins: "20 min" },
      ],
      words: [
        ["Sales, receivables", "Coming in", "Tax Invoices, payments you record"],
        ["Purchases, payables", "Going out", "Expenses, bills and payroll"],
        ["Net profit", "Yours to keep", "Profit after estimated income tax"],
        ["Output and input tax", "VAT and SSCL", "A summary for each period"],
        ["Payroll module", "Payroll", "EPF, ETF, APIT, payslips, schedules"],
        ["Chart of accounts", "Categories", "The return’s lines underneath"],
      ],
    },
  ],
};

export const SWITCH_CHECKLIST = {
  kicker: "Your first evening",
  title: "A moving checklist, not a moving van.",
  lead: { uk: "Tick these off and your three numbers are right from your start date. Your accountant can do the balances for you.", lk: "Tick these off and your three numbers are right from your start date. Your practitioner can do the balances for you." } satisfies Copy,
  bullets: {
    uk: ["Nothing is deleted from your old records", "Your accountant sees the same books from day one", "Start free; no card needed"],
    lk: ["Nothing is deleted from your old records", "Your practitioner sees the same books from day one", "Start free; no card needed"],
  } satisfies ByCountry<string[]>,
  items: {
    uk: [
      ["date", "Pick a start date", "The start of the current MTD quarter is easiest"],
      ["cust", "Add customers you still bill", "Name and email is enough to start"],
      ["price", "Save your prices", "Pick them on any invoice"],
      ["unpaid", "Add unpaid invoices", "So reminders and Coming in are right"],
      ["every", "Set up every-month costs", "Rent, phone, software"],
      ["acct", "Invite your accountant", "They can enter opening balances"],
    ],
    lk: [
      ["date", "Pick a start date", "The first of a month lines up VAT, SSCL and payroll"],
      ["cust", "Add customers you still bill", "With their TIN if they’re VAT registered"],
      ["price", "Save your prices", "Pick them on any Tax Invoice"],
      ["staff", "Add your employees", "NIC, EPF number and basic salary"],
      ["unpaid", "Add unpaid invoices and cheques", "So reminders and Coming in are right"],
      ["acct", "Invite your practitioner", "They can enter opening balances"],
    ],
  } satisfies ByCountry<[string, string, string][]>,
};

export const SWITCH_STORY = {
  uk: {
    quote: "I moved on a Sunday evening from a spreadsheet I’d kept for six years. Customers and prices took forty minutes; my accountant put the opening balances in on Monday.",
    name: "Ellie Harper",
    role: "Harper Studio, Leeds (sample business)",
    badge: "Started at the beginning of Q3",
    mini: [
      { t: "I kept the old spreadsheet for history and haven’t opened it since.", who: "Tom Pickering", biz: "Pickering Lets, York (sample)" },
      { t: "Paper to photos in a week. The shoebox is retired.", who: "Dan Brook", biz: "Aire Valley Electrical (sample)" },
    ],
  },
  lk: {
    quote: "We moved from a spreadsheet and a salary book at the start of October. Five employees and our customers took under an hour, and the first payroll was worked out for us.",
    name: "Ayesha Fernando",
    role: "Serendib Design Studio, Colombo 03 (sample business)",
    badge: "Started on 1 October",
    mini: [
      { t: "The bill book is still on the shelf, but I haven’t needed it.", who: "Chaminda Perera", biz: "Kandy Hill Bakery (sample)" },
      { t: "Our practitioner entered the opening balances the same day.", who: "Nadeesha Silva", biz: "Ahangama Surf Lodge (sample)" },
    ],
  },
};

export const SWITCH_FAQ: ByCountry<{ q: string; a: string }[]> = {
  uk: [
    { q: "Can you import my old books automatically?", a: "Not yet. There’s no automatic import or migration from spreadsheets or other tools today. You add your customers, prices and unpaid invoices by hand, which takes most sole traders about an hour. Importing customers and expenses from a CSV file is planned." },
    { q: "Will you move my books for me?", a: "We don’t offer a moving service. Your accountant can help with opening balances, and our help team will answer questions as you go." },
    { q: "Should I bring my history across?", a: "Usually not. Keep the old records where they are, start BillingEase at the beginning of a quarter, and add only what’s still open: unpaid invoices and bills." },
    { q: "Will my invoice numbers clash?", a: "Choose your own invoice prefix in your business settings, so new numbers never clash with old ones." },
    { q: "How long do I keep my old records?", a: "HMRC expects the self-employed and landlords to keep records for at least 5 years after the 31 January submission deadline. Check gov.uk for your situation." },
  ],
  lk: [
    { q: "Can you import my old books automatically?", a: "Not yet. There’s no automatic import or migration from spreadsheets or other tools today. You add your customers, prices, employees and unpaid invoices by hand, which takes most small businesses about an hour. Importing from CSV files, including bank statements, is planned." },
    { q: "Will you move my books for me?", a: "We don’t offer a moving service. Your practitioner can help with opening balances, and our help team will answer questions as you go." },
    { q: "Can I start payroll mid-year?", a: "Yes. Add your employees and start from the next pay run. Talk to your practitioner about the earlier months, so the year-end APIT totals are complete." },
    { q: "Will my Tax Invoice numbers clash?", a: "Choose your own invoice prefix in your business settings, so new numbers never clash with old ones." },
    { q: "How long do I keep my old records?", a: "Keep them for as long as the IRD requires. Your practitioner can confirm the period for your business." },
  ],
};

export const SWITCH_CTA = {
  kicker: "Your old records stay where they are",
  title: "Move in tonight. See your three numbers tomorrow.",
};
