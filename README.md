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
# API on http://localhost:4000, web app on http://localhost:3000
```

With no `DATABASE_URL`, the API uses an embedded PostgreSQL in `.data/pglite`, so there is nothing else to install. Emails are kept in the `outbox_emails` table instead of being sent until `POSTMARK_TOKEN` is set. Ask needs `ANTHROPIC_API_KEY`. All settings are in [`.env.example`](.env.example).

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
