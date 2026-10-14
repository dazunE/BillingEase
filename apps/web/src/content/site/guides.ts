/**
 * Guides (/guides and /guides/[slug]): short articles for UK sole traders and
 * landlords, and Sri Lankan small businesses. Rewritten from the prototype's
 * site-content.js; the US and multi-currency guides were dropped.
 *
 * Every guide is tagged with the country it is about ("uk", "lk" or "both").
 * Guides that quote a rate, threshold or date carry `asOf`, and the page shows
 * the "illustrative, check with your accountant" note with that date. No named
 * authors: guides are written by the BillingEase team, and pull-quotes are
 * rules of thumb, not quotes from people.
 */
import type { CoverKey } from "@/components/site/illustrations/resources/GuideCovers";
import type { SiteCountry } from "./country";
import { ROUTES } from "./routes";

export type GuideCountry = SiteCountry | "both";

export type GuideBlock =
  | { t: "p"; x: string; lead?: string; only?: SiteCountry }
  | { t: "h"; x: string; only?: SiteCountry }
  | { t: "list"; items: string[]; only?: SiteCountry }
  | { t: "callout"; title: string; x: string; tone: "tip" | "note" | "warn"; only?: SiteCountry }
  | { t: "table"; caption: string; head: string[]; rows: string[][]; only?: SiteCountry }
  | { t: "example"; title: string; rows: [string, string][]; total: [string, string]; note?: string; only?: SiteCountry }
  | { t: "rule"; x: string; only?: SiteCountry };

export type GuideCategory = "Making Tax Digital" | "Tax" | "Landlords" | "VAT and SSCL" | "Payroll" | "Getting paid" | "Working together";

export type Guide = {
  slug: string;
  country: GuideCountry;
  category: GuideCategory;
  cover: CoverKey;
  featured?: boolean;
  title: string;
  dek: string;
  /** "In short": three lines. */
  summary: string[];
  /** When the guide was written (ISO date). */
  date: string;
  /** Rates, thresholds and dates checked as of (ISO date). Set on every guide that quotes one. */
  asOf?: string;
  /** "Try it in BillingEase" panel. `href` is a site page or a page of the app (signed in). */
  app: { label: string; href: string; line: string };
  blocks: GuideBlock[];
};

const P = (x: string, lead?: string, only?: SiteCountry): GuideBlock => ({ t: "p", x, lead, only });
const H = (x: string, only?: SiteCountry): GuideBlock => ({ t: "h", x, only });
const L = (items: string[], only?: SiteCountry): GuideBlock => ({ t: "list", items, only });
const C = (title: string, x: string, tone: "tip" | "note" | "warn" = "tip", only?: SiteCountry): GuideBlock => ({ t: "callout", title, x, tone, only });
const T = (caption: string, head: string[], rows: string[][], only?: SiteCountry): GuideBlock => ({ t: "table", caption, head, rows, only });
const EX = (title: string, rows: [string, string][], total: [string, string], note?: string, only?: SiteCountry): GuideBlock => ({ t: "example", title, rows, total, note, only });
const R = (x: string, only?: SiteCountry): GuideBlock => ({ t: "rule", x, only });

const WRITTEN = "2026-10-14";

