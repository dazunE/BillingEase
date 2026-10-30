import { rulesFor } from "@billingease/core";
import { Scene } from "./AuthArt";
import { example, ratesNote, vatRate, yearStart, type Cty } from "./country";
import { DarkPanel, EquationRows, PanelBody, PanelFoot, TickList } from "./Frame";

/** "How it works" beside sign-up: the three numbers, and the chosen country's rules (the UK until one is picked). */
export function HowItWorks({ country, picked }: { country: Cty; picked: boolean }) {
  const r = rulesFor(country);
  const lk = country === "lk";
  const ex = example(country);
  const us = country === "us";
  const rules = us
    ? [`Dollars, with the tax year from ${yearStart("us")}`, "Expenses in the IRS’s Schedule C lines", "Invoices without sales tax, for states like Delaware that have none"]
    : lk
    ? [`Rupees, with the year of assessment from ${yearStart("lk")}`, `${r.wording.vatInvoiceTitle}s with VAT ${vatRate("lk")} and SSCL as its own line`, "Payroll with EPF, ETF and APIT worked out for you"]
    : [`Pounds, with the tax year from ${yearStart("uk")}`, "Expenses in HMRC’s categories, ready each quarter", "Your practice files your Making Tax Digital updates"];
  return (
    <DarkPanel label="How BillingEase works" eyebrow="How it works" title="Your business, in three numbers.">
      <PanelBody>
        {us
          ? "Invoices, expenses and bills each sit behind one of them. Your accountant sees the same records."
          : lk
          ? "Invoices, expenses, payroll and your VAT and SSCL each sit behind one of them. Your practitioner sees the same books in TaxWise.lk."
          : "Invoices, expenses, your property and your MTD quarter each sit behind one of them. Your accountant sees the same records."}
      </PanelBody>
      <EquationRows
        inAmt={ex.in}
        outAmt={ex.out}
        keepAmt={ex.keep}
        lines={{
          in: "What customers paid you this month, or still owe.",
          out: lk ? "Expenses, bills and payroll, paid or still to pay." : "Expenses and bills, paid or still to pay.",
          keep: us ? "What’s left of your profit. Tax set-aside isn’t worked out for US businesses yet." : lk ? "What’s left after income tax is set aside." : "What’s left after Income Tax and National Insurance are set aside.",
        }}
      />
      <TickList items={rules} />
      <Scene country={country} variant="signup" keep={ex.keep} />
      <PanelFoot>
        {picked ? `Example month for a small design studio in ${r.name}.` : "Example month for a small design studio. Pick your country to see its version."}
        {country !== "uk" && ` ${ratesNote(country)}`}
      </PanelFoot>
    </DarkPanel>
  );
}

/** Beside sign-in: the books are as you left them. */
export function JustAsYouLeft({ country }: { country: Cty }) {
  const noun = rulesFor(country).wording.practitionerNoun;
  return (
    <DarkPanel label="Signing in" eyebrow="Picking up where you left off" title="Your books, just as you left them.">
      <PanelBody>
        {country === "lk"
          ? `Your invoices, expenses and payroll are saved. What’s coming due, like VAT and SSCL or EPF and ETF, waits on Home.`
          : "Your invoices, expenses and quarter are saved. What’s coming due waits on Home."}
      </PanelBody>
      <TickList
        items={[
          `Your ${noun} signs in with their own account, never yours.`,
          "Forgot your password? A reset link by email works for one hour.",
          "Everything you entered is saved as you go.",
        ]}
      />
      <Scene country={country} variant="signin" />
      <PanelFoot>We never ask for your password by email or phone.</PanelFoot>
    </DarkPanel>
  );
}

/** Beside forgot and reset password: a new password doesn't touch the books. */
export function BooksAreSafe({ country, variant }: { country: Cty; variant: "forgot" | "reset" }) {
  const ex = example(country);
  return (
    <DarkPanel label="Your books are safe" eyebrow="Example month" title="Your books are safe.">
      <PanelBody>A new password doesn’t touch anything in your business. Invoices still go out, payments still come in, and the month still adds up.</PanelBody>
      <EquationRows inAmt={ex.in} outAmt={ex.out} keepAmt={ex.keep} />
      <Scene country={country} variant={variant} />
      <PanelFoot>We never ask for your password by email or phone.</PanelFoot>
    </DarkPanel>
  );
}
