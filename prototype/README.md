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

## What's inside

| File | What it is |
|---|---|
| `index.html` | Screen directory |
| `*.dc.html` | One file per screen, in the same `.dc.html` format as the BillingEase design canvas, so they can be copied back and forth |
| `Sidebar.dc.html` | Shared app navigation, imported by every app screen |
| `support.js` | A small runtime that renders the `.dc.html` format in a plain browser (holes, `sc-for`, `sc-if`, `dc-import`, state and events) |

Data is in-memory, so it resets when you reload or move to another screen. Areas that aren't designed yet (settings, integrations, most individual reports) show a short "isn't part of this prototype yet" message instead of doing nothing.

## Design language

Wise-inspired: forest green `#163300` for text and dark sections, lime `#9FE870` for primary actions, pill-shaped controls, Inter Tight (heavy, tightly tracked) for headlines and Inter for UI text, loaded from Google Fonts.
