# Paywall and billing

How BillingEase charges: four plans, limits on Free, a 30-day Pro trial, and Stripe for payment. The plans and prices people see are in `apps/web/src/content/site/plans.ts`; this document is what the API and the app have to do to make them true.

Status: spec, not built. Nothing in the API checks plans today.

## 1. Plans

Prices are per business, a month when billed yearly (two months free). Month-to-month is 20% more. The first 100 yearly subscribers to Pro or Pro Plus pay the founding price for as long as the subscription runs without a break.

| | Free | Pro | Pro Plus | Practices |
|---|---|---|---|---|
| UK | £0 | £10 (£120/yr, £12 monthly; founding £84/yr) | £20 (£240/yr, £24 monthly; founding £168/yr) | £4 per client (£48 per client a year, from 10 clients) |
| Sri Lanka | Rs 0 | Rs 3,250 (Rs 39,000/yr, Rs 3,900 monthly; founding Rs 27,000/yr) | Rs 6,500 (Rs 78,000/yr, Rs 7,800 monthly; founding Rs 54,000/yr) | Rs 625 per client (Rs 7,500 per client a year, from 10 clients) |

What each plan allows. One key per row; section 3 says where each is checked.

| Key | Free | Pro | Pro Plus | Practice client |
|---|---|---|---|---|
| `invoices_per_month` (invoices issued, not drafts or credit notes) | 10 | ∞ | ∞ | ∞ |
| `attachments_per_month` (expense, bill and statement files) | 20 | ∞ | ∞ | ∞ |
| `receipt_scans_per_month` (capture agent) | 5 | ∞ (fair use) | ∞ (fair use) | ∞ (fair use) |
| `people` (owner and admin memberships; accountants never count) | 1 | 2 | 10 | 2 |
| `accountant_access` (accountant memberships and invites) | no | yes | yes | yes |
| `businesses` covered by one subscription | 1 | 1 | 3 | 1 |
| `mtd` UK quarters, readiness, mark as sent | no | yes | yes | yes |
| `vat` VAT invoices and VAT/SSCL periods; Tax Invoices in Sri Lanka | no | yes | yes | yes |
| `landlord` properties, mileage (UK) | no | yes | yes | yes |
| `recurring` repeating invoices and reminder emails | no | yes | yes | yes |
| `tax_estimate` Income Tax and NI estimate (UK) | no | yes | yes | yes |
| `statements` bank statement import (statements agent) | no | yes | yes | yes |
| `payroll` (Sri Lanka: full payroll; UK: payroll records) | no | 5 employees, then Rs 300 each a month | 25, then Rs 250 each | 5 included |
| `taxwise_handoff` (Sri Lanka) | no | yes | yes | yes |
| `ask` Ask | no | no | yes | no |
| `chaser` reminder-drafting agent | no | no | yes | no |
| `api` personal access tokens, OAuth apps, MCP | no | no | yes | no |
| AI budget a month (`agent_settings` cap, in US dollars) | 0.25 | 3 | 10 | 3 |

Everyone keeps, on every plan: unlimited quotes and customers, recorded payments, expenses and bills (with the attachment limit above), the three numbers, profit and loss and balance sheet, CSV export, invoice branding, and every record ever entered.

**Moving down never deletes anything.** A business on a lower plan can still open and export everything. A feature it no longer has becomes read-only: quarters can be viewed but not marked as sent, repeating invoices stop sending, payroll runs can be viewed but not approved.

**The trial.** A user's first business starts on Pro with `status = trialing` for 30 days, no card. Later businesses start on Free. When the trial ends without a subscription, the business moves to Free. Email the owner at 7 days and 1 day before.

The plan table belongs in `packages/core/src/plans.ts`: limits, features and prices per country. The API reads it to enforce, and the site's `plans.ts` imports its numbers, so the pricing page can never promise something the API doesn't do.

## 2. Data model

Add to `packages/db`:

**`billing_accounts`**: who pays. Either a business owner (pays for Pro or Pro Plus) or a practice (pays per client).
- `id`, `kind` (`owner` | `practice`), `user_id` (the owner, or the accountant who runs the practice), `name`, `country` (sets the currency: GBP or LKR)
- `stripe_customer_id`

**`subscriptions`**: one live row per billing account.
- `id`, `billing_account_id`
- `plan` (`pro` | `plus` | `practice`), `interval` (`month` | `year`), `founding` (bool)
- `status` (`trialing` | `active` | `past_due` | `canceled`)
- `stripe_subscription_id`, `current_period_end`, `cancel_at_period_end`
- `quantity` (clients for a practice, extra employees for Sri Lankan payroll)

