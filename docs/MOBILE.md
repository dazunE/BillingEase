# BillingEase mobile app: design

The phone app is an **on-the-go companion** to the web app, for iPhone and Android, built with **React Native (Expo)**. It does the jobs people do away from a desk: see the three numbers, send an invoice, snap a receipt, record money in and out, bring in a bank statement, run payroll, and answer what needs them. Reports, tax returns, branding, people and access, and settings beyond the phone's own stay on the web, one tap away.

The clickable design is in [`prototype/`](../prototype) as the `Mobile*.dc.html` screens (390 × 844). They read and write the same sample data as every web screen, so an invoice sent on the phone shows up on the web's invoice list. Open `MobileHome.dc.html` (it starts at the welcome screen), or the "Mobile app" group on the prototype's index.

## Navigation

A tab bar with the equation in it, and one button to add anything:

| Tab | Screen | What it's for |
|---|---|---|
| Home | `MobileHome` | Yours to keep (period switch), Coming in and Going out, four quick actions, *Needs you*, the UK quarter or Sri Lanka month card, recent activity |
| Coming in | `MobileIn` | Invoices by Late / Due / Drafts / Paid, search; tap one to record a payment, remind or share the PDF |
| **+** | sheet in `MobileTabBar` | Scan a receipt and New invoice (large), then record money out, record money in, import a statement, run payroll |
| Going out | `MobileOut` | Budgets shortcut, Spent (with "no receipt" and "needs a category" flags, category picker), Bills (mark paid), Payroll (current run and what it owes) |
| Inbox | `MobileInbox` | *To check*: AI drafts and accountant requests, each approved or dismissed by you. *Updates*: the same list that's sent as push notifications |

The business name and initials on Home open `MobileMe` (switch business, Face ID, notifications, offline). Full-screen flows (invoice, record, scan, import, payroll) hide the tab bar and close back to where you came from.

## Flows

| Flow | Screen | Steps |
|---|---|---|
| First run | `MobileUnlock#welcome` | Sign in with the web account → use Face ID? → notifications (with real examples) → Home |
| Unlock | `MobileUnlock` | Face ID starts by itself; passcode as the fallback |
| Quick invoice | `MobileInvoice` | Who (recent customers first, or add one) → What (tap services from the price list, steppers for quantity, or type a line) → Review (preview with VAT / SSCL worked out, due in 0/7/14/30 days, send by email, WhatsApp or link) → Sent |
| Record money | `MobileRecord#out`, `#in` | Number pad first, then who, a category chip, today/yesterday and how it was paid. Money in can be against an open invoice (prefills the amount) or income without one |
| Scan a receipt | `MobileScan` | Camera finds the edges → reading → the draft (shop, amount, VAT, suggested category with the reason, business-use %) → Save, or Save + next for a pile of receipts. Receipt or bill to pay |
| Import a statement | `MobileImport` | File, share from the banking app, or a photo of a paper statement → lines matched to invoices, new expenses with categories, duplicates and own transfers skipped → add the ticked lines |
| Payroll, Sri Lanka | `MobilePayroll` | Check (overtime per person, EPF/ETF/APIT worked out) → approve with Face ID → mark net pay sent → mark APIT, EPF and ETF paid |
| Payroll, UK | `MobilePayroll` | Record the run from the payroll software (gross per person, PAYE/NI/pension as a sense check) → mark net pay sent → mark HMRC and the pension paid |

## Budgets

Monthly budgets that repeat every month, in `MobileBudgets` (from the Budgets card on Home, or the gauge button in Going out). Four kinds:

| Budget | What counts | Shown as |
|---|---|---|
| Yours to keep goal | Yours to keep this month, after the tax estimate | A goal: on track, behind, reached |
| Coming in target | Money received, with invoices on the way as a lighter part of the bar | A goal: on course counts what's on the way |
| All spending | Going out paid this month, with bills, payroll and every-month costs still due shown hatched | A limit |
| One per category | Expenses in that HMRC or Inland Revenue category this month | A limit: on track, ahead of pace, nearly used (80%), over |

Every bar carries a mark for today (day 11 of 31), so "ahead of pace" means spending faster than the month is passing. Tapping a budget opens a sheet with the limit, September's figure, the month's projected total at this pace, and this month's expenses; suggestions round last month's spending up. Categories with spending but no budget are offered as one-tap ideas.

