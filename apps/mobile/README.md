# BillingEase for iPhone and Android

The phone app: Expo (SDK 58) with Expo Router, written in TypeScript. It's the on-the-go companion to the web app. The design is in [`docs/MOBILE.md`](../../docs/MOBILE.md) and the clickable screens in `prototype/Mobile*.dc.html`.

**In this first milestone:** sign in (with two-step codes), pick a business, Face ID lock, Home (the three numbers, Needs you, the UK quarter or Sri Lanka VAT month), Coming in (invoices by status, record a payment, remind, send a draft), Going out (this month's spending, change a category, mark a bill paid), Inbox (notifications), a quick invoice (customer → services → review with VAT and SSCL → send), and Record money out or in with a number pad.

**Later milestones:** receipt scanning, statement import, payroll, budgets, push notifications and working offline.

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

## Checks

```bash
npm --prefix apps/mobile run typecheck
```

```bash
npm --prefix apps/mobile test
```

The unit tests cover the number pad, money formatting, the API client and notification links. The screens were checked by running the web build against a local API in both countries.

## Layout

| Path | What it is |
|---|---|
| `app/` | Screens (Expo Router): `sign-in`, `lock`, `businesses`, `(tabs)/index` Home, `(tabs)/in`, `(tabs)/out`, `(tabs)/inbox`, `invoice`, `record`, `me` |
| `src/lib/` | API client, session and Face ID lock, queries (TanStack Query), money and dates |
| `src/components/` | The shared pieces (buttons, chips, sheets, toasts), icons and the tab bar with its ＋ sheet |
| `src/theme.ts` | Graphite & Violet tokens, the same as the web and the prototype |