export const GUIDES: Guide[] = [
  {
    slug: "getting-ready-for-mtd-for-income-tax",
    country: "uk",
    category: "Making Tax Digital",
    cover: "mtd",
    featured: true,
    title: "Getting ready for Making Tax Digital for Income Tax",
    dek: "Who has to join and when, what a quarterly update is, and the habits that make each quarter a ten-minute job instead of a weekend.",
    summary: [
      "If your self-employment and property income together are over £50,000, MTD starts in April 2026; over £30,000 in April 2027; over £20,000 in April 2028.",
      "You keep digital records and send a short update to HMRC every quarter, then a final declaration after the tax year.",
      "Your accountant can send the updates for you from the records you keep.",
    ],
    date: WRITTEN,
    asOf: WRITTEN,
    app: {
      label: "See how quarters work",
      href: ROUTES.yoursToKeep.href,
      line: "Your records go into HMRC’s categories as you enter them, so each quarter is ready for your accountant to send.",
    },
    blocks: [
      P("Making Tax Digital for Income Tax (MTD) changes how sole traders and landlords report to HMRC. Instead of one Self Assessment return a year built from a year of paperwork, you keep your records digitally and send a summary every three months. It sounds like four times the work. Done steadily, it’s less: the year-end rush disappears because the year was never left to pile up."),
      H("Who has to join, and when"),
      P("It depends on your qualifying income: your gross income from self-employment and from property, added together, before expenses. HMRC looks at the tax return from two years earlier to decide."),
      T("When MTD for Income Tax starts", ["Qualifying income", "MTD starts", "Based on your return for"], [
        ["Over £50,000", "6 April 2026", "2024 to 2025"],
        ["Over £30,000", "6 April 2027", "2025 to 2026"],
        ["Over £20,000", "6 April 2028", "2026 to 2027"],
      ]),
      P("Gross means turnover, not profit. A designer who invoices £34,000 a year and lets a flat for £9,600 has qualifying income of £43,600, even if the profit is far lower, so they join in April 2027.", "Turnover, not profit."),
      H("What you do each quarter"),
      P("You keep a digital record of every sale and every cost, in HMRC’s categories. Every quarter, totals for each category go to HMRC through MTD-compatible software. The standard quarters follow the tax year:"),
      T("Standard quarters and update deadlines", ["Quarter", "Covers", "Update due by"], [
        ["1", "6 April to 5 July", "7 August"],
        ["2", "6 July to 5 October", "7 November"],
        ["3", "6 October to 5 January", "7 February"],
        ["4", "6 January to 5 April", "7 May"],
      ]),
      P("You can choose calendar quarters instead (1 April to 30 June, and so on), which many people find easier to remember. Ask your accountant which you use."),
      P("After the year ends you, or your accountant, send a final declaration by 31 January. That’s where allowances, other income and adjustments go in, and where your tax bill is worked out. The quarterly updates themselves don’t create a bill."),
      R("A quarterly update is a summary of records you already keep. If the records are there, the update takes minutes."),
      H("Habits that make it easy"),
      L([
        "Record income and costs as they happen, or at least once a week. A week of receipts is ten minutes; a quarter of them is an afternoon.",
        "Keep business and personal spending apart, ideally in a separate bank account.",
        "Attach a photo or PDF of each receipt or bill to the record, so you and your accountant can check it later.",
        "Split costs you use partly for yourself, like a phone or a car, by the share that’s for business.",
        "If you’re a landlord too, keep each property’s rent and costs apart from your trade.",
      ]),
      C("Working with an accountant", "Most people joining MTD will have their accountant send the quarterly updates and the final declaration. Your part is the records. Agree a date each quarter when the books should be up to date, a week or two before the deadline.", "tip"),
      H("What to do this month"),
      P("Add up last tax year’s turnover and property income to see which wave you’re in. Then pick the day of the month you’ll keep your books up to date, and put it in your calendar. If your first quarter starts next April, a few months of practice before then makes it routine."),
    ],
  },
  {
    slug: "allowable-expenses-for-sole-traders",
    country: "uk",
    category: "Tax",
    cover: "expenses",
    title: "Allowable expenses for sole traders",
    dek: "What you can take off your profit, what you can’t, and how to handle the things you use for both work and home.",
    summary: [
      "A cost is allowable when it’s wholly and exclusively for your business.",
      "Costs used partly for yourself are split by the business share.",
      "Flat rates for mileage and working from home save you adding up the real costs.",
    ],
    date: WRITTEN,
    asOf: WRITTEN,
    app: {
      label: "See how expenses work",
      href: ROUTES.goingOut.href,
      line: "Each expense goes into HMRC’s category as you enter it, with the business share and a photo or PDF attached.",
    },
    blocks: [
      P("You pay tax on profit: what came in, minus allowable expenses. Every allowable cost you record is profit you don’t pay tax on. Every personal cost you record by mistake is a question from HMRC waiting to happen. Here’s how to tell them apart."),
      H("The test: wholly and exclusively"),
      P("A cost is allowable when you spent it only to run your business. Software you use for client work, materials for a job, your accountant’s fee: allowable. Your lunch on a normal working day, your everyday clothes, a parking fine: not allowable, even though you were working at the time."),
      T("Common costs and HMRC’s categories", ["Cost", "Usually", "HMRC category"], [
        ["Materials and stock you sell", "Allowable", "Cost of goods"],
        ["Phone, broadband, software, stationery", "Allowable (business share)", "Office costs"],
        ["Train fares and hotels for work trips", "Allowable", "Car, van and travel"],
        ["Advertising and your website", "Allowable", "Advertising"],
        ["Accountant’s fees", "Allowable", "Professional fees"],
        ["Bank charges on a business account", "Allowable", "Bank and finance charges"],
        ["Entertaining clients", "Not allowable", "Business entertainment"],
        ["Everyday clothes, commuting, fines", "Not allowable", "Not a business expense"],
      ]),
      H("Things you use for both"),
      P("A phone you use for work and home, a car, a room in your house: you can claim the business share. Pick a fair way to measure it (calls, miles, hours) and use it consistently. If 60% of your phone bill is work, record the whole bill and mark 60% as business."),
      EX("A month of mixed costs", [
        ["Phone contract, £36, 60% business", "£21.60"],
        ["Broadband, £30, 40% business", "£12.00"],
        ["Design software subscription", "£24.00"],
        ["Working from home, 60 hours this month (flat rate)", "£18.00"],
      ], ["Allowable this month", "£75.60"], "Example figures. The business shares are your own judgement; keep a note of how you arrived at them."),
      H("Flat rates instead of real costs"),
      P("For some costs you can use HMRC’s simplified expenses: a flat rate instead of working out the real figure."),
      T("Simplified expenses", ["What", "Flat rate"], [
        ["Business miles in your own car or van", "45p a mile for the first 10,000 miles in the tax year, 25p after"],
        ["Working from home, 25 to 50 hours a month", "£10 a month"],
        ["Working from home, 51 to 100 hours a month", "£18 a month"],
        ["Working from home, 101 hours or more a month", "£26 a month"],
      ]),
      P("If you use mileage rates for a vehicle, you can’t also claim its fuel, insurance or repairs. Once you choose a method for a vehicle, you keep it for as long as you use that vehicle in the business.", "One method per vehicle."),
      H("The £1,000 trading allowance"),
      P("If your costs are very small, you can take £1,000 off your income instead of claiming actual expenses. It suits small side earnings. If your real allowable costs are more than £1,000, claim them instead."),
      C("Keep the proof", "Keep receipts, bills and invoices for at least five years after the 31 January deadline for that tax year. A photo or a PDF is fine, as long as you can read it.", "note"),
      R("If you’d have bought it anyway, it probably isn’t a business expense. If you bought it only because of the work, it probably is."),
    ],
  },
  {
    slug: "keeping-records-as-a-landlord",
    country: "uk",
    category: "Landlords",
    cover: "landlord",
    title: "Keeping records as a landlord",
    dek: "Rent, costs and mortgage interest for each property, kept so your accountant can file without a single follow-up question.",
    summary: [
      "Keep each property’s rent and costs apart, and record your share if you own it jointly.",
      "Mortgage interest isn’t an expense: it gives a 20% tax reduction instead, so keep it separate.",
      "Property income counts towards the Making Tax Digital thresholds.",
    ],
    date: WRITTEN,
    asOf: WRITTEN,
    app: {
      label: "BillingEase for landlords",
      href: ROUTES.landlords.href,
      line: "Properties with your share, rent and costs per property, and mortgage interest kept apart from the rest.",
    },
    blocks: [
      P("Letting a flat or a house is a business in HMRC’s eyes, with its own section of your tax return and, from 2026 onwards, its own quarterly updates under Making Tax Digital. The good news: a landlord’s books are simpler than most. A few records, kept the same way every month, do the job."),
      H("One set of records per property"),
      L([
        "Rent received, with the date and the tenant.",
        "Costs: letting agent fees, repairs, insurance, ground rent and service charges, safety certificates, cleaning between tenants.",
        "Mortgage or loan interest, kept on its own.",
        "Your share, if you own the property with someone else. You record your share of the rent and costs.",
      ]),
      P("Furnished holiday lettings used to have their own rules. They were abolished from April 2025, so those properties are now treated like any other let.", "Holiday lets."),
      H("Repairs or improvements?"),
      P("Repairing something back to how it was is an allowable cost: fixing a leaking roof, replacing a broken boiler with a similar one, repainting between tenants. Improving the property, like an extension or a loft conversion, isn’t; it’s a capital cost that may reduce tax when you sell. Replacing furniture, appliances and furnishings in a let home is usually allowable as replacement of domestic items."),
      H("Mortgage interest works differently"),
      P("For residential lets you can’t deduct mortgage interest from your rent. Instead you get a tax reduction of 20% of the interest. That’s why it needs to be kept apart: it goes into a different box, and your accountant needs the full figure."),
      EX("One flat in Leeds, a year", [
        ["Rent received, 12 × £800", "£9,600"],
        ["Letting agent, insurance, repairs", "−£1,840"],
        ["Profit before mortgage interest", "£7,760"],
        ["Mortgage interest paid (kept apart)", "£3,000"],
      ], ["Tax reduction for the interest (20%)", "£600"], "Illustrative figures. Income tax is charged on the £7,760 at your own rate, then £600 comes off the bill."),
      H("The £1,000 property allowance"),
      P("If your property income is small, you can take £1,000 off it instead of claiming actual costs. You can’t use it together with the mortgage interest reduction, so it rarely suits a mortgaged let, but it can suit renting out a driveway or a room occasionally."),
      C("Making Tax Digital", "Your gross rent counts towards the MTD thresholds together with any self-employment income. If the two together are over £50,000 you join in April 2026; over £30,000 in April 2027; over £20,000 in April 2028.", "note"),
      R("Same day, same way: record the rent when it lands and the cost when you pay it, and the quarter takes care of itself."),
    ],
  },
  {
    slug: "vat-registration-in-the-uk",
    country: "uk",
    category: "VAT and SSCL",
    cover: "vat",
    title: "VAT registration: when you have to, and when you might want to",
    dek: "How the £90,000 threshold works, what changes on your invoices once you register, and why some people register early.",
    summary: [
      "You must register when your VAT-taxable turnover in the last 12 months goes over £90,000, or will in the next 30 days.",
      "Once registered, you charge VAT on your sales, show it on your invoices and send a VAT return every quarter.",
      "You can register voluntarily below the threshold, which suits businesses whose customers are mostly VAT registered.",
    ],
    date: WRITTEN,
    asOf: WRITTEN,
    app: {
      label: "See how invoices work",
      href: ROUTES.comingIn.href,
      line: "Say you’re VAT registered and add your VAT number, and every invoice becomes a VAT invoice with the rate on each line.",
    },
    blocks: [
      P("VAT is the tax most small businesses meet first and understand last. The rules are mostly about one number, a threshold, and what happens to your invoices when you cross it."),
      H("The threshold is a rolling 12 months"),
      P("Add up your VAT-taxable turnover (sales that aren’t exempt) for the last 12 months, at the end of every month. Not the tax year, not the calendar year: the last 12 months. If it goes over £90,000, you must register within 30 days of the end of that month. You must also register straight away if you expect to go over £90,000 in the next 30 days alone."),
      T("VAT in the UK", ["What", "Figure"], [
        ["Registration threshold", "£90,000 in any rolling 12 months"],
        ["Deregistration threshold", "£88,000"],
        ["Standard rate", "20%"],
        ["Reduced rate (for example home energy)", "5%"],
        ["Zero rate (for example most food, books)", "0%"],
      ]),
      H("What changes once you’re registered"),
      L([
        "You add VAT to your prices for VAT-able sales, and pay it to HMRC.",
        "You can reclaim the VAT on most of your business costs.",
        "Your invoices must be VAT invoices: your VAT number, the date of supply, the rate and amount of VAT on each line, and the totals with and without VAT.",
        "You send a VAT return, usually every quarter, through Making Tax Digital for VAT software. Your accountant usually does this.",
      ]),
      EX("A VAT invoice from a design studio", [
        ["Brand guidelines, 1 × £1,800", "£1,800.00"],
        ["Website design, 1 × £1,200", "£1,200.00"],
        ["VAT at 20%", "£600.00"],
      ], ["Total due", "£3,600.00"], "The £600 isn’t income. It goes to HMRC, less the VAT you paid on your own costs."),
      H("Registering before you have to"),
      P("If most of your customers are VAT-registered businesses, registering early can make sense: they reclaim the VAT you charge, so it costs them nothing, and you reclaim VAT on your own costs. If most of your customers are the public, registering early usually means raising prices or earning less."),
      C("VAT stays out of your three numbers", "VAT you collect isn’t yours, so BillingEase leaves it out of Coming in, Going out and Yours to keep. You see the VAT separately, for your accountant’s return.", "note"),
      R("Watch the rolling 12 months, not the tax year. The threshold doesn’t wait for April."),
    ],
  },
  {
    slug: "writing-a-sri-lankan-tax-invoice",
    country: "lk",
    category: "VAT and SSCL",
    cover: "taxInvoice",
    featured: true,
    title: "Writing a Sri Lankan Tax Invoice with VAT and SSCL",
    dek: "What has to be on a Tax Invoice, how VAT at 18% and SSCL at 2.5% sit on it, and the mistakes that cause trouble at return time.",
    summary: [
      "VAT-registered businesses issue invoices titled “Tax Invoice”, with both parties’ details and VAT shown separately.",
      "VAT is 18% for most supplies. SSCL at 2.5% is a separate levy and goes on its own line.",
      "Keep invoice numbers in one unbroken series, and never edit an issued Tax Invoice: issue a credit note.",
    ],
    date: WRITTEN,
    asOf: WRITTEN,
    app: {
      label: "See how Tax Invoices work",
      href: ROUTES.comingIn.href,
      line: "Add your TIN and VAT number once. Every invoice is then a Tax Invoice, with VAT and SSCL on their own lines.",
    },
    blocks: [
      P("If your business is registered for VAT in Sri Lanka, the invoices you issue are more than a request for payment: they’re the document your customer uses to claim back the VAT, and the one the Inland Revenue Department (IRD) checks against your return. Getting the format right once saves a lot of correcting later."),
      H("What goes on a Tax Invoice"),
      L([
        "The words “Tax Invoice” at the top.",
        "Your business name, address, TIN and VAT registration number.",
        "Your customer’s name and address, and their VAT number if they’re registered.",
        "The date of the invoice and the date of supply, and a serial number from one unbroken series.",
        "A description of what you supplied, with quantity and value.",
        "The VAT rate and the VAT amount, shown separately, and the total including VAT.",
      ]),
      P("The IRD revised the required Tax Invoice format from 1 July 2026, ahead of e-invoicing through RAMIS. Check the current field list with your tax practitioner or on ird.gov.lk before you design your own template.", "A revised format."),
      H("VAT and SSCL"),
      P("VAT is charged at 18% on most supplies, with some zero-rated and exempt. The Social Security Contribution Levy (SSCL) is a separate levy of 2.5% on turnover. Unlike VAT, there’s no credit for SSCL you pay on your own costs, so it needs its own line and its own summary."),
      EX("A Tax Invoice from a design studio in Colombo", [
        ["Design services", "Rs 250,000.00"],
        ["SSCL 2.5%", "Rs 6,250.00"],
        ["VAT 18% (on Rs 256,250)", "Rs 46,125.00"],
      ], ["Total", "Rs 302,375.00"], "Layout only. Whether SSCL sits inside the VAT base like this is one of the details to confirm with your practitioner or the IRD before you rely on it."),
      H("When you have to register"),
      P("You must register for VAT once your taxable supplies pass the registration threshold. Published figures for the current threshold differ, so confirm the figure that applies to you with your tax practitioner or the IRD. Below the threshold you issue ordinary invoices, without VAT."),
      H("Mistakes that cause trouble"),
      L([
        "Gaps or repeats in invoice numbers. Use one series and never reuse a number, even for a cancelled invoice.",
        "Editing an invoice after it’s issued. Issue a credit note for the difference instead, and a new invoice if needed.",
        "Counting VAT and SSCL as income. They pass through your account on their way to the IRD.",
        "Missing your customer’s VAT number when they’re registered. Without it they may not be able to claim the VAT back.",
      ]),
      C("Your three numbers leave them out", "BillingEase keeps VAT and SSCL out of Coming in, Going out and Yours to keep, and shows them in their own summary for each period, ready for your return.", "note"),
      R("A Tax Invoice is a tax document first and a bill second. Number it, date it, and don’t change it once it’s out."),
    ],
  },
  {
    slug: "epf-etf-and-apit-basics",
    country: "lk",
    category: "Payroll",
    cover: "payroll",
    title: "EPF, ETF and APIT: payroll basics for your first employee",
    dek: "What you take from each salary, what you add on top, and what goes where every month once someone is on your payroll.",
    summary: [
      "EPF: 8% from the employee and 12% from you. ETF: 3% from you. Both on EPF-liable earnings.",
      "APIT is income tax taken from salaries using the IRD’s tables, and paid to the IRD monthly.",
      "Each month: pay salaries, pay EPF and ETF, pay APIT, and keep the schedules.",
    ],
    date: WRITTEN,
    asOf: WRITTEN,
    app: {
      label: "See payroll in BillingEase",
      href: ROUTES.goingOut.href,
      line: "Payslips with EPF, ETF and APIT worked out, and the monthly schedules to pay and file yourself.",
    },
    blocks: [
      P("Hiring your first employee in Sri Lanka brings three new names into your books: EPF, ETF and APIT. Each is a percentage or a table, each has its own monthly payment, and each needs a record. Here’s what they are, in the order you’ll meet them."),
      H("EPF: the Employees’ Provident Fund"),
      P("EPF is a retirement fund. Each month the employee contributes 8% of their EPF-liable earnings, taken from their pay, and you add 12% on top. Both go to the EPF, administered through the Central Bank of Sri Lanka. EPF-liable earnings are usually basic salary plus regular allowances; ask your practitioner which allowances count for your staff."),
      H("ETF: the Employees’ Trust Fund"),
      P("ETF is paid by you alone: 3% of the same earnings. Nothing comes out of the employee’s pay for it."),
      H("APIT: tax on salaries"),
      P("APIT (Advance Personal Income Tax) is income tax you deduct from salaries and pay to the IRD. The amount comes from the IRD’s tax tables, based on monthly pay. Since 1 April 2025, the first Rs 1.8 million a year (Rs 150,000 a month) is covered by the personal relief, so lower salaries have no APIT to deduct."),
      EX("One monthly salary of Rs 200,000", [
        ["Gross salary", "Rs 200,000"],
        ["EPF, employee 8% (from pay)", "− Rs 16,000"],
        ["APIT (from the IRD tables)", "− from the tables"],
        ["EPF, employer 12% (on top)", "Rs 24,000"],
        ["ETF, employer 3% (on top)", "Rs 6,000"],
      ], ["Cost to you before APIT", "Rs 230,000"], "Layout only: the APIT figure depends on the current tables, and the contribution base on which allowances are EPF-liable."),
      H("What happens every month"),
      T("A month of payroll", ["What", "Who pays", "When"], [
        ["Net salaries", "You, to each employee", "Payday"],
        ["EPF (8% + 12%) with the contribution schedule", "You", "By the end of the following month"],
        ["ETF (3%) with its schedule", "You", "By the end of the following month"],
        ["APIT deducted", "You, to the IRD", "By the 15th of the following month"],
      ]),
      P("Late EPF and ETF payments attract surcharges, so set a reminder a few days before each date. Confirm the current deadlines and filing channels with your practitioner; they change from time to time.", "Deadlines matter."),
      H("At the end of the year"),
      P("You give each employee a certificate of the APIT deducted, and the totals go into your own return and to your practitioner. Keep payslips and schedules for at least five years."),
      C("What BillingEase does, and doesn’t", "BillingEase works out EPF, ETF and APIT, makes payslips and the monthly schedules, and posts the costs to your books. You pay and file through the EPF, ETF and IRD channels yourself.", "note"),
      R("Two percentages and a table, every month, on time. Payroll is mostly about the calendar."),
    ],
  },
  {
    slug: "cheques-lankaqr-and-getting-paid",
    country: "lk",
    category: "Getting paid",
    cover: "cheque",
    title: "Cheques, LankaQR and bank transfers: recording how you get paid",
    dek: "How to record each kind of payment so your books match your bank, including post-dated and returned cheques.",
    summary: [
      "Record every payment against its invoice on the day you receive it, with how it was paid.",
      "For a cheque, note the number, the bank and the date written on it, and check it clears.",
      "A returned cheque means the invoice is unpaid again: reverse the payment, don’t delete it.",
    ],
    date: WRITTEN,
    app: {
      label: "See how payments work",
      href: ROUTES.comingIn.href,
      line: "Record a payment on any invoice by bank transfer, cheque, cash or LankaQR, with the cheque number and bank kept on it.",
    },
    blocks: [
      P("In Sri Lanka a single month of payments can include a bank transfer, a stack of cheques, cash at the counter and a LankaQR scan. Each lands in your bank differently. Recording them the same way every time is what keeps your books and your bank statement in agreement."),
      H("Bank transfers"),
      P("The simplest. Record the payment against the invoice on the date it reaches your account, and add the reference your customer used. Put your bank details on every invoice, so customers don’t have to ask."),
      H("Cheques"),
      L([
        "Record the cheque number, the bank and branch, and the date written on the cheque.",
        "Record the payment on the day you receive it, then check it clears a few days after you deposit it.",
        "A post-dated cheque can’t be banked before its date. Keep the invoice open until then, with a note of the cheque.",
        "Banks generally won’t accept a cheque that’s more than six months old, so bank cheques promptly.",
      ]),
      P("If a cheque is returned unpaid, reverse the payment rather than deleting it. The invoice is owed again, and the history shows what happened. Bank charges for the returned cheque are a cost of yours.", "When a cheque bounces."),
      H("LankaQR"),
      P("LankaQR is the Central Bank of Sri Lanka’s national QR standard: a customer scans your code in their banking or payment app, and the money comes to your account. Record it as a LankaQR payment with the date and the reference from your bank’s notification, the same as a transfer."),
      H("Cash"),
      P("Give a receipt for every cash payment, record it the same day, and bank cash regularly. Cash that isn’t recorded is the hardest thing to explain to a tax practitioner later."),
      T("Recording each kind of payment", ["How they paid", "Record", "Check"], [
        ["Bank transfer", "Date it arrived, reference", "Matches your statement"],
        ["Cheque", "Number, bank, date on the cheque", "Cleared after deposit"],
        ["LankaQR", "Date, reference", "Matches your statement"],
        ["Cash", "Date, your receipt number", "Banked, or counted at month end"],
      ]),
      C("Send a reminder on WhatsApp", "In BillingEase, a reminder for an unpaid invoice can go by email or open WhatsApp with the message ready, which is often how customers reply fastest.", "tip"),
      R("Record the payment the day it happens, with how it was paid. The bank statement then becomes a check, not a puzzle."),
    ],
  },
  {
    slug: "working-with-your-accountant",
    country: "both",
    category: "Working together",
    cover: "accountant",
    featured: true,
    title: "Working with your accountant or tax practitioner",
    dek: "What they need from you, when they need it, and how to keep the books so their questions are few and their bill is smaller.",
    summary: [
      "Your job is the records: every sale and cost, in the right category, with the receipt attached.",
      "Their job is the filing and the judgement calls. Ask before you guess.",
      "Agree a date each month or quarter when your books are up to date, and keep to it.",
    ],
    date: WRITTEN,
    app: {
      label: "BillingEase for accountants",
      href: ROUTES.accountants.href,
      line: "Your accountant sees the same books you do, so there’s nothing to send back and forth.",
    },
    blocks: [
      P("Most small businesses split the work: you keep the books, and an accountant or tax practitioner files the returns and handles the tricky parts. It works best when both sides know exactly where one job ends and the other begins."),
      H("What they need from you"),
      L([
        "Every sale: invoices you issued, and payments you received.",
        "Every cost, in the right category, with a photo or PDF of the receipt or bill.",
        "Notes on anything unusual: a large purchase, a cost that’s partly personal, money you put in or took out.",
        "Answers to their questions, before the deadline rather than on it.",
      ]),
      H("In the UK", "uk"),
      P("If you’re joining Making Tax Digital, your accountant will usually send the quarterly updates and the final declaration from your records. Agree a date each quarter, a week or two before the update deadline, when your books will be complete for that quarter. If you’re VAT registered they usually file your VAT return too.", undefined, "uk"),
      P("The accountant files; you keep the records. BillingEase doesn’t file to HMRC itself.", "Who files what.", "uk"),
      H("In Sri Lanka", "lk"),
      P("Your tax practitioner usually prepares your income tax return, and, if you’re registered, your VAT and SSCL returns. If you run payroll they may also check your EPF, ETF and APIT schedules. Agree a date each month when the month’s books are done, especially if you file VAT monthly.", undefined, "lk"),
      P("At the end of the year of assessment, your books are handed to TaxWise.lk for the return, by you or by your practitioner. Neither BillingEase nor TaxWise.lk files to the IRD on your behalf.", "The year-end hand-off.", "lk"),
      H("A monthly routine"),
      T("Twenty minutes, once a month", ["Step", "What you do"], [
        ["1. Sales", "Check every invoice for the month is in, and record payments you’ve received."],
        ["2. Costs", "Enter expenses and bills you haven’t yet, and attach the receipts."],
        ["3. Check", "Compare your bank statement’s closing balance with your books, and find any difference."],
        ["4. Chase", "Send reminders for anything overdue."],
        ["5. Look", "Read your three numbers. Did anything surprise you?"],
      ]),
      R("Ask before you guess. A two-line question now is cheaper than an amended return later."),
      H("Fixing mistakes"),
      P("If you find a mistake in a period your accountant has already filed, tell them rather than changing it quietly. In BillingEase, filed periods are locked and corrections are recorded as a new entry that reverses the old one, so both of you can see what changed and when."),
      C("They see what you see", "When your accountant works with you in BillingEase, they look at the same books, with the receipts attached. No exports, no spreadsheets by email.", "tip"),
    ],
  },
  {
    slug: "invoice-quote-or-credit-note",
    country: "both",
    category: "Getting paid",
    cover: "papers",
    title: "Invoice, quote or credit note?",
    dek: "Three documents, three different jobs. Use the right one at the right moment and customers pay faster, with fewer questions.",
    summary: [
      "A quote is a price agreed before the work. Nothing is owed yet.",
      "An invoice asks for money: what, how much and by when.",
      "A credit note takes some or all of an invoice back. You never edit an invoice once it’s sent.",
    ],
    date: WRITTEN,
    app: {
      label: "See quotes and invoices",
      href: ROUTES.comingIn.href,
      line: "Write a quote, mark it accepted, and turn it into the invoice without typing it again.",
    },
    blocks: [
      P("They look alike: your name at the top, a list of things, a number at the bottom. But each tells your customer, and the tax office, something different about where you are in the job."),
      H("A quote: “here’s what it would cost”"),
      P("A quote comes before any work. It tells the customer what you’ll do and what it will cost, so they can say yes. Nothing is owed yet, and it isn’t income. A good quote has a clear description, a price for each part, what’s not included, and an expiry date so old prices don’t come back to haunt you."),
      H("An invoice: “please pay this”"),
      P("An invoice asks for payment for work done or goods delivered. It’s the moment money becomes owed. A useful invoice has a unique number, the date, a due date, what you did, the total, any tax, and how to pay: your bank details, written out."),
      P("If you’re VAT registered in the UK, your invoices are VAT invoices. If you’re VAT registered in Sri Lanka, they’re Tax Invoices, with VAT and SSCL on their own lines.", "With tax."),
      H("A credit note: “we’re taking some of that back”"),
      P("Once an invoice is sent, don’t change it. If you need to reduce what’s owed, because of a mistake, a return or a discount agreed afterwards, issue a credit note for the difference. It has its own number and points to the original invoice, so both sets of books stay in step."),
      T("Side by side", ["", "Quote", "Invoice", "Credit note"], [
        ["When", "Before the work", "After it", "After an invoice"],
        ["Is money owed?", "No", "Yes", "Less is owed"],
        ["Counts as income?", "No", "Yes", "Reduces income"],
        ["Date that matters", "Expiry date", "Due date", "Date issued"],
      ]),
      EX("One job from start to finish", [
        ["Quote sent to Kirkstall Brewing Co", "£2,400"],
        ["Quote accepted, invoice sent", "£2,400"],
        ["One label design dropped, credit note", "−£300"],
        ["Payment received by bank transfer", "£2,100"],
      ], ["Still owed", "£0"], "The quote never counted as income. The invoice did, and the credit note took £300 of it back.", "uk"),
      EX("One job from start to finish", [
        ["Quote sent to Ochre Café", "Rs 180,000"],
        ["Quote accepted, invoice sent", "Rs 180,000"],
        ["One menu design dropped, credit note", "− Rs 30,000"],
        ["Payment received by cheque", "Rs 150,000"],
      ], ["Still owed", "Rs 0"], "Amounts before tax. The quote never counted as income. The invoice did, and the credit note took Rs 30,000 of it back.", "lk"),
      R("Quote to agree, invoice to ask, credit note to correct."),
    ],
  },
];

