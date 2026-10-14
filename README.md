# BillingEase

Bookkeeping, invoicing and payroll you enter by hand, for two countries: sole traders and landlords in the **United Kingdom**, and businesses in **Sri Lanka**. Your whole business in three numbers: **Coming in − Going out = Yours to keep.** Your accountant sees the same books.

| Folder | What it is |
|---|---|
| [`apps/web`](apps/web) | The web app: Next.js 16. Pages and server actions; it only talks to the API. |
| [`apps/api`](apps/api) | The API: Fastify 5. Every read and write, the ledger, PDFs, email, files, Ask, background jobs. |
| [`packages/core`](packages/core) | Money, dates, the UK and Sri Lanka rules, invoice tax (VAT, SSCL) and ledger postings. Pure TypeScript with tests. |
| [`packages/db`](packages/db) | PostgreSQL schema (Drizzle), migrations and ledger posting. |
| [`packages/contracts`](packages/contracts) | The API's endpoints as zod schemas, shared by the API and the web app. |
| [`prototype`](prototype) | The clickable design prototype every screen is built from. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How it fits together and the rules every change follows. |

## Run it locally

Needs Node 22.

```sh
npm install
npm run dev
# web app on http://localhost:3000 (the API runs on :4000); Ctrl+C stops both
```

With no `DATABASE_URL`, the API uses an embedded PostgreSQL in `.data/pglite`, so there is nothing else to install. Emails are kept in the `outbox_emails` table instead of being sent until `POSTMARK_TOKEN` is set. Ask needs `ANTHROPIC_API_KEY`. All settings are in [`.env.example`](.env.example).

## Try it locally

1. `npm install`, then `npm run dev` and open http://localhost:3000.
2. **Create an account**, choosing the **United Kingdom** or **Sri Lanka**. Try both: use a second email (or a private window) for the other country.
3. **Set up the business.** Say yes to VAT (and SSCL in Sri Lanka) to see VAT invoices and Tax Invoices.
4. **New → Add a customer**, then **New → New invoice**: two lines, *Save and send*. Download the PDF from the invoice page.
5. On the invoice, **Record a payment** (in Sri Lanka try a cheque, with its number and bank).
6. **New → Record an expense** and **New → Add a bill**; pay the bill in part, then the rest.
7. Back on **Home**, the three numbers have moved (without VAT and SSCL). Try the period switch, search and notifications.
8. **Ask** says it isn't set up until you set `ANTHROPIC_API_KEY` before `npm run dev`.

Emails you send are kept in the database (`outbox_emails`), not sent. To start again from an empty database, stop the app and delete `apps/api/.data/pglite`. To see the app on a fixed date, start it with `BILLINGEASE_TODAY=2026-10-11 npm run dev`.

Automated checks: `npm run typecheck`, `npm test` (unit and API tests) and `npm run test:e2e` (the browser journey in both countries; needs Playwright's Chromium: `npx playwright install chromium`).

## Run it with Docker

```sh
cp .env.example .env   # set API_INTERNAL_KEY at least
docker compose up --build
# open http://localhost:3000
```

This runs PostgreSQL, the API (private, not published) and the web app.

## Checks

```sh
npm run typecheck
npm test
```

## Country rules

Every rate, threshold and date is in `packages/core/src/countries` and marked `verified: false` until it has been checked against gov.uk and ird.gov.lk. See "Facts to verify" in `reports/BillingEase UK MVP spec.html`.
