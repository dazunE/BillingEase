import { payroll, practice } from "@billingease/contracts";
import { rulesFor } from "@billingease/core";
import type { Metadata } from "next";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { EverythingView, type Feature, type Filter } from "@/components/help/EverythingView";
import { homeSummary } from "@/lib/counts";
import { ApiFailure, call } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Everything BillingEase does" };

/** A count we only use to say "set it up": if it can't be read, treat it as not set up. */
async function soft<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (err) {
    if (err instanceof ApiFailure) return null;
    throw err;
  }
}

/**
 * Everything BillingEase does (prototype Everything): every feature in plain words, under the
 * three numbers and Your business, each linking to the page that does it. Only the business's
 * country's features are listed; the ones that need setting up say so.
 */
export default async function EverythingPage() {
  const { business: b } = await requireBusiness();
  const rules = rulesFor(b.country);
  const lk = b.country === "lk";
  const uk = b.country === "uk";
  const noun = rules.wording.practitionerNoun;
  const [pr, pay, h] = await Promise.all([soft(call(practice.overview)), soft(call(payroll.overview)), homeSummary()]);
  const taxYear = h?.tax.taxYear ?? rules.rulesYear;
  const vat = b.vatRegistered;
  const landlord = b.kind === "landlord" || b.kind === "both";
  const staff = !!pay && (pay.employees.length > 0 || pay.runs.length > 0);
  const linked = !!pr && pr.accountants.length > 0;
  const linkedName = linked ? pr!.accountants[0].name : null;

  const F: Feature[] = [
    // Coming in
    { g: "in", name: lk && vat ? "Send a Tax Invoice" : "Send an invoice", formal: lk && vat ? "Tax Invoice" : "Invoice", text: lk ? `With your TIN${vat ? `, VAT 18% and SSCL ${rules.ssclBps / 100}% on their own lines` : ""}, emailed with the PDF.` : uk ? "In pounds, with your bank details for payment, emailed with the PDF." : "Emailed with the PDF.", href: "/app/in/invoices/new", tags: ["vat"], kw: "invoice bill charge pdf" },
    { g: "in", name: "Detailed invoices", formal: "Invoice editor", text: `Items, time and materials or one fixed price, discounts${vat ? lk ? ", VAT and SSCL" : ", VAT" : ""}, payment terms and other currencies.`, href: "/app/in/invoices", tags: ["vat"], kw: "line items discount terms currency time materials" },
    { g: "in", name: "Record a payment", formal: "Payment received", text: `${rules.receiveMethods.join(", ")}: in full or in parts, recorded by you.`, href: "/app/in/invoices", tags: [], kw: "paid payment cheque cash lankaqr bank transfer card machine" },
    { g: "in", name: "Reminders for late invoices", formal: lk ? "Email · WhatsApp" : "Email", text: lk ? "A short reminder by email with the PDF, or WhatsApp with the message ready." : "A short reminder by email with the PDF attached.", href: "/app/in/invoices?status=late", tags: [], kw: "late overdue reminder chase whatsapp" },
    { g: "in", name: "Quotes", formal: "Estimates", text: "Send a price first. When they say yes, mark it accepted and turn it into an invoice.", href: "/app/in/quotes", tags: [], kw: "estimate proposal accept" },
    { g: "in", name: "Repeating invoices and money back", formal: "Recurring · credit notes", text: "An invoice every month for retainers, and credit notes to take money off an invoice.", href: "/app/in/repeating", tags: [], kw: "recurring monthly retainer refund credit note" },
    { g: "in", name: "What you sell", formal: "Products and services", text: "Save your prices once, then pick them on a quote or invoice.", href: "/app/in/prices", tags: [], kw: "catalog price list items" },
    { g: "in", name: "Your customers", formal: "Customer list", text: "Who you work for, what they owe, and everything you’ve sent them.", href: "/app/in/customers", tags: [], kw: "clients contacts statement" },
    // Going out
    { g: "out", name: "Record an expense", formal: "", text: lk ? "Already paid, in a category that matches your tax return. Attach a photo or PDF." : uk ? "Already paid, in an HMRC category, with a business-use share. Attach a photo or PDF." : "Already paid, in a category, with a business-use share. Attach a photo or PDF.", href: "/app/out#expense", tags: [], kw: "expense spend cost receipt attachment" },
    { g: "out", name: "Snap a receipt or bill", formal: "AI drafts", text: "A photo or PDF: BillingEase reads it and drafts the entry for you to check.", href: "/app/check#capture", tags: [], kw: "receipt photo scan read ai capture" },
    { g: "out", name: "Bills to pay", formal: "Bills", text: `Enter a bill once, then mark it paid in full or in parts.${lk && vat ? " Input VAT is counted for your return." : ""}`, href: "/app/out/bills", tags: lk ? ["vat"] : [], kw: "bill payable supplier partial input vat" },
    { g: "out", name: "Every month", formal: "Repeating costs", text: lk ? "Office rent, electricity and internet set up once." : "Rent, software and phone set up once.", href: "/app/out/monthly", tags: [], kw: "recurring rent subscription" },
    { g: "out", name: "Who you pay", formal: "Suppliers", text: "Suppliers, their bills and what you owe each of them.", href: "/app/out/suppliers", tags: [], kw: "vendor supplier contractor" },
    lk
      ? { g: "out", name: "Payroll", formal: "EPF · ETF · APIT", text: "Monthly pay runs with EPF 8% and 12%, ETF 3%, APIT, payslips and what to pay by when.", href: "/app/out/payroll", need: "staff", tags: ["staff"], kw: "payroll salary epf etf apit payslip employees" }
      : uk
      ? { g: "out", name: "Payroll records", formal: "Staff costs", text: "Pay runs entered from your payroll software, with PAYE and NI due on the 22nd. RTI stays in your payroll software.", href: "/app/out/payroll", need: "staff", tags: ["staff"], kw: "payroll paye staff wages employees rti" }
      : { g: "out", name: "Payroll records", formal: "Staff costs", text: "Pay runs entered from your payroll software.", href: "/app/out/payroll", need: "staff", tags: ["staff"], kw: "payroll staff wages employees" },
    ...(uk ? [
      { g: "out", name: "Mileage", formal: "Simplified expenses", text: "Business trips at 45p a mile, then 25p after 10,000 miles.", href: "/app/out/mileage", tags: [], kw: "mileage miles car van trips" },
      { g: "out", name: "Your rental property", formal: "Landlord · SA105", text: "Rent and costs per property, mortgage interest kept apart, the £1,000 allowance when it’s better.", href: "/app/out/properties", need: "landlord", tags: ["landlord"], kw: "landlord property rent mortgage interest allowance" },
    ] satisfies Feature[] : []),
    // Yours to keep
    lk
      ? { g: "keep", name: "Income tax estimate", formal: `Year of assessment ${taxYear}`, text: "Yours to keep is after income tax on your profit, after the personal relief.", href: "/app/keep", tags: [], kw: "income tax estimate instalments relief" }
      : uk
      ? { g: "keep", name: "Income Tax and NI estimate", formal: `Tax year ${taxYear}`, text: "Yours to keep is after Income Tax and Class 4 NI on your profit.", href: "/app/keep", tags: [], kw: "income tax national insurance estimate" }
      : { g: "keep", name: "Your profit", formal: "Before tax", text: "Coming in minus Going out. BillingEase doesn’t estimate US tax yet.", href: "/app/keep", tags: [], kw: "profit tax" },
    ...(lk ? [
      { g: "keep", name: "VAT and SSCL periods", formal: "Tax periods", text: "Output VAT, input VAT and SSCL for each month, in the order of the IRD return.", href: "/app/keep/tax-periods", need: "vat", tags: ["vat"], kw: "vat sscl return period ird" },
    ] satisfies Feature[] : uk ? [
      { g: "keep", name: "Quarters", formal: "Making Tax Digital", text: `Each quarter in HMRC’s categories, with readiness checks, for your ${noun} to send.`, href: "/app/keep/quarters", tags: [], kw: "mtd making tax digital quarter update hmrc" },
      { g: "keep", name: "VAT summary", formal: "VAT quarters", text: `Totals for each VAT quarter, for your ${noun}’s MTD for VAT software.`, href: "/app/keep/tax-periods", need: "vat", tags: ["vat"], kw: "vat return summary" },
    ] satisfies Feature[] : []),
    { g: "keep", name: "Check against your bank statement", formal: "Bank check", text: "Upload a statement (CSV or PDF): every line is matched to your books, and what’s new is drafted for you to check.", href: "/app/statements", tags: [], kw: "reconcile bank statement csv pdf import match" },
    { g: "keep", name: "For you to check", formal: "AI drafts", text: "What the AI drafted from receipts and statements. Nothing goes in until you approve it.", href: "/app/check", tags: [], kw: "check approve draft ai proposals" },
    { g: "keep", name: "Categories", formal: lk ? "Return schedule lines" : uk ? "HMRC categories" : "Schedule C lines", text: "Plain names on top, the official name underneath.", href: "/app/keep/categories", tags: [], kw: "chart of accounts categories" },
    { g: "keep", name: "How much did I make?", formal: "Profit and loss", text: "Coming in minus Going out, month by month, and the other reports.", href: "/app/keep/reports", tags: [], kw: "profit loss income statement p&l reports balance sheet" },
    { g: "keep", name: "Tax and year-end", formal: lk ? "TaxWise.lk" : uk ? "Final declaration" : "Year end", text: lk ? `What your ${noun} needs for your income tax return after 31 March.` : uk ? `The year’s figures for your ${noun}’s final declaration.` : "The year’s figures for your return.", href: "/app/keep/year-end", tags: ["practice"], kw: "year end return taxwise final declaration" },
    // Your business
    { g: "biz", name: `Your ${noun}`, formal: lk ? "TaxWise.lk" : "Practice link", text: lk ? `Invite your practitioner, answer their requests and see which months they’ve filed.` : `Invite your ${noun}, answer their requests and see what they’ve filed.`, href: "/app/accountant", tags: ["practice"], kw: "accountant practitioner requests invite" },
    { g: "biz", name: "What they see", formal: "Their view", text: `A preview of your books as your ${noun} sees them.`, href: "/app/accountant/view", need: "practice", tags: ["practice"], kw: "practice view preview workbench" },
    { g: "biz", name: "Ask", formal: "AI answers", text: "Questions about tax and your books, answered with sources named.", href: "/app/ask", tags: ["practice"], kw: "ask ai question answer" },
    { g: "biz", name: "Business profile", formal: lk ? "TIN · VAT · SSCL" : uk ? "UTR · VAT" : "EIN", text: "Your name, address, tax numbers and the details printed on every invoice.", href: "/app/settings/business", tags: ["vat", "landlord"], kw: "profile address tin utr vat" },
    { g: "biz", name: "Invoice branding", formal: "Logo · colour · layout", text: "Your logo, colour, layout and typeface on invoices and quotes.", href: "/app/settings/branding", tags: [], kw: "logo branding colour layout" },
    { g: "biz", name: "People and access", formal: "Who can see your books", text: "Invite someone to help with your books and choose what they can do.", href: "/app/settings/people", tags: ["practice"], kw: "team people access invite roles bookkeeper" },
    { g: "biz", name: "Security and your data", formal: "Sign-in · import · export", text: "Sign-in and devices, bring customers in from a CSV, download everything as spreadsheets.", href: "/app/settings/security", tags: [], kw: "security password sessions import export csv download" },
    { g: "biz", name: "AI and agents", formal: "Costs and caps", text: "What the AI ran, what it cost and the monthly cap.", href: "/app/settings/ai", tags: [], kw: "ai agents cost cap" },
    { g: "biz", name: "Apps and API", formal: "MCP · API keys", text: "Connect an AI assistant or your own software to your books.", href: "/app/settings/apps", tags: [], kw: "apps api mcp integration assistant" },
    { g: "biz", name: "Notifications", formal: "", text: "Payments, late invoices and tax dates. Also behind the bell.", href: "/app/notifications", tags: [], kw: "notifications alerts bell" },
    { g: "biz", name: "Help", formal: "Support", text: "Short answers about BillingEase, and a way to ask a real person.", href: "/app/help", tags: [], kw: "help support contact" },
  ];

  const filters: Filter[] = [{ id: "all", label: "Everything" }, ...(lk
    ? [{ id: "vat", label: "VAT and SSCL" }, { id: "staff", label: "Employees" }, { id: "practice", label: "With a practitioner" }]
    : uk
    ? [{ id: "landlord", label: "Landlords" }, { id: "vat", label: "VAT registered" }, { id: "staff", label: "With staff" }, { id: "practice", label: "With an accountant" }]
    : [{ id: "staff", label: "With staff" }, { id: "practice", label: "With an accountant" }]) as Filter[]];

  const bits = lk
    ? [vat || b.ssclRegistered ? `${[vat && "VAT", b.ssclRegistered && "SSCL"].filter(Boolean).join(" and ")} registered` : "not VAT registered", staff ? "with employees" : "no employees yet", linked ? `works with ${linkedName}` : "no practitioner linked"]
    : [uk ? (landlord ? (b.kind === "both" ? "sole trader and landlord" : "landlord") : "sole trader") : "", uk ? (vat ? "VAT registered" : "not VAT registered") : "", staff ? "with staff" : "no staff yet", linked ? `works with ${linkedName}` : `no ${noun} linked`].filter(Boolean);

  return (
    <>
      <AppCrumbs trail={[{ label: "Everything BillingEase does" }]} />
      <EverythingView
        features={F}
        filters={filters}
        on={{ vat: lk ? vat || b.ssclRegistered : vat, landlord, staff, practice: linked }}
        noun={noun}
        biz={{ name: b.name, initials: b.name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase(), country: { uk: "UK", lk: "Sri Lanka", us: "US" }[b.country] }}
        profileLine={`${b.name} (${rules.name}): ${bits.join(", ")}.`}
        keepSub={lk ? "What’s left after income tax, and the books behind it." : uk ? "What’s left after Income Tax and NI, and the books behind it." : "Your profit, and the books behind it."}
        searchHint={lk ? "Search in plain words: “cheque”, “EPF”, “SSCL”, “TaxWise”" : uk ? "Search in plain words: “mileage”, “quarter”, “rent”, “VAT”" : "Search in plain words: “invoice”, “receipt”, “export”"}
        tryWord={lk ? "payroll" : uk ? "mileage" : "receipt"}
      />
    </>
  );
}
