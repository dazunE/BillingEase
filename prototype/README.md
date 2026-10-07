# BillingEase clickable prototype

A static, clickable prototype of BillingEase: the marketing site, sign-up and onboarding, the full app (sales, purchases, accounting, reports, payments, payroll) and three mobile screens. Every screen links to the others, and the buttons, tabs, filters, forms and wizards work using sample data for a fictional business, Northwind Studio.

## Run it locally

The screens load their content with `fetch`, so they need to be served over HTTP (opening the files directly from disk won't work). From the repo root, pick one:

```sh
# Python 3 (nothing to install)
python3 -m http.server 8000 --directory prototype

# or Node
npx serve prototype -l 8000
```

Then open http://localhost:8000/. The index lists every screen; "Start on the landing page" walks the full flow: landing → sign up → business setup → dashboard.

## The flow

BillingEase is built around one equation: **Coming in − Going out = Yours to keep.** The prototype is one connected flow, in the order a new customer meets it:

| Step | Screens |
|---|---|
| 1 · Get started | `ThreeLanding` (landing page) → `AuthSignUp` → `SetupProfile` (what you sell, where, who works in it) · `AuthSignIn`, `AuthRecover` |
| 2 · Home | `ThreeHome` (the three numbers, "Needs you", "Handled for you"), `ThreeMobile` (phone), `Everything` (every feature in plain words) |
| 3 · Coming in | `ThreeIn` → `SellInvoices`, `SellInvoice`, `SellQuotes`, `SellRecurring`, `SellCustomers`, `SellCatalog`, `SellPayments` |
| 4 · Going out | `ThreeOut` → `SpendReceipts`, `SpendEveryMonth`, `SpendTransaction`, `SpendBill`, `SpendVendors`, `SpendPayroll` |
| 5 · Yours to keep | `ThreeKeep` → `BooksReports`, `BooksTax`, `BooksReconcile`, `BooksCategories`, `BooksCurrencies` |
| 6 · Your business | `BizProfile`, `BizTeam`, `BizSecurity` (from the account menu under your initials) |

Every app screen has the same header (search, the New menu, the account menu), a breadcrumb (Home / number / screen) and the three numbers as a small strip, so you always know where you are. Features appear based on what the business sells, where it is and who works in it.

## What's inside

| File | What it is |
|---|---|
| `index.html` | Screen directory |
| `*.dc.html` | One file per screen, in the same `.dc.html` format as the BillingEase design canvas, so they can be copied back and forth |
| `support.js` | A small runtime that renders the `.dc.html` format in a plain browser (holes, `sc-for`, `sc-if`, `dc-import`, state and events) |

Data is in-memory, so it resets when you reload or move to another screen. 

## Design language

"Graphite & Violet": near-black graphite `#18161F` for text and dark sections, soft electric violet `#B9A3FF` for primary actions with graphite text, a violet tint `#EEE8FF` for selected states, and pill-shaped controls. Headlines use Sora and UI text uses DM Sans, both loaded from Google Fonts. Status colors (Paid, Overdue, Unpaid and so on) keep their usual green, red, yellow and blue.

