# BillingEase clickable prototype

A static, clickable prototype of BillingEase: manual-entry bookkeeping, invoicing and payroll for two countries, the **United Kingdom** and **Sri Lanka**. A business picks its country at sign-up, and every screen follows it: currency, tax year, categories, VAT (and SSCL in Sri Lanka), payroll rules, deadlines and wording. Every screen reads and writes one shared set of data, so what you do on one screen shows up on the others.

Two sample businesses, both on Sunday 11 Oct 2026:

- **UK · Harper Studio**: Ellie Harper, a sole trader graphic designer in Leeds who also lets one flat. Not VAT registered, cash basis, MTD quarters. Her accountant is Dale & Shaw (Priya Shaw), who files Q2 by 7 Nov.
- **Sri Lanka · Serendib Design Studio**: Ayesha Fernando, Colombo 03. VAT and SSCL registered, five employees with EPF, ETF and APIT. Her practitioner is Jayasinghe & Co (Ruwan Jayasinghe), linked to TaxWise.lk. The September VAT and SSCL return is due 20 Oct.

The product spec is `reports/BillingEase UK MVP spec.html` (two-country draft).

## Run it locally

The screens load their content with `fetch`, so they need to be served over HTTP. From the repo root:

```sh
python3 -m http.server 8000 --directory prototype
# or: npx serve prototype -l 8000
```

Then open http://localhost:8000/. The index offers both samples, both empty businesses, sign-up, and every screen grouped by area with "UK only", "Sri Lanka only" and "New" tags.

## Country and data

- `data-country.js` holds the country packs (`window.COUNTRY.uk` and `.lk`, also `BE.pack()`): currency, tax year, feature flags, categories with their official names, VAT rates, SSCL, MTD quarters, VAT periods, payroll rules, the income tax estimate and deadlines. Rates are illustrative and listed in the spec's "facts to verify".
- `store.js` keeps the data in this browser's localStorage (key `billingease.prototype.v2`) and works out the three numbers (`BE.totals()`). `BE.country()`, `BE.is('uk'|'lk')`, `BE.startSample(country)`, `BE.startEmpty({ country })`.
- Seeds that differ by country are written `BE.perCountry({ uk: ..., lk: ... })`. Data files: `data-in.js` (invoices, payments, customers), `data-sell.js` (quotes, repeating invoices, price list), `data-out.js` (expenses, bills), `data-spend.js` (every-month costs, suppliers), `data-payroll.js` (employees, pay runs), `data-books.js` (the ledger, quarters, VAT periods, reports, estimate), `data-practice.js` (properties, mileage, accountant link, filing locks), `data-biz.js` (profile, people, security), `data-home.js` (activity, notifications, accountant requests).
- Links ending in `#sample-uk`, `#sample-lk`, `#start-empty-uk`, `#start-empty-lk` or `#reset` load that business on any screen. The account menu also switches country and resets the sample.

## The flow

**Coming in − Going out = Yours to keep.**

| Area | Screens |
|---|---|
| Get started | `AuthSignUp` (pick the country) → `SetupProfile` (the country's questions; sample or start empty) · `AuthSignIn`, `AuthRecover` (accountant invites), `NotFound` |
| Home | `ThreeHome` (UK quarter card or Sri Lanka VAT month, Needs you, accountant requests), `ThreeMobile`, `Ask` (answers with sources), `Everything`, `Notifications`, `Help` |
| Coming in | `ThreeIn` → `SellInvoices`, `SellInvoice`, `SellQuotes`, `SellQuote`, `SellRecurring`, `SellCustomers`, `SellCustomer`, `SellCatalog` |
| Going out | `ThreeOut` → `SpendBill`, `SpendTransaction`, `SpendEveryMonth`, `SpendVendors`, `SpendVendor`, `SpendPayroll` (UK records / Sri Lanka full payroll), `Payslip` (Sri Lanka) |
| Yours to keep | `ThreeKeep` → `Quarters` (UK), `TaxPeriods` (VAT, and SSCL in Sri Lanka), `Properties` (UK), `Mileage` (UK), `BooksTax` (tax year end, TaxWise.lk hand-off), `BooksReports`, `BooksReconcile`, `BooksCategories` |
| Your accountant | `Accountant` (your accountant or practitioner), `PracticeView` (preview of what they see) |
| Your business | `BizProfile`, `BizTeam` (people and access), `BizSecurity` (security and data) |

A screen that doesn't apply to the business's country shows a short note with a link back to Home.

Not in this version: bank and card feeds, online payments, receipt reading, multi-currency, stock and time tracking, US tax, and several businesses per account. Attachments (a photo or PDF on an expense or bill) replace receipts.

The marketing pages (`ThreeLanding`, `Site*.dc.html`) are still the earlier US version and are being reworked.

## What's inside

| File | What it is |
|---|---|
| `index.html` | Start page and screen directory |
| `*.dc.html` | One file per screen, in the `.dc.html` format of the BillingEase design canvas |
| `support.js` | A small runtime that renders the `.dc.html` format in a plain browser |

## Design language

"Graphite & Violet": near-black graphite `#18161F` for text and dark sections, soft electric violet `#B9A3FF` for primary actions, a violet tint `#EEE8FF` for selected states, and pill-shaped controls. Headlines use Sora and UI text uses DM Sans. The logo is The Equation mark.
