# BillingEase

Bookkeeping, invoicing and payroll you enter by hand, for two countries: sole traders and landlords in the **United Kingdom**, and businesses in **Sri Lanka**. Your whole business in three numbers: **Coming in − Going out = Yours to keep.** Your accountant sees the same books.

| Folder | What it is |
|---|---|
| [`apps/web`](apps/web) | The web app: Next.js 16. The marketing site (`src/app/(site)`, with a UK / Sri Lanka switch), sign-up and setup, and the app itself (`src/app/app`). It only talks to the API. |
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

With no `DATABASE_URL`, the API uses an embedded PostgreSQL in `.data/pglite`, so there is nothing else to install. Emails are kept in the `outbox_emails` table instead of being sent until `POSTMARK_TOKEN` is set. Ask and the agents need Gemini on Vertex AI (`GOOGLE_CLOUD_PROJECT`, signed in with `gcloud auth application-default login`). All settings are in [`.env.example`](.env.example).

## Try it locally

1. `npm install`, then `npm run dev` and open http://localhost:3000: the marketing site. Use the UK / Sri Lanka switch in the header to see each country's pages, then **Start free**.
2. **Create an account**, choosing the **United Kingdom** or **Sri Lanka**. Try both: use a second email (or a private window) for the other country.
3. **Set up the business.** Say yes to VAT (and SSCL in Sri Lanka) to see VAT invoices and Tax Invoices.
4. **New → Add a customer**, then **New → New invoice**: two lines, *Save and send*. Download the PDF from the invoice page.
   Try a client abroad too: give a customer a *Usual currency* (say US dollars), and their invoice is in dollars with the day's rate filled in (or typed, when it can't be looked up). Record the payment with what reached your bank to see the exchange rate gain or loss.
   Then **Account → Invoice branding**: upload a logo, pick Classic, Modern or Minimal, a colour, a typeface and a footer line, and download the PDF again.
5. On the invoice, **Record a payment** (in Sri Lanka try a cheque, with its number and bank).
6. **New → Record an expense** and **New → Add a bill**; pay the bill in part, then the rest.
7. Back on **Home**, the three numbers have moved (without VAT and SSCL). Try the period switch, search and notifications.
8. **Account → Apps and API**: make a personal access token and call `curl -H "Authorization: Bearer <token>" http://localhost:3000/v1/me`, or add `http://localhost:3000/mcp` as a custom connector in an AI assistant that can reach your machine. What the API offers is at http://localhost:3000/developers.
9. **Ask** says it isn't set up until Vertex AI is: run `gcloud auth application-default login`, then start with `GOOGLE_CLOUD_PROJECT=<your project> npm run dev`. Every question shows in **Account → AI and agents** with its cost; anything an agent drafts waits in **For you to check** until you approve it: snap a receipt, upload a bank statement (any bank's CSV or PDF) or draft reminders for late invoices from there.

**Your books.** Under **Yours to keep**: the UK quarters (mark a closed one as sent and it locks), VAT and SSCL periods, the profit and loss and balance sheet (with CSV downloads), categories, and the tax year end.

**Payroll.** **Going out → Payroll**: in Sri Lanka add people with their basic pay and allowances, and BillingEase works out EPF, ETF, APIT and net pay; approve the run, open a payslip, and mark APIT, EPF and ETF paid. In the UK enter each pay run from your payroll software and mark HMRC and the pension provider paid.

**Property, mileage and your accountant (UK).** Set the business to "Sole trader and landlord" to see **Going out → Properties**: add the flat, its rent and costs (mortgage interest is kept separate). **Mileage** logs trips at 45p a mile. **Your accountant** has their requests, messages and a preview of what they see.

**Getting around and Your business.** The dark island at the foot of every screen lists the sections on Home and, inside a section, its pages. Under **Business → People and access**, invite your accountant by email: the link is in `outbox_emails`; open it in a private window and sign up with that email to accept. **Security and data** lists where you're signed in, imports customers from a CSV and exports invoices, expenses, bills and customers as CSV files.

**Several businesses and Google sign-in.** Open the menu under your initials → **Add a business** to set up a second one (in any of the three countries); then switch between them from the same menu or by clicking the business name in the header. To try **Continue with Google**, create a Google OAuth client with `http://localhost:3000/auth/google/callback` as a redirect URI and start with `GOOGLE_CLIENT_ID=… GOOGLE_CLIENT_SECRET=… npm run dev`; **Account → Security and data → Sign-in methods** connects Google to an existing account or sets a password for a Google-only one.

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
