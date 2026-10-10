# BillingEase clickable prototype

A static, clickable prototype of BillingEase as one connected flow: the landing page, sign-up and setup, home with the three numbers, every feature behind them, and your business settings. Every screen reads and writes one shared set of data, so what you do on one screen shows up on the others: send an invoice and it appears in All invoices, on the customer, in search and in the three numbers. The sample is a fictional business, Northwind Studio, on Oct 4, 2026; you can also start as a brand new, empty business.

## Run it locally

The screens load their content with `fetch`, so they need to be served over HTTP (opening the files directly from disk won't work). From the repo root, pick one:

```sh
# Python 3 (nothing to install)
python3 -m http.server 8000 --directory prototype

# or Node
npx serve prototype -l 8000
```

Then open http://localhost:8000/. The index lists every screen; "Start on the landing page" walks the full flow: landing → sign up → business setup → Home.

## Shared data

- `store.js` keeps the data in this browser's localStorage (key `billingease.prototype.v2`) and works out the three numbers (`BE.totals()`).
- `data-*.js` hold the sample month for each area and the helpers that change it (`data-in.js` invoices, payments, customers; `data-sell.js` quotes, repeats, catalog; `data-out.js` expenses, bills, payroll; `data-spend.js` receipts, every-month costs, vendors; `data-books.js` reports, tax, bank; `data-biz.js` profile, team, businesses; `data-home.js` activity, notifications).
- `ThreeHome.dc.html#reset` (also "Reset sample data" in the account menu) brings the sample month back; `ThreeHome.dc.html#start-empty` starts a brand new business. Each business you own keeps its own books when you switch.
- `AppHeader.dc.html` (search, New, notifications, account menu) and `AppCrumbs.dc.html` (breadcrumb and live numbers) are shared by every signed-in screen.

## The flow

BillingEase is built around one equation: **Coming in − Going out = Yours to keep.** The prototype is one connected flow, in the order a new customer meets it:

| Step | Screens |
|---|---|
| 1 · Get started | `ThreeLanding` (landing page) → `AuthSignUp` → `SetupProfile` (what you sell, where, who works in it; sample month or start empty) · `AuthSignIn`, `AuthRecover`, `NotFound` |
| 2 · Home | `ThreeHome` (the three numbers, "Needs you", "Handled for you"), `ThreeMobile` (phone), `Everything` (every feature in plain words), `Notifications`, `Help` |
| 3 · Coming in | `ThreeIn` → `SellInvoices`, `SellInvoice`, `SellQuotes`, `SellQuote`, `SellRecurring`, `SellCustomers`, `SellCustomer`, `SellCatalog`, `SellPayments` |
| 4 · Going out | `ThreeOut` → `SpendReceipts`, `SpendReceipt`, `SpendEveryMonth`, `SpendTransaction`, `SpendBill`, `SpendVendors`, `SpendVendor`, `SpendPayroll` |
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

