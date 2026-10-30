# BillingEase architecture

Manual-entry bookkeeping, invoicing and payroll for two countries: the **United Kingdom** (sole traders and landlords, MTD quarters, VAT) and **Sri Lanka** (Tax Invoices with VAT and SSCL, full payroll). A business has one country, fixed at sign-up.

## Shape

```
apps/web            Next.js 16 – pages and server actions only. Never touches the database.
apps/api            Fastify 5 – every read and write, auth, PDFs, email, files, Ask, background jobs.
packages/core       Pure TypeScript: money, dates, the country rules, invoice tax, ledger postings.
packages/db         Drizzle schema, migrations, database client, ledger posting.
packages/contracts  zod schemas for every endpoint: Fastify validates with them, the web gets types.
prototype/          The clickable prototype (the design reference for every screen).
```

The browser only talks to Next.js. Next.js server components and server actions call the API with the user's session token (`Authorization: Bearer`) and business (`X-Business-Id`), plus `X-Internal-Key` in production. The API can therefore stay on a private network.

## Rules that hold everywhere

- **Money** is an integer number of minor units (pence, cents) in TypeScript and `bigint` in Postgres. Rates are basis points. Never floats.
- **Dates** are ISO `YYYY-MM-DD` strings. `today()` from core reads `BILLINGEASE_TODAY` when set (tests, demos).
- **Country rules** live only in `packages/core/src/countries`. Screens and routes ask `rulesFor(country)`; nothing hard-codes a rate. Every figure is marked `verified: false` until checked against gov.uk / ird.gov.lk.
- **The ledger** is double entry and append-only. Every money movement is a `postEntry` with lines built by `posting.*` in core. Corrections post a reversal (`reverseEntry`) and a new entry. The database enforces: entries balance, lines can't be edited or deleted, accounts belong to the business, and nothing is posted into a filed (locked) period.
- **Tenancy**: every table has `business_id`. Every query in a handler filters by `ctx.business.id`. Fetching a row by id without that filter is a bug.
- **Contracts first**: add the endpoint to `packages/contracts`, then `route(app, endpoint, handler)` in the API. Responses are parsed through the contract, so extra columns never leak.
- **Errors** come back as `{ error: { code, message, fields? } }` in plain words a user can act on.
- **Activity**: anything a person would want to see later ("Invoice SDS-0220 sent to Kandyan Spice Co") is logged with `logActivity`.

## The three numbers

Coming in − Going out = Yours to keep, for the period on screen (UK: this quarter or tax year; Sri Lanka: this month or year of assessment; `periodsFor` in core).

- **Coming in** = money received in the period (receipts) + what's still owed on invoices issued in the period, both **without VAT and SSCL** (each payment is split in its invoice's proportions): that money belongs to the tax office. Late = the full amount owed and past due, from any period.
- **Going out** = money paid in the period (the business share of expenses, and bill payments) + what's still owed on bills dated in the period, both **without reclaimable VAT**.
- **Yours to keep** = Coming in − Going out − the share of the year's tax estimate (`rules.estimate`) for the period.

`apps/api/src/services/summary.ts` computes these; Home, Coming in and Going out all use it so the numbers agree.

## Ledger accounts

Fixed codes from `chartOfAccounts` in core: 1000 bank, 1010 cash, 1100 receivable, 1200 VAT to reclaim, 2000 bills owed, 2050 card, 2200 VAT owed, 2210 SSCL owed (Sri Lanka), 3000 money put in, 3100 drawings, 4000 sales, 4100 other income, 4500 rent (UK), 4900 / 6990 to sort, and one expense account per country category (6xxx business, 7xxx UK property).

| Event | Posting (core `posting.*`) |
|---|---|
| Invoice sent | Dr 1100 total · Cr 4000 net · Cr 2200 VAT · Cr 2210 SSCL |
| Credit note | the reverse of an invoice |
| Money received | Dr bank/cash · Cr 1100 |
| Expense paid | Dr category (business share, net of reclaimable VAT) · Dr 1200 VAT · Dr 3100 personal share · Cr bank/cash/card |
| Bill received | Dr categories · Dr 1200 VAT · Cr 2000 |
| Bill paid | Dr 2000 · Cr bank/cash/card |