**`businesses`** gains:
- `covered_by` (subscription id, nullable). Pro covers 1 business, Pro Plus up to 3 owned by the same user, a practice every client it adds.
- `trial_ends_at` (nullable).

A business's plan is resolved in this order:
1. `covered_by` an active, trialing or past-due-in-grace subscription → that plan.
2. `trial_ends_at` in the future → Pro.
3. Otherwise → Free.

**`stripe_events`**: event id (primary key) and processed time. This makes webhook handling idempotent.

Monthly usage needs no new counters. Count from existing tables for the calendar month in the business's time zone: invoices with `issued_at` in the month, attachments created in the month, and capture runs from `usage_monthly`.

## 3. Enforcement in the API

- **`entitlementsFor(db, businessId)`** returns `{ plan, status, trialEndsAt, limits, features, usage }`. Cache it per request on `ctx`. The web app calls it as `GET /business/plan` to draw badges, meters and upgrade prompts.
- **`requireFeature(ctx, key)`** sits at the top of each gated route's handler, beside the existing `ukOnly` checks. When the plan lacks the feature it throws `AppError(402, "plan_required", "<Feature> is on Pro. Upgrade in Account → Billing.", { plan: "pro" })`.
- **`checkLimit(ctx, key)`** runs inside the same transaction as the insert. It throws `AppError(402, "plan_limit_reached", "Free sends 10 invoices a month. This one would be the 11th…", { limit, used })`. It counts again under the transaction, so two tabs can't both get the 10th slot.
- **Where the checks go:**
  - **Invoices:** issuing an invoice (create-and-send, or sending a draft) → `invoices_per_month`. Saving a draft is never blocked.
  - **Attachments:** attachment upload, capture, statement upload and logo upload → `attachments_per_month`. Logos don't count against the limit; they're only checked for size.
  - **Books routes:** MTD quarter actions → `mtd`. VAT periods → `vat`. Properties and mileage → `landlord`.
  - **Repeating invoices:** creating or resuming one → `recurring`. The recurring job also skips businesses without it.
  - **Payroll:** approving a run → `payroll`. In Sri Lanka, count the employees on the run against what the plan includes. On Pro and Pro Plus, more employees raise the Stripe quantity rather than block the run.
  - **Ask and agents:** Ask → `ask`. Chaser → `chaser`. Statements → `statements`. Capture → `receipt_scans_per_month` on Free.
  - **People:** creating or accepting an invite → `people` and `accountant_access`. Check again when the invite is accepted, because the plan may have changed since it was sent.
  - **Public API:** token creation, OAuth consent and the `/v1` and `/mcp` handlers → `api`. A business that loses Pro Plus has its tokens refused, not deleted.
- **The AI budget:** `budgetFor()` in `agents/platform/runner.ts` uses the plan's cap instead of `config.ai.monthlyBudgetMicros`. An owner may set a lower cap, never a higher one.
- **Reads are never gated.** Only writes and AI calls are.
- **Billing off:** with no `STRIPE_SECRET_KEY` set, `entitlementsFor` returns Pro Plus for every business. Development, tests and demos then work as today, the same way email stays in the outbox without SMTP. Tests for the limits set billing on with a fake Stripe client.

## 4. Stripe

Use a **separate Stripe account for BillingEase** under the same Stripe login as your other business. That keeps the card statement name, payouts, reports and tax records separate.

**Products and prices.** Create each price in the Stripe dashboard with a `lookup_key`. The API resolves the keys at start-up, so no price IDs go into env.

| lookup_key | Price |
|---|---|
| `pro_month_gbp`, `pro_year_gbp`, `pro_year_gbp_founding` | £12 / £120 / £84 |
| `plus_month_gbp`, `plus_year_gbp`, `plus_year_gbp_founding` | £24 / £240 / £168 |
| `practice_year_gbp` | £48 per unit (client), minimum quantity 10 |
| `pro_month_lkr`, `pro_year_lkr`, `pro_year_lkr_founding` | Rs 3,900 / 39,000 / 27,000 |
| `plus_month_lkr`, `plus_year_lkr`, `plus_year_lkr_founding` | Rs 7,800 / 78,000 / 54,000 |
| `practice_year_lkr` | Rs 7,500 per unit, minimum 10 |
| `payroll_extra_pro_lkr_month`, `payroll_extra_plus_lkr_month` | Rs 300 / Rs 250 per employee a month, a second line item whose quantity is updated |

