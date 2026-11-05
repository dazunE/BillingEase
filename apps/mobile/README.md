# BillingEase for iPhone and Android

The phone app: Expo (SDK 58) with Expo Router, written in TypeScript. It's the on-the-go companion to the web app. The design is in [`docs/MOBILE.md`](../../docs/MOBILE.md) and the clickable screens in `prototype/Mobile*.dc.html`.

**What it does:**
- Sign in (with two-step codes), pick a business, Face ID lock.
- Home: the three numbers, Needs you, budgets, the UK quarter or Sri Lanka VAT month.
- Coming in: invoices by status; record a payment, remind, send a draft. Quick invoice with VAT and SSCL worked out by `core`.
- Going out: this month's spending, categories, bills to mark paid. Record money out or in with a number pad.
- Scan a receipt (camera, photos or a PDF): the capture agent reads it and the draft waits in Inbox → To check. Without Vertex AI the expense is filled in by hand and the photo attached.
- Import a bank statement (CSV or PDF) and add the matched and suggested lines.
- Payroll: work out, approve (Face ID) and pay a Sri Lanka month; record a UK month from the payroll software.
- Budgets: category and all-spending limits, Coming in and Yours to keep goals, what's left shown while recording, alerts at 80% and over, a Monday summary.
- Push notifications, by kind; tapping one opens the right screen in the right business.
- Offline: writes made without signal wait on the phone (with a banner) and are sent in order when signal returns, each with an Idempotency-Key so nothing is saved twice. What the screens last showed is kept for a week, so they open without signal. Creating an invoice, importing a statement and running payroll need signal.

## How it reaches BillingEase

The app talks to the web app's public address at `/app-api/*`. The web app forwards only the endpoints listed in `APP_ENDPOINTS` (`packages/contracts/src/mobile.ts`) to the private API, adding the internal key. The app signs in with email and password, keeps the session token in the Keychain or Keystore (`expo-secure-store`), and sends it as a Bearer token with `X-Business-Id`, the same way the web app's server does.

Dates the app sends (an expense, a payment, an invoice) use the books' today from `GET /home`, not the phone's clock, so a phone ahead of the server's time zone never sends tomorrow.

## Run it

This folder has its own install: Expo needs React 19.3 and the web app is on 19.2, so it sits outside the npm workspace. Install the repository root first, because the app reads the shared `contracts` and `core` packages from there.

```bash
npm install
```

```bash
npm install --prefix apps/mobile
```

Start the API and the web app from the root:

```bash
npm run dev
```

Then start the app. Set `EXPO_PUBLIC_API_URL` to the web app's address as your phone sees it; for Expo Go on the same Wi-Fi, use your computer's network address rather than `localhost`.

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/app-api npm --prefix apps/mobile start
```

Scan the QR code with Expo Go, or press `w` to open it in a browser (Face ID is skipped there). Sign in with an account you made on the web.

## Push notifications

Push needs two things:
1. The app's Expo project ID. Run `npx eas init` in `apps/mobile` once; it adds `extra.eas.projectId` to `app.json`. Without it the app says notifications can't be turned on.
2. On the API, `EXPO_PUSH=on` (and `EXPO_ACCESS_TOKEN` if push security is on for the Expo project). Without it, notifications still show in Inbox but aren't pushed.

Notifications only work on a real phone, not a simulator or the web build.

## Checks

```bash
npm --prefix apps/mobile run typecheck
```

```bash
npm --prefix apps/mobile test
```

The unit tests cover the number pad, money formatting, the API client, notification links, expense drafts, budgets and the offline outbox. The screens were checked by running the web build against a local API in both countries.

## Layout

| Path | What it is |
|---|---|
| `app/` | Screens (Expo Router): `sign-in`, `lock`, `businesses`, `(tabs)/index` Home, `(tabs)/in`, `(tabs)/out`, `(tabs)/inbox`, `invoice`, `record`, `me` |
| `src/lib/` | API client, session and Face ID lock, queries (TanStack Query), money and dates |
| `src/components/` | The shared pieces (buttons, chips, sheets, toasts), icons and the tab bar with its ＋ sheet |
| `src/theme.ts` | Graphite & Violet tokens, the same as the web and the prototype |