A draft invoice posts nothing. Voiding a sent invoice reverses its entry.

## Background jobs

`apps/api/src/jobs.ts` runs jobs on timers in the API process: email delivery, repeating invoices, and the agent queue. Each job claims rows in the database, so it is safe to run on more than one instance. Agent work goes in the `jobs` table (`agents/platform/queue.ts`): claimed with `FOR UPDATE SKIP LOCKED`, retried with back-off, deduplicated per business and agent, and requeued if a worker dies.

## Email, files, Ask

- **Email** is queued in `outbox_emails` inside the transaction that caused it and delivered after commit. Without `POSTMARK_TOKEN` it is kept, never sent.
- **Files** (attachments) go through the `Storage` interface: local disk now, S3-compatible later.
- **AI** runs on Gemini through Vertex AI, with agents built on Google's Agent Development Kit (`@google/adk`, pinned). Everything ADK touches sits in `apps/api/src/agents/platform`:
  - `models.ts`: a model per tier (`deep`, `fast`, `lite`), set in config because Google retires versions; tests pass a scripted model.
  - `runner.ts`: runs one agent for one business, records the run (`agent_runs`), writes every model and tool call to `agent_steps` through an ADK plugin, and stops at the business's monthly budget.
  - `session-service.ts`: ADK sessions in our Postgres (`agent_sessions`, `agent_events`), scoped to one business.
  - `proposals.ts`: agents never change the books. They make proposals (the body of an existing endpoint); approving one calls that endpoint as the person approving, so validation, roles, locked periods and the ledger apply as for a person's own entry. Database triggers keep proposals final once decided and agent history append-only.
- **Capture** (`agents/capture.ts`) reads a photo or PDF sent to `POST /capture`. The file is kept as a `capture` attachment and read in the background (queue `capture`) on the fast tier with a fixed output schema. `checkReading` (plain code, unit tested) turns the reading into an `expense.create` or `bill.create` proposal: amounts to minor units, VAT only for VAT-registered businesses, SSCL as part of the cost in Sri Lanka, payment method and category from the country's lists, a lower confidence for an unreadable or future date, a possible duplicate, or lines that don't add up (it asks the model to look once more first). Approving moves the file onto the new expense or bill.
- **Bank statements** (`agents/statements`): the owner uploads any bank's CSV or PDF (`POST /statements`); it is not a feed. CSVs are read by our own code (`csv.ts`: delimiter, header row, column names, date order, signs, DR/CR, opening balance); only when no header is recognised does the model map the columns from a sample. PDFs are read by the model. Running balances are checked. `match.ts` (plain code) matches lines to invoices still owed (by number, then amount and name), bills, and receipts, payments and expenses already recorded; then categories come from saved suppliers and earlier expenses, and only what's left goes to the model in batches. Lines become `receipt.create`, `bill_payment.create` or `expense.create` proposals; transfers, tax and loans are left out with a reason. Lines imported before are skipped. Approving marks the line matched.
- **Chaser** (`agents/chaser.ts`): every six hours, businesses with invoices past due and not reminded in seven days get one run a day (or on demand). The model drafts the reminders; a draft that doesn't state the invoice number and amount exactly is replaced by the standard wording. Each is an `invoice.remind` proposal: by email, or a WhatsApp message in Sri Lanka when there's no email.
- **Proposal kinds** with a target (`proposals.target_id`) call endpoints on an invoice or bill: record a payment, pay a bill, send a reminder. `POST /proposals/approve-many` approves several as they stand.
- **Ask** is the first agent: read-only tools on this business's books and a fixed list of official sources per country. Answers are labelled as AI and say to check with the accountant.

## Running it

See the root README. `npm install`, then `npm run dev` starts the API on :4000 and the web app on :3000 with an embedded database.