export const GUIDE_CATEGORIES: GuideCategory[] = ["Making Tax Digital", "Tax", "Landlords", "VAT and SSCL", "Payroll", "Getting paid", "Working together"];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** Guides for a country ("both" guides are in each). */
export function guidesFor(country: SiteCountry): Guide[] {
  return GUIDES.filter((g) => g.country === "both" || g.country === country);
}

export const GUIDE_COUNTRY_LABEL: Record<GuideCountry, string> = { uk: "UK", lk: "Sri Lanka", both: "UK and Sri Lanka" };

/** "14 October 2026" */
export function longDate(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Rough reading time, in minutes (200 words a minute, at least 3). */
export function readMinutes(g: Guide): number {
  let s = `${g.dek} ${g.summary.join(" ")}`;
  for (const b of g.blocks) {
    if (b.t === "p" || b.t === "h" || b.t === "rule") s += ` ${b.x}`;
    if (b.t === "list") s += ` ${b.items.join(" ")}`;
    if (b.t === "callout") s += ` ${b.title} ${b.x}`;
    if (b.t === "table") s += ` ${b.rows.flat().join(" ")}`;
    if (b.t === "example") s += ` ${b.rows.flat().join(" ")} ${b.note ?? ""}`;
  }
  return Math.max(3, Math.ceil(s.split(/\s+/).filter(Boolean).length / 200));
}

/** Copy for the guides list page. */
export const GUIDES_PAGE = {
  kicker: "Guides",
  title: "Money basics, in plain words.",
  lead: {
    uk: "Short, practical guides for sole traders and landlords getting ready for Making Tax Digital, and for anyone who’d rather understand their own books.",
    lk: "Short, practical guides for small businesses in Sri Lanka: Tax Invoices, VAT and SSCL, payroll, and getting paid by cheque and LankaQR.",
  },
  note: "General information, not tax advice. Rates are illustrative: check with your accountant or tax practitioner before you rely on them.",
};