Alerts, each switchable on the Budgets screen:
- **Push at 80% and when over**: sent by whatever adds spending (recording, scanning, a statement import, a bill marked paid, an expense moved to another category), for the budget it pushes over the line.
- **What's left while recording**: picking a category in Record or on a scanned receipt shows what's left after this expense, amber near the limit and red when it would go over.
- **Weekly summary**: Mondays at 8:00, one notification for every budget. The screen can preview it.

Budgets are stored with the books (`budgets` in the prototype store), so they follow the business to another phone. On the server this is a `budgets` table (business, kind, category, monthly amount) and a scheduled job for the Monday summary; the 80% / 100% check runs after each write that posts an expense.

## The phone's own abilities

| | Design | Expo |
|---|---|---|
| Receipt camera | Edge detection, auto-capture, flash, batch counter; reading done by the existing receipt agent (Gemini), shown as a draft you confirm | `expo-camera`, `expo-image-manipulator`; upload to the API's capture endpoint |
| Statement import | Share sheet target and file picker; parsing reuses the API's statement agent | `expo-document-picker`, share extension (`expo-share-intent`) |
| Push notifications | Six kinds, each switchable: money in, late invoices, payroll, accountant, tax deadlines, drafts to check. Tapping one opens the matching screen | `expo-notifications`; the API sends via Expo push tokens stored per device |
| Face ID / fingerprint | To open the app (lock straight away / 1 min / 5 min) and before anything that marks money as paid out: approving payroll, marking net pay, bills or payroll amounts paid | `expo-local-authentication`, `expo-secure-store` for the session token |
| Offline | Everything you record works without signal. The books update on screen at once; the change waits in an outbox, shown in a banner ("2 changes saved on this phone") and in settings, and syncs when signal returns. Receipt photos taken offline are read once online | `expo-sqlite` outbox, `@react-native-community/netinfo`; each write carries an idempotency key so a retry never doubles it |

In the prototype, *Pretend I'm offline* in `MobileMe` switches the offline mode on, and *Send me a test notification* shows a push banner.

## Visual system

Graphite & Violet, the same as the web: graphite `#18161F`, violet `#B9A3FF` for primary actions, violet ink `#7A5AF8`, orange `#E0752D` for Going out, Sora for figures and headings, DM Sans for everything else, pill-shaped buttons. Mobile adds a dark "hero" card for Yours to keep, 44 px minimum touch targets, 52 px primary buttons, bottom sheets with a grab handle, and semantic tags (late, due, paid, draft, AI draft, waiting to sync). Every token is in [`prototype/mobile.css`](../prototype/mobile.css) and maps 1:1 to a React Native theme object.

Money figures shrink to stay on one line (Rs 3,749,450 fits the half-width tile); small tiles use short forms such as Rs 2.03m.

## How it fits the code

- **API**: the app calls the web app's public address at `/app-api/*`, which forwards only the endpoints in `APP_ENDPOINTS` (`packages/contracts/src/mobile.ts`) to the private API with the internal key. It signs in with the person's own session (kept in the secure store), never a personal access token, and `packages/contracts` gives it typed requests.
- **Shared code**: `packages/core` (money, dates, country rules, invoice tax, payroll) runs unchanged in React Native, so the invoice preview's VAT and SSCL and the payroll figures are worked out the same way as on the web.
- **New API work**: device push tokens, an idempotency key on writes (for the offline outbox), and a receipt upload endpoint that accepts a photo from the camera.
- **Where it is**: [`apps/mobile`](../apps/mobile) (Expo Router). Milestone 1 is built: sign-in, Face ID lock, Home, Coming in, Going out, Inbox, quick invoice and record money in or out. Scan, import, payroll, budgets, push and offline come next. Money in without an invoice needs a new API endpoint first.

## Open questions

1. Should approving payroll on the phone need Face ID **and** the account's second factor, or is Face ID enough?
2. WhatsApp sending: share the PDF through the WhatsApp share sheet (no setup), or the WhatsApp Business API (sent from BillingEase, can show "read")?
3. Offline conflicts: if the same invoice is paid on the web while the phone is offline, the phone's payment is kept as a draft for you to check. Is that right?
4. Several businesses: the switcher lists them all; should notifications from every business arrive, or only the one that's open?
