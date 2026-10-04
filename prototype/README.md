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

## The concept

BillingEase is built around one equation: **Coming in − Going out = Yours to keep.** The app home shows those three numbers, a short "Needs you" list (only what BillingEase can't do on its own) and a "Handled for you" log. Every feature sits one tap behind one of the numbers:

| Screen | File |
|---|---|
| Landing page | `ThreeLanding.dc.html` |
| App home | `ThreeHome.dc.html` |
| Coming in (invoices, getting paid, "Bill someone") | `ThreeIn.dc.html` |
| Going out (sorting charges, bills, payroll, expenses) | `ThreeOut.dc.html` |
| Yours to keep (tax set-aside, safe to spend, reports) | `ThreeKeep.dc.html` |
| Mobile home | `ThreeMobile.dc.html` |

The earlier feature-by-feature screens (labelled v1 on the start page) are still here and are linked from the new screens as "the full books".

## What's inside

| File | What it is |
|---|---|
| `index.html` | Screen directory |
| `*.dc.html` | One file per screen, in the same `.dc.html` format as the BillingEase design canvas, so they can be copied back and forth |
| `Sidebar.dc.html` | Shared app navigation, imported by every app screen |
| `support.js` | A small runtime that renders the `.dc.html` format in a plain browser (holes, `sc-for`, `sc-if`, `dc-import`, state and events) |

Data is in-memory, so it resets when you reload or move to another screen. Areas that aren't designed yet (settings, integrations, most individual reports) show a short "isn't part of this prototype yet" message instead of doing nothing.

## Design language

Option E, "Graphite & Violet": near-black graphite `#18161F` for text and dark sections, soft electric violet `#B9A3FF` for primary actions with graphite text, a violet tint `#EEE8FF` for selected states, and pill-shaped controls. Headlines use Sora and UI text uses DM Sans, both loaded from Google Fonts. Status colors (Paid, Overdue, Unpaid and so on) keep their usual green, red, yellow and blue.

The five color and typography options that were compared are kept under "Theme options" on the start page (`Theme*.dc.html`).
