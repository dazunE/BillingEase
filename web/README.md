# BillingEase

Your whole business in three numbers: **Coming in − Going out = Yours to keep.**

BillingEase keeps real double-entry books underneath and shows the owner three numbers, a short "Needs you" list (only what it can't do alone) and a "Handled for you" log. Invoicing, payments, bills, expenses, bank feeds, payroll and reports all live one tap behind one of the numbers.

## Run it locally

Requirements: Node.js 20.9 or newer.

```sh
cd web
npm install
npm run dev
```

Open http://localhost:3000, create an account, and tick **Start with a sample month** during setup to get a realistic month of data to explore.

No database setup is needed: without `DATABASE_URL` the app runs an embedded PostgreSQL (PGlite) stored in `web/.data/`. Delete that folder to start over.

### Using your own PostgreSQL

```sh
DATABASE_URL=postgres://user:pass@localhost:5432/billingease npm run dev
```

Migrations in `drizzle/` run automatically on startup.

## Configuration

| Variable | What it does |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. Unset = embedded PGlite in `.data/pglite`. |
| `PGLITE_DIR` | Where the embedded database lives. `memory://` = throwaway in-memory database. |
| `APP_URL` | Base URL used in emailed pay links (default `http://localhost:3000`). |
| `BILLINGEASE_TODAY` | Pretend today is this date (`YYYY-MM-DD`), for demos and tests. |

## Scripts

| Command | |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (ledger, three numbers, business operations) on an in-memory database |
| `npm run test:e2e` | End-to-end browser test of the whole loop (Playwright) |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |

## How it's built

- **Next.js 16** (App Router, Server Components, Server Actions), **React 19**, **TypeScript**, **Tailwind CSS 4**.
- **PostgreSQL** through **Drizzle ORM** (`src/db/schema.ts`). Money is stored as integer cents.
- **Ledger** (`src/lib/ledger.ts`): every money movement posts a balanced journal entry through `postEntry`. A deferred database trigger (`drizzle/0001_ledger_balance.sql`) also rejects any unbalanced entry at commit, so the books can't drift.
- **Operations** (`src/lib/ops*.ts`): invoices, payments, reminders, bills, expenses, bank import and sorting (with learned merchant rules), payroll approval. Each posts to the ledger and writes to the "Handled for you" log.
- **The three numbers** (`src/lib/numbers.ts`): received/paid come from cash and card accounts in the ledger; expected/still-to-pay come from open invoices, unpaid bills and payroll that hasn't run. A share of profit (the tax rate, 25% by default) is set aside for tax.
- **Accounts**: email and password (bcrypt), sessions in the database with only a hash of the cookie token stored, httpOnly cookie. `src/proxy.ts` redirects signed-out visitors; every page and action re-checks the session on the server.

## Integrations (sandbox until configured)

`src/lib/providers/index.ts` defines the interfaces and sandbox implementations:

| Area | Sandbox behaviour | To go live |
|---|---|---|
| Online payments | Customer pay page at `/i/<token>`. Card `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` is declined. | Implement `PaymentsProvider` with Stripe Connect. |
| Bank and card feeds | "Connect a bank" imports a month of realistic checking and card transactions. | Implement `BankProvider` with Plaid (or TrueLayer/GoCardless outside the US). |
| Payroll | Approving a run posts it to the books on pay day. | Implement `PayrollProvider` with Gusto Embedded or Check. |
| Email | Messages are stored and shown at `/app/outbox` instead of sent. | Replace `sendEmail` in `src/lib/activity.ts` with Postmark, Resend or similar. |
