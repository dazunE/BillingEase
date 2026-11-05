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

Fixed codes from `chartOfAccounts` in core: 1000 bank, 1010 cash, 1100 receivable, 1200 VAT to reclaim, 2000 bills owed, 2050 card, 2200 VAT owed, 2210 SSCL owed (Sri Lanka), 3000 money put in, 3100 drawings, 4000 sales, 4100 other income, 4500 rent (UK), 4800 exchange rate gains and losses, 4900 / 6990 to sort, and one expense account per country category (6xxx business, 7xxx UK property).

| Event | Posting (core `posting.*`) |
|---|---|
| Invoice sent | Dr 1100 total · Cr 4000 net · Cr 2200 VAT · Cr 2210 SSCL |
| Credit note | the reverse of an invoice |
| Money received | Dr bank/cash (what arrived) · Cr 1100 (what it cleared at the invoice's rate) · the difference to 4800 |
| Expense paid | Dr category (business share, net of reclaimable VAT) · Dr 1200 VAT · Dr 3100 personal share · Cr bank/cash/card |
| Bill received | Dr categories · Dr 1200 VAT · Cr 2000 |
| Bill paid | Dr 2000 (what it cleared at the bill's rate) · Cr bank/cash/card (what left) · the difference to 4800 |

A draft invoice posts nothing. Voiding a sent invoice reverses its entry.

## Kinds of invoice

New invoice first asks what kind (`/app/in/invoices/new`, then `?type=`). `invoices.billing` records it; credit notes take their invoice's.

- **Items** (`items`, the default): lines of quantity × price, as before.
- **Time and materials** (`time_materials`): each line has a `section`. Time lines carry `work_date` and `person`, with hours as the quantity and the hourly rate as the price. Materials can carry `cost_price` and `markup_bps`; the API then sets the price to cost plus markup (`markedUp` in core) and ignores any price sent. The editor, preview and PDF show a Time and a Materials section, each with a subtotal; the tax and totals work exactly as for items.
- **Fixed price** (`fixed`): the scope (which can run over several lines) and an amount, quantity 1, with no quantity or price columns on the document.
- **Recurring** is the existing repeating invoices (`/app/in/repeating`): the picker links there.

## Other currencies

A business keeps its books in one home currency (GBP, LKR or USD, from its country). Quotes, invoices, credit notes, repeating invoices, bills and expenses can be written in any currency on core's list (`packages/core/src/currencies.ts`), for clients and suppliers abroad. Customers and suppliers can have a usual currency that new documents start in.

- **Rates** are decimal strings (`"0.7912"`: home units per unit of the document's currency), stored as `numeric(22,10)` and converted with BigInt in core's `fx.ts`, never floats. `convertMinor` handles currencies with other decimal places (JPY has none).
- **Where rates come from**: `services/fx.ts` asks the free currency-api (jsDelivr, then Cloudflare) for the document's date, looking back up to four days for weekends and holidays, and caches each in `fx_rates`. The form fills the rate in and the person can change it; when none can be found the API asks for one (`fxRate` field error). `FX_RATES=off` turns lookups off; tests pass fixed rates.
- **What's stored**: invoices, quotes and bills keep their amounts in their own currency (`net`, `vat`, `total`, `paid`…) plus `currency`, `fx_rate` and the same totals in the home currency (`home_net`, `home_total`…). `home_cleared` is how much of `home_total` payments and credit notes have cleared. An expense is paid on the spot, so its `gross` and `vat` are what left the account in the home currency, with the receipt's own `currency`, `original_gross` and rate kept alongside.
- **The ledger is in the home currency only.** An invoice or bill posts its home totals. A payment records what reached (or left) the bank in the home currency (`home_amount`, typed or at the day's rate) and clears its share of the document at the document's rate (`homeCleared` in core: the last payment clears whatever is left, so 1100 and 2000 end at exactly zero). The difference goes to 4800 as an exchange rate gain or loss. A credit note uses its invoice's currency and rate.
- **Reports and the three numbers** use the home amounts: payments as they reached the bank, and what's owed at each document's rate.
- **PDFs** show a foreign document in its currency (written with the code, e.g. "USD 1,250.00") and its totals in the home currency with the rate underneath, so a UK VAT invoice shows the VAT in sterling.
- **Bank statements** match amounts only against invoices and bills in the home currency; a payment for a foreign one is recorded from the invoice or bill.

## People, sign-in and several businesses

One person (`users`) can belong to any number of businesses (`memberships`, with a role in each). Each business keeps its own country, currency, books and settings; a business in another country is a separate business, not a setting.

- **Which business**: the web app keeps the chosen one in the `be_business` cookie and sends it as `X-Business-Id`. With one business it can be left out; with several and none chosen, the API answers `pick_business` and the web app shows `/businesses` (pick one, or add another through `/setup`). The header's business name and the account menu switch between them (`switchBusiness`, which only accepts a business in the person's own list; the API checks membership on every call anyway). A new sign-in clears the cookie.
- **Passwords** are bcrypt hashes in `users.password_hash`, null for someone who has only used Google.
- **Google** (OpenID Connect, authorization code + PKCE). `GET /auth/google` in the web app makes a state, PKCE verifier and nonce, keeps them in the short-lived `be_google` cookie (path `/auth/google`) and sends the person to Google; `/auth/google/callback` checks the state and hands the code to `POST /auth/google`. The API swaps the code with Google's token endpoint using the client secret and checks the ID token's issuer, audience, expiry and nonce (`services/google.ts`; the token comes straight from Google over TLS, so its signature isn't checked separately, per OIDC Core 3.1.3.7). Then: a Google account seen before (`user_identities`, by Google's `sub`) signs in to its person; otherwise a **verified** Google email that matches an account is linked to it; otherwise a new account is made and the person goes on to set up a business. An unverified Google email is refused. The redirect URI is always the web app's callback on its public address (`APP_URL`, else the proxy's `X-Forwarded-Host`, or `GOOGLE_REDIRECT_URI` outright), never the API, which the browser can't reach; the same URI goes to Google on the way out and to the token exchange, and the redirects after it use the public address too, never the container's own host. Google answers `redirect_uri_mismatch` until that exact URI is listed on the OAuth client.
- **Account → Sign-in methods** connects or disconnects Google (`/auth/google?intent=link`, `POST /auth/google/link`, `DELETE /auth/google`) and sets or changes the password. A person always keeps one way in: Google can't be disconnected without a password. One Google account belongs to one person, and a person has at most one.

## Your books: reports, quarters, VAT periods and the year end

Under **Yours to keep** (`/app/keep/*`); the API is `/books/*` (`services/books.ts`).

- **Reports** read the ledger: the profit and loss totals each income and expense account for a date range (on the dates things were invoiced, billed and paid); the balance sheet totals every entry up to a date, with profit to date as part of what the business is worth, so assets − liabilities = equity always. Both download as CSV from the web app.
- **Categories** are the country's expense accounts with their official names, this year's total from the ledger and how many expenses and bill lines are in each, plus what's still to sort.
- **Filing periods** come from `filingPeriods` in core: the UK's MTD quarters, the UK's VAT quarters (calendar quarters, due one month and seven days after; HMRC can set other months), and Sri Lanka's monthly VAT and SSCL periods. Each shows its figures (MTD: income and expenses as on Home, costs by category from the ledger; VAT: output VAT, input VAT and SSCL as on Home's card), readiness checks (every cost categorised, no drafts, a bank statement checked to the period's end) and a state: upcoming, open, closed or sent.
- **Marking a period sent** (`POST /books/locks`, owner or accountant) writes a `locked_periods` row; the database then refuses any entry dated inside it. Only a period that has ended and is one of the business's quarters, VAT periods or tax years can be locked, and once only.
- **Tax and year-end** puts the year's profit and loss, the tax estimate and its payments, the quarters' states and the checks together, and closes the year once it has ended.

## Payroll

`/app/out/payroll`; the API is `/payroll/*` (`routes/payroll.ts`), the rules are `payroll.ts` in core (`PAYROLL_RULES`, marked unverified like the other country figures).

- **Sri Lanka works payroll out.** Each person has a monthly basic pay and fixed allowances (each marked for EPF or not). `lkPay` gives earnings, EPF 8% (employee) and 12% (employer) and ETF 3% on basic plus EPF-liable allowances (overtime left out), APIT from the monthly table with Rs 150,000 tax-free, and net pay. A run's lines are a snapshot, so a payslip never changes.
- **The UK keeps records.** Each run's figures (gross, PAYE, employee and employer NI, employee and employer pension) are typed from the payroll software's summary; BillingEase doesn't calculate payroll or report to HMRC. `ukCheck` is only a rough sense check.
- **Runs** are drafts until approved (owner or accountant). Approving posts one entry on pay day: Dr staff costs (gross + the employer's contributions) · Cr 2300 net pay owed · Cr 2310 payroll tax owed (APIT, or PAYE and both NIs) · Cr 2320 contributions owed (EPF, ETF, pensions). It also lists what's owed in `payroll_dues`: net pay on pay day; in Sri Lanka APIT by the 15th of the next month and EPF and ETF by its last working day; in the UK PAYE, NI and pension by the 22nd after the tax month (6th to 5th). Marking one paid posts Dr the liability · Cr bank (or cash or card).
- **Schedules (Sri Lanka).** An approved run has the EPF C form, ETF, APIT (with the year of assessment's APIT so far per person) and the bank transfer list (`GET /payroll/runs/:id/schedules`), built from each person's NIC, EPF member number and bank fields. The web builds the tables once (`lib/payroll-tables.ts`) for the screen, Copy (CSV) and the download route `/app/out/payroll/[id]/schedules/[kind]`. BillingEase doesn't file them.
- **Year-end.** `/books/year-end` includes `payroll`: each person's approved pay in runs paid in the tax year (gross, APIT or PAYE, EPF/ETF or NI, pension, net) and the total; the page shows it with a CSV at `/app/keep/year-end/payroll`.
- **Check the figures (UK).** On the payroll page and each run, `ukCheck` runs in the browser and is held against a line from the payroll software; it's labelled a check, not payroll.
- **Going out** counts payroll like bills: what was paid in the period, plus what's still owed on runs paid in it, so a run's whole cost lands in its month; due soon includes payroll owed within seven days.

## UK property, mileage and your accountant

- **Properties** (`/app/out/properties`, UK; `/properties`): each home has the owner's share (percent). Rent received and costs paid are `property_entries`, entered at their full amount and posted at the share: rent Dr bank · Cr 4500, a cost Dr its property category (7xxx) · Cr bank. Removing one posts a reversal. Property is kept apart from the three numbers, but the tax estimate includes it: its profit adds to Income Tax (not Class 4 NI), and mortgage interest (`p-finance`) is a 20% reduction (`rules.estimate` with `tradingProfit` and `financeCosts`). Property costs recorded as expenses in Going out count in the property totals too.
- **Mileage** (`/app/out/mileage`, UK; `/mileage`): trips in tenths of a mile at HMRC's flat rate (`tripAmount` in core: cars 45p for the first 10,000 business miles in the tax year, then 25p; motorcycles 24p; bicycles 20p, unverified). Each posts Dr car, van and travel · Cr 3000 money you put in (you paid for the vehicle), and counts in Going out on the trip's date. A trip in a sent period can't be removed.
- **Your accountant** (`/app/accountant`; `/practice`): the accountants with access, invitations still open, requests (the accountant asks, the owner marks done; each notifies the business) and messages. **What they see** (`/app/accountant/view`) is this business as their client: the latest period to file, its checks, totals by category from the ledger, and the requests.

## Your business: people, devices and data

- **People and access** (`/app/settings/people`): the owner invites an accountant (a tax practitioner in Sri Lanka) or an office admin by email (`POST /business/invites`). The `invites` table keeps only a sha256 of the link's token; the link (`/invite/<token>`, 14 days) shows who invited you to what before sign-in, and `POST /invites/:token/accept` adds a membership for whoever is signed in **with the invited email**. A new invitation to the same email cancels the old one. The owner can cancel an invitation or remove anyone but the owner. What each role can do is set by the endpoints' `roles`, not configured per person.
- **Security and data** (`/app/settings/security`): where you're signed in comes from `sessions` (`user_agent`, and `last_seen_at`, written at most every five minutes by `authenticate`); a person can end one session or every other one. The web app sends the browser's user agent to the API so devices can be named. **Take your data out** builds CSVs in the web app from the same list endpoints the screens use (`lib/export.ts`, `toCsv` in core: CRLF, quoted cells, text that would run as a spreadsheet formula kept as text). **Bring your customers in** reads a CSV (`parseCsv` in core) and creates each customer through `POST /customers`, skipping names already there.
- **The bottom island** (`components/app/BottomIsland.tsx`): a dark pill at the foot of every signed-in screen. On Home it lists the six sections; inside one it lists that section's pages with the current one lit, and ← shows the sections again. Its badges come from Home's summary and the AI drafts waiting, fetched once per request (`lib/counts.ts`).

## Branding

A business chooses how its invoices, quotes and credit notes look in **Account → Invoice branding** (owner only): a layout (`classic`, `modern` with a band of colour, or `minimal`), a typeface (DM Sans, Source Serif 4 or JetBrains Mono, bundled from `@fontsource` so PDFs need no network), its colour (`accent`), a footer line, and a logo.

- **Logo**: `PUT /business/logo` takes a PNG or JPEG (base64, up to 1 MB). It must open as an image (pdf-lib embeds it) or it's refused, so it can never break a PDF. The file lives in `Storage`; `businesses.logo_key` points at it and is never sent to the browser (`hasLogo` and `logoVersion` are). The web app proxies it at `/app/settings/branding/logo`.
- **Where it shows**: the PDF (`invoice-pdf.ts`, `brandFor` reads the business and logo when the PDF is drawn), the on-screen preview (`DocPreview` with `brandOf`), and emails about an invoice or quote, which go out as HTML with the logo inline (`cid:logo`), the colour and the footer (`email-html.ts`), alongside the plain-text version. Other emails stay plain text.
- **Logo size** (`logo_size`, 24–96, default 48) is the logo's height in points on the PDF and px on the preview; its width follows the image's shape (up to 3.5 times the height). The business name always sits on its own line below the logo, in every layout (in Modern the band grows to fit).
- **Invoice title** (`title_style`): a VAT-registered business chooses the country's tax title ("VAT invoice", "Tax Invoice") or plain "Invoice" (`invoiceTitle(country, vatRegistered, style)` in core). The VAT details print either way. The title is frozen into the snapshot when an invoice is issued, so changing it never renames one already sent.
- Branding is read live, not frozen into the snapshot: a document downloaded again later shows the current look. The legal content (seller, buyer, tax numbers, VAT summary) is the same in every layout.
- A light brand colour is darkened for text (`readable`), and text on a band of colour is white or ink by contrast, so totals stay readable whatever is picked.

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
- **US businesses** get every agent: dollars, month-first statement dates, checks and ACH, and sales tax kept in what was paid.
- **Ask** is the first agent: read-only tools on this business's books and a fixed list of official sources per country. Answers are labelled as AI and say to check with the accountant.

## The phone app

`apps/mobile` (Expo) reaches the API through the web app at `/app-api/*`, which forwards only the endpoints in `APP_ENDPOINTS` (`packages/contracts/src/mobile.ts`) with the internal key, plus the session token, `X-Business-Id` and `Idempotency-Key`. Anything else is refused before it reaches the API. The app has its own install (it needs React 19.3; the web app is on 19.2), so it isn't in the npm workspace.

- **Idempotency.** Any write may carry an `Idempotency-Key` (8–100 letters, numbers, `-`, `_`). `route()` claims the key in `idempotency_keys` (per person) before running the handler and keeps the answer, so a repeat returns the first answer instead of saving twice; a repeat while the first is still running gets 409 `still_saving`; a failed write releases the key; a key left pending over two minutes (the server stopped mid-way) is tried again. Keys are kept a week. The phone's offline outbox depends on this.
- **Budgets.** `budgets` holds monthly limits (one category, or all spending) and goals (Coming in, Yours to keep), the same every month. `GET /budgets` works them out from the books (`categoryTotals`, `goingOut`, `comingIn`, `threeNumbers`), so they agree with Home and the reports. The `budget-alerts` job checks businesses whose ledger changed in the last few minutes and notifies once per month at 80% and once over; `budget-weekly` sends a Monday 8am summary in the country's time. Settings live in `businesses.settings.budgets`.
- **Push notifications.** Phones register an Expo push token in `push_devices` with the kinds they want. The `deliver-push` job claims new notifications (`notifications.pushed_at`), works out each one's kind from its link (`kindOf`), and sends it through Expo to the phones of the people it's for; tokens Expo reports gone are disabled. Off unless `EXPO_PUSH=on`, like email without Postmark.

## Public API and MCP server

Outside apps (scripts, other software, AI assistants) reach a business's books at the web app's public address: `/v1` (REST), `/mcp` (MCP over Streamable HTTP), `/oauth/*` and `/.well-known/oauth-*`. The web app forwards these to the API (`apps/web/src/lib/forward.ts`) with the internal key, passing only a short list of headers each way and adding CORS. Code is in `apps/api/src/public`.

- **One list, three surfaces.** `V1` in `packages/contracts/src/api.ts` names each operation: an endpoint the web app already uses, its scope and a summary. `/v1` routes, the OpenAPI document (`/v1/openapi.json`, `contracts/src/openapi.ts`) and the MCP tools are all made from it, and run the same handler the web app's route runs (`handlerFor` in `lib/route.ts`). Only `/v1/me` and `POST /v1/proposals` are new handlers.
- **Tokens, never sessions.** Personal access tokens (`be_pat_`, made in Settings → Apps and API) and OAuth tokens (`be_at_` access for an hour, `be_rt_` refresh for 30 days) live in `api_tokens` as sha256 hashes. Each acts for one person in one business; every call re-checks that it isn't revoked or expired, that it was issued for this API (`resource`), and that the person is still a member, using their role now.
- **Scopes**: `books:read` and `books:propose`. There is no scope that writes to the books: `POST /v1/proposals` (and the MCP `propose_*` tools) makes a proposal like an agent's, marked with the app's name, and a person approves it. One token can have at most 200 waiting.
- **OAuth 2.1** for public clients only: authorization code with PKCE (S256), `iss` in the redirect, rotating refresh tokens (reusing one ends the whole grant), revocation. Apps are known by a client ID metadata document (the `client_id` is its https URL; fetched with public addresses only, no redirects, 64 KB, re-read daily) or register themselves (RFC 7591). The consent screen is `/oauth/authorize` in the web app; a bad app or redirect is shown to the person, never followed. Metadata: RFC 9728 protected resource metadata (`/.well-known/oauth-protected-resource/mcp` and `/v1`) and RFC 8414 authorization server metadata. A 401 carries `WWW-Authenticate: Bearer resource_metadata=…`; a missing scope is a 403 with `insufficient_scope`.
- **MCP** is stateless: each POST gets a fresh server, so any instance answers. Tool failures come back as `isError` results with the field-by-field reason, for the model to correct.
- **Limits and log**: per token per minute (`API_RATE_PER_MINUTE`) and per business per day (`API_DAILY_QUOTA`, counted in `api_usage_daily` in one statement). Every REST call and MCP tool call is written to `api_calls` (kept 90 days) and shown in settings. A daily job clears old calls, used codes, dead tokens and registered apps nobody connected.

## Running it

See the root README. `npm install`, then `npm run dev` starts the API on :4000 and the web app on :3000 with an embedded database.