**Upgrading.**
1. `POST /billing/checkout { plan, interval }` (owner only) creates a Checkout Session:
   - `mode: subscription`, the account's `stripe_customer_id` (created on first use from the owner's email), `client_reference_id` = billing account id, and `metadata.business_ids`
   - `automatic_tax` only if BillingEase is VAT-registered (open question 1)
   - `success_url` = `/app/settings/billing?done=1`
   - It returns the URL and the browser goes to it.
2. **Founding price:** if fewer than 100 subscriptions have `founding = true`, a yearly checkout uses the `_founding` price. Count under an advisory lock. Going one or two over in a race is acceptable.
3. A trial still running carries over: pass `subscription_data.trial_end` = `trial_ends_at`, so nobody loses the days they have left.

**Managing.** `POST /billing/portal` opens the Stripe customer portal, which handles cancelling, changing card, invoices and receipts, and moving between Pro and Pro Plus. Configure the portal to allow only those changes. A practice's client count is changed from the practice workbench, not the portal.

**Webhooks.** `POST /billing/webhook` on the API.
- The API isn't public, so the web app forwards this path with the raw body, the way it forwards `/v1`, `/mcp` and `/oauth`.
- Verify `Stripe-Signature` against `STRIPE_WEBHOOK_SECRET` on the raw bytes. Skip any event id already in `stripe_events`. Handle each event in one transaction.

| Event | What it does |
|---|---|
| `checkout.session.completed` | Link the subscription to the billing account; set `covered_by` on the businesses |
| `customer.subscription.created` / `.updated` | Copy plan (from the price's lookup key), interval, status, period end, cancel flag and quantity |
| `customer.subscription.deleted` | Status `canceled`; clear `covered_by`; the businesses fall to Free (or Pro if a trial is still running) |
| `invoice.paid` | Clear any past-due notice |
| `invoice.payment_failed` | Status `past_due`; email the owner. Access continues for a **14-day grace** while Stripe retries; after that the businesses are treated as Free until it's paid |

**Quantities.**
- **Sri Lankan payroll:** when a pay run is approved, set the extra-employee item's quantity to max(0, employees − included), with `proration_behavior: none`. The charge then follows payroll month by month without surprise prorations.
- **Practices:** adding or removing a client updates the quantity, never below 10.

**Env** (API only):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `BILLING_GRACE_DAYS` (14)
- `TRIAL_DAYS` (30)

## 5. The app

- **Account → Billing** shows:
  - the plan
  - trial days left
  - this month's usage against Free's limits, as meters ("7 of 10 invoices")
  - next payment date and amount
  - **Upgrade** (opens Checkout) and **Manage billing** (opens the portal)
  - Only the owner sees the buttons; others see the plan.
- **Upgrade prompts:** a 402 from any action opens one shared sheet. It says what the action needs and the price, and has an Upgrade button. Features the plan lacks stay visible, with a small "Pro" badge, rather than hidden. People should see what they'd get.
- **Home** shows a quiet banner in the last 7 days of a trial, and when payment has failed.
- **Practice workbench:** add clients to the practice plan; shows the client count and the yearly total.

## 6. Order of work

1. `packages/core/src/plans.ts` and `entitlementsFor` with billing off. The site's `plans.ts` imports from core. *No behaviour change yet.*
2. Limits and feature checks on every route in section 3, with tests (billing on, fake Stripe). Then the 402 sheet and Account → Billing in the web app.
3. Stripe in test mode: Checkout, portal, webhooks, founding price, grace period. Use `stripe listen` to forward webhooks locally.
4. **Before going live, try real Sri Lankan cards** on a test Checkout. If they fail, offer yearly invoices paid by bank transfer (Stripe invoices with bank transfer).
5. Go live: switch keys, create the live prices, and announce the founding offer.

## 7. Open questions

1. Is the company selling BillingEase VAT-registered in the UK? That decides whether UK prices include VAT and whether `automatic_tax` is on.
2. Does Sri Lanka tax digital services sold from abroad? Ask an accountant before charging in rupees.
3. A practice's clients get Pro: should their usage count toward the 100 founding seats? (Proposed: no. Founding seats are for owner subscriptions.)
4. Pro Plus covers 3 businesses. If they're in different countries, the subscription's currency is the billing account's country. Allow it, or require one country?
5. One trial per user is proposed. Is that enough protection, or should the trial also be tied to the card or the email domain?
