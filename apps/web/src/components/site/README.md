# Marketing site components

Every page under `src/app/(site)/` gets the nav, footer (with its "See your three numbers" band) and cookie notice from `app/(site)/layout.tsx`. The layout already renders `<main id="main">`, so a page returns sections, not `<main>`. The app (`/app/**`, `/setup`) and the auth pages (`(auth)`) are outside the group and never get the site chrome.

## A page in five steps

```tsx
// src/app/(site)/for/landlords/page.tsx
import type { Metadata } from "next";
import { CtaBand, FeatureGrid, FeatureRow, Faq, PageHero, Section, SectionHeading, StartFree, CtaLink, RatesNote } from "@/components/site";
import { pick, signUpHref } from "@/content/site/country";
import { ROUTES } from "@/content/site/routes";
import { getSiteCountry } from "@/lib/site-country";

// 1. Metadata: title (the root layout adds " · BillingEase") and a description.
export const metadata: Metadata = {
  title: "For landlords",
  description: "Rent and costs per property, mortgage interest kept apart, every MTD quarter ready for your accountant.",
};

// 2. Country copy lives in a content file, written { uk, lk } where it differs.
const COPY = {
  lead: { uk: "One flat or several, ready for Making Tax Digital.", lk: "Rent recorded as income, kept tidy for your return." },
};

export default async function Page({ searchParams }: PageProps<"/for/landlords">) {
  // 3. The visitor's country: ?country=uk|lk, else the be_site_country cookie, else "uk".
  const country = await getSiteCountry(searchParams);

  return (
    <>
      {/* 4. Build from the blocks */}
      <PageHero
        kicker="For landlords"
        title="Your properties in three numbers."
        lead={pick(COPY.lead, country)}
        actions={<StartFree country={country} size="lg" />}
        note="Free to start. No card needed."
        art={<MyIllustration aria-hidden />}
      />
      <Section tone="white" labelledBy="how-h">
        <SectionHeading id="how-h" title="How it works" lead="…" />
        <FeatureGrid items={[{ icon: "M3 11 12 4l9 7", title: "Properties", body: "…" }]} />
      </Section>
      <Section labelledBy="faq-h" innerClassName="flex-row! flex-wrap gap-x-16">
        <SectionHeading id="faq-h" title="Fair questions" />
        <Faq items={[{ q: "…", a: "…" }]} />
      </Section>
      <CtaBand title="See your three numbers by tonight." primary={{ label: "Start free", href: signUpHref(country) }} secondary={{ label: "See pricing", href: ROUTES.pricing.href }} />
    </>
  );
}
```

5. Check it at 1440 and 390 in both countries (`?country=uk`, `?country=lk`).

Put a long page's copy in `src/content/site/<page>.ts` (ask the owner of `content/site/**` if you need a shared file changed). Links always come from `ROUTES` in `@/content/site/routes`; "Start free" is always `signUpHref(country)` (`/sign-up?country=uk|lk`).

## Country

| Where | How |
|---|---|
| Server component (pages) | `const country = await getSiteCountry(searchParams)` from `@/lib/site-country` |
| Client component | `const { country, setCountry } = useSiteCountry()` from `@/components/site` |
| Copy | `pick({ uk: "…", lk: "…" }, country)` from `@/content/site/country` (plain strings pass through) |
| Money | `money(12400, "uk")` → `£12,400`, `money(2040000, "lk")` → `Rs 2,040,000` |
| Facts | `COUNTRY_META[country]`: `name`, `short`, `sym` (£ / Rs), `currency`, `taxYear`, `yearWord` |
| Switch | `<CountrySwitch />` (segmented), `variant="menu"` (header), `tone="dark"`, `short` |

The switch sets the `be_site_country` cookie and refreshes, so server components re-render. Never claim anything in the "Not offered" list of the site brief (bank feeds, card payments, multi-currency, stock, time tracking, US, filing to HMRC/IRD). Receipt reading exists (Capture), always as a draft the owner approves: say so whenever it is mentioned. Wherever a tax rate appears, add `<RatesNote country={country} />`.

## Blocks (`@/components/site`)

| Component | What it is | Key props |
|---|---|---|
| `Container` | The 1200px column with side padding | `className` |
| `Section` | Full-width band with the standard vertical rhythm | `tone` plain / white / dark, `labelledBy`, `id`, `innerClassName` |
| `PageHero` | Page top: crumbs, kicker, h1, lead, actions, art slot | `title`, `lead`, `kicker`, `actions`, `note`, `art`, `crumbs`, `align` left / center |
| `SectionHeading` | h2 (or h3) with kicker, lead, "more" link and a right-hand `aside` | `id`, `title`, `lead`, `kicker`, `more`, `aside`, `as`, `tone` |
| `FeatureCard` / `FeatureGrid` | Icon tile + title + body cards; linked when `href` is set | `items: FeatureItem[]`, `min` column px, `surface` white / grey |
| `FeatureRow` | Text beside an illustration; alternate with `reverse` | `title`, `body`, `bullets`, `more`, `art`, `kicker`, `reverse` |
| `CtaBand` | The dark rounded closing band | `title`, `lead`, `kicker`, `primary`, `secondary`, `art` |
| `Faq` | Accessible disclosure list, one open at a time (client) | `items: { q, a }[]`, `defaultOpen` |
| `PlanCard` | Plan with swinging price tag; plans from `@/content/site/plans` | `plan`, `country`, `index` |
| `IllustrativeQuote` | Quote card always labelled "Illustrative" (we have no real customer quotes) | `quote`, `name`, `role`, `note`, `tint` |
| `Breadcrumbs` | For guides, help and legal pages; last item is the current page | `items: { label, href? }[]` |
| `CtaLink` / `StartFree` / `MoreLink` | Pill link button; country "Start free"; underlined arrow link | `variant`, `size`, `arrow`; `country` |
| `IconTile`, `Tick`, `ArrowIcon`, `PriceTag` | Small pieces | |
| `RatesNote` | "Rates are illustrative, checked against gov.uk / ird.gov.lk before launch" | `country` |
| `H1`, `H1_PAGE`, `H2`, `H3` | Heading class strings | |

Illustrations: the cash jar is `@/components/CashJar` (pass `sym={COUNTRY_META[country].sym}`); the home page scenes are in `@/components/landing/Illustrations`. Decorative SVGs get `aria-hidden`; animations stop under `prefers-reduced-motion` (globally in `globals.css`).

Shared content: `routes.ts` (site map, nav, footer), `country.ts`, `plans.ts` (placeholder prices + `PRICE_NOTE`), `company.ts` (emails only, no invented facts), `samples.ts` (sample businesses), `home.ts`.
