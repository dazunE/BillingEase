import { rulesFor } from "@billingease/core";
import type { Metadata } from "next";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { HelpView, type Answer } from "@/components/help/HelpView";
import { whole } from "@/components/home/format";
import { COMPANY } from "@/content/site/company";
import { homeSummary } from "@/lib/counts";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Help" };

/**
 * Help (prototype Help): short answers about using BillingEase in the business's country, each
 * with links to the page where you do it, and a way to write to a person (by email).
 */
export default async function HelpPage() {
  const { me, business: b } = await requireBusiness();
  const h = await homeSummary();
  const rules = rulesFor(b.country);
  const lk = b.country === "lk";
  const uk = b.country === "uk";
  const noun = rules.wording.practitionerNoun;
  const pr = `your ${noun}`;
  const taxWords = lk ? "income tax" : uk ? "Income Tax and National Insurance" : "tax";
  const yearWord = lk ? "year of assessment" : "tax year";
  const first = me.user.name.split(/\s+/)[0] || "there";
  const has = !!h && (h.comingIn.total !== 0 || h.goingOut.total !== 0);
  const m = (n: number) => (h ? whole(n, h.currency) : "");
  const numbers = has && h
    ? { in: m(h.comingIn.total), out: m(h.goingOut.total), profit: m(h.comingIn.total - h.goingOut.total), tax: m(h.tax.share), keep: m(h.keep), label: h.period.label }
    : null;
  const methods = rules.receiveMethods.map((x) => (x === "LankaQR" ? x : x.toLowerCase()));
  const listWords = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}` : xs.join(""));

  const common: Answer[] = [
    {
      id: "numbers", g: "start", q: "How do the three numbers work?", live: true,
      kw: "coming in going out yours to keep profit equation home numbers keep estimate",
      body: [
        `Coming in is what customers paid you in the period, plus what’s still owed on invoices you sent in it. Going out is what you spent: expenses, bills${lk ? ", payroll" : uk ? ", payroll records and mileage" : ""}, paid or still to pay. VAT${lk ? " and SSCL" : ""} you charge or can reclaim is left out: that money belongs to the tax office.`,
        `Coming in minus Going out is your profit. Yours to keep is what’s left after ${uk || lk ? `an estimate of ${taxWords} for the ${yearWord} ${h?.tax.taxYear ?? ""}` : "tax, which BillingEase doesn’t estimate in the US yet"}. ${numbers ? `Here’s ${numbers.label} so far:` : "They start at nothing and fill in as you bill and spend."}`,
      ],
      links: [["Open Yours to keep", "/app/keep"], ["Back to Home", "/app"]],
    },
    {
      id: "paid", g: "in", q: "How do I record that a customer paid?",
      kw: "paid payment record bank transfer cash cheque lankaqr card machine getting paid",
      body: [
        `Open the invoice and record a payment: the amount, the date and how they paid (${listWords(methods)}).${lk ? " For a cheque, add its number, date and bank." : ""} It moves from still owed to received in Coming in, and part payments are fine.`,
        "BillingEase doesn’t take payments online or connect to your bank, so nothing is matched for you. Uploading a bank statement can match payments to invoices for you to check.",
      ],
      links: [["All invoices", "/app/in/invoices"], ["Upload a bank statement", "/app/statements"]],
    },
    {
      id: "late", g: "in", q: "A customer is paying late. What happens?",
      kw: "late overdue reminder nudge unpaid chase whatsapp",
      body: [
        `A late invoice shows in Needs you on Home and in Coming in. Open it to send a short reminder by email with the PDF${lk ? ", or open WhatsApp with the message ready to send" : ""}.`,
      ],
      links: [["Late invoices", "/app/in/invoices?status=late"], ["Needs you on Home", "/app"]],
    },
    {
      id: "quotes", g: "in", q: "Can I send a price before I invoice?",
      kw: "quote estimate proposal accept",
      body: ["Yes. Write a quote and send it. When the customer says yes, mark it accepted and turn it into an invoice in one step. Quotes don’t count in Coming in until you invoice them."],
      links: [["Write a quote", "/app/in/quotes/new"], ["All quotes", "/app/in/quotes"]],
    },
    {
      id: "receipts", g: "out", q: "What do I do with receipts?",
      kw: "receipt receipts photo pdf attach attachment upload snap scan read ai",
      body: [
        `Snap a photo or upload a PDF in For you to check: BillingEase reads it and drafts the expense or bill with a category. Nothing goes into your books until you approve it, and you can change any detail first.`,
        `Or record the expense yourself and attach the photo or PDF to it, so ${pr} can see it.`,
      ],
      links: [["Snap a receipt", "/app/check#capture"], ["Record an expense", "/app/out#expense"]],
    },
    {
      id: "bills", g: "out", q: "What’s the difference between an expense and a bill?",
      kw: "bill expense payable pay later supplier",
      body: [`An expense is already paid. A bill is something you’ll pay later: it counts as still to pay in Going out until you mark it paid, in full or in parts. You pay it from your bank as usual.${lk ? " Enter the VAT on a supplier’s Tax Invoice and it counts as input VAT." : ""}`],
      links: [["Enter a bill", "/app/out/bills/new"], ["Going out", "/app/out"]],
    },
  ];

  const ukA: Answer[] = [
    {
      id: "cats", g: "out", q: "Which category does an expense go in?",
      kw: "category categories hmrc box allowable sa103 expense",
      body: [
        "Categories follow HMRC’s self-employment boxes, with a plain name on top and HMRC’s name underneath. Some, like client entertaining, are marked not allowable. You can also say what share of a cost was for the business.",
        `Not sure? Ask explains the rules with sources, or leave it uncategorised for ${pr} to check.`,
      ],
      links: [["Categories", "/app/keep/categories"], ["Ask", "/app/ask"]],
    },
    {
      id: "quarters", g: "keep", q: "How do Making Tax Digital quarters work here?",
      kw: "mtd making tax digital quarter quarterly update hmrc readiness checks send",
      body: [
        `Each quarter we total your records in HMRC’s categories and check for gaps, like costs without a category. ${b.quarterType === "calendar" ? "Your quarters follow calendar months." : "Quarters run 6 Apr–5 Jul, 6 Jul–5 Oct, 6 Oct–5 Jan and 6 Jan–5 Apr."} ${pr[0].toUpperCase() + pr.slice(1)} sends the update from their software; BillingEase doesn’t file with HMRC.`,
        "Once a quarter is marked sent it’s locked, so nothing changes by accident.",
      ],
      links: [["Quarters", "/app/keep/quarters"]],
    },
    {
      id: "landlord", g: "keep", q: "How do I keep my rental property separate?",
      kw: "landlord property rent flat mortgage interest letting agent",
      body: ["Properties keeps rent and costs for each home you let apart from your trade. Mortgage interest is kept on its own because it reduces your Income Tax by 20% of it rather than being taken off the rent. If your costs are small, the £1,000 property allowance may be better."],
      links: [["Properties", "/app/out/properties"], ["Add a cost or rent", "/app/out/properties#add-entry"]],
    },
    {
      id: "mileage", g: "out", q: "How do I claim business mileage?",
      kw: "mileage miles trip car van 45p",
      body: ["Log each business trip in your own vehicle in Mileage. It’s claimed at HMRC’s flat rate, 45p a mile for the first 10,000 miles in the tax year and 25p after, under Car, van and travel."],
      links: [["Mileage", "/app/out/mileage"], ["Log a trip", "/app/out/mileage#log"]],
    },
    {
      id: "payroll", g: "out", q: "Does BillingEase run my payroll?",
      kw: "payroll paye rti employee wages staff",
      body: ["No. In the UK BillingEase keeps payroll records: enter each pay run from your payroll software and the staff costs, and the PAYE and NI you owe HMRC by the 22nd, go into your books. Run payroll and report to HMRC (RTI) in your payroll software."],
      links: [["Payroll records", "/app/out/payroll"]],
    },
    {
      id: "settax", g: "keep", q: "How is the tax estimate worked out?",
      kw: "income tax national insurance class 4 estimate set aside payments on account",
      body: [`We take this tax year’s profit so far, scale it to a full year and apply the ${h?.tax.taxYear ?? ""} Income Tax bands and Class 4 National Insurance. It’s an estimate: ${pr} works out the real figure.`],
      links: [["Yours to keep", "/app/keep"], ["Tax and year-end", "/app/keep/year-end"]],
    },
    {
      id: "vat", g: "keep", q: "I’m VAT registered. Where’s my VAT?",
      kw: "vat return summary quarter registered",
      body: [`Turn on VAT in your business profile. Invoices then show VAT, and the VAT summary totals it for each VAT quarter for ${pr} to file through their MTD for VAT software.`],
      links: b.vatRegistered ? [["VAT summary", "/app/keep/tax-periods"], ["Business profile", "/app/settings/business"]] : [["Business profile", "/app/settings/business"]],
    },
  ];

  const lkA: Answer[] = [
    {
      id: "taxinv", g: "in", q: "How do I send a Tax Invoice with VAT and SSCL?",
      kw: "tax invoice vat sscl 18 levy format tin",
      body: [`If you’re VAT registered, every invoice is titled Tax Invoice and shows your TIN and VAT registration number. SSCL at ${rules.ssclBps / 100}% is its own line, then VAT at 18%. Turn VAT and SSCL on in your business profile.`],
      links: [[b.vatRegistered ? "Send a Tax Invoice" : "Send an invoice", "/app/in/invoices/new"], ["Business profile", "/app/settings/business"]],
    },
    {
      id: "periods", g: "keep", q: "How do VAT and SSCL returns work here?",
      kw: "vat sscl return period monthly ird ramis output input",
      body: [
        `Each month is totalled for you: output VAT on your Tax Invoices, input VAT on suppliers’ bills, and SSCL, in the order of the IRD return, due on the 20th of the next month. ${pr[0].toUpperCase() + pr.slice(1)} enters it on the return; BillingEase doesn’t file with the IRD.`,
        "Once a month is marked filed it’s locked, so nothing changes by accident.",
      ],
      links: b.vatRegistered || b.ssclRegistered ? [["VAT and SSCL", "/app/keep/tax-periods"]] : [["Business profile", "/app/settings/business"]],
    },
    {
      id: "payroll", g: "out", q: "How does payroll work?",
      kw: "payroll salary epf etf apit payslip employees",
      body: [
        "Each month, run payroll: EPF at 8% and 12%, ETF at 3% and APIT from the current tables are worked out for every employee, with payslips and what to pay by when.",
        "You pay salaries, EPF, ETF and APIT yourself, and file through the EPF, ETF and IRD channels. Mark each one paid and it leaves the list.",
      ],
      links: [["Payroll", "/app/out/payroll"], ["Ask about APIT", "/app/ask"]],
    },
    {
      id: "cats", g: "out", q: "Which category does an expense go in?",
      kw: "category categories schedule return expense",
      body: ["Categories match the lines of the business income schedule in your income tax return, for example Rent and rates or Electricity, water and phone. Equipment is a capital item: allowances are claimed in the return."],
      links: [["Categories", "/app/keep/categories"]],
    },
    {
      id: "settax", g: "keep", q: "How is the income tax estimate worked out?",
      kw: "income tax estimate instalments relief",
      body: [`We take this year of assessment’s profit so far, scale it to a full year, take off the personal relief and apply the current rates. It’s an estimate: ${pr} works out the real figure.`],
      links: [["Yours to keep", "/app/keep"], ["Ask about instalments", "/app/ask"]],
    },
    {
      id: "yearend", g: "keep", q: "What happens at the year end?",
      kw: "year end taxwise taxwise.lk return march",
      body: [`The year of assessment ends on 31 March. Then ${pr} prepares your income tax return with TaxWise.lk from your books: income, expenses by schedule line, capital items, VAT and SSCL totals and payroll.`],
      links: [["Tax and year-end", "/app/keep/year-end"], ["Your tax practitioner", "/app/accountant"]],
    },
  ];

  const tail: Answer[] = [
    {
      id: "accountant", g: "biz", q: `What can my ${noun} see and do?`,
      kw: "accountant practitioner practice access requests see invite",
      body: [`Invite them by email. They see your books, ${lk ? "VAT and SSCL months and payroll" : uk ? "quarters and readiness checks" : "the year so far"}, and send you requests, which show here and in Notifications. They mark periods ${lk ? "filed" : "sent"}. They can’t change your settings or how you sign in.`],
      links: [[`Your ${noun}`, "/app/accountant"], ["What they see", "/app/accountant/view"]],
    },
    {
      id: "export", g: "biz", q: "Can I take my data out?",
      kw: "export download csv spreadsheet data import leave customers",
      body: ["Yes, any time. Security and data downloads your invoices, expenses, bills and customers as CSV files that open in any spreadsheet. You can bring customers in from a CSV there too."],
      links: [["Security and data", "/app/settings/security"], ["All reports", "/app/keep/reports"]],
    },
    {
      id: "ai", g: "biz", q: "What does the AI do, and what does it cost?",
      kw: "ai agents ask cost cap claude assistant draft",
      body: ["Ask answers tax questions with sources, and the AI drafts entries from receipts and bank statements for you to check. It never changes your books on its own. AI and agents shows what ran, what it cost and the monthly cap."],
      links: [["AI and agents", "/app/settings/ai"], ["Ask", "/app/ask"]],
    },
  ];

  const answers = [...common, ...(lk ? lkA : uk ? ukA : []), ...tail];

  return (
    <>
      <AppCrumbs trail={[{ label: "Help" }]} />
      <HelpView
        first={first}
        answers={answers}
        numbers={numbers}
        searchHint={lk ? "Ask in your own words: “cheque”, “APIT”, “VAT”" : uk ? "Ask in your own words: “mileage”, “quarter”, “export”" : "Ask in your own words: “invoice”, “receipt”, “export”"}
        topicOptions={["Something else", "Invoices and payments", "Expenses and bills", "Payroll", lk ? "VAT, SSCL and income tax" : uk ? "Quarters and tax" : "Tax", `My ${noun}`, "My account"]}
        helpEmail={COMPANY.email.help}
        name={me.user.name}
        email={me.user.email}
        business={b.name}
      />
    </>
  );
}
