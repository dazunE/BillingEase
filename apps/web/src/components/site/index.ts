/**
 * Marketing site components. See ./README.md for how to build a page.
 *
 * Layout pieces (used by app/(site)/layout.tsx only): SiteNav, SiteFooter,
 * CookieNotice, SiteCountryProvider, CountryFromUrl.
 */
export {
  // layout and type
  Container,
  Section,
  H1,
  H1_PAGE,
  H2,
  H3,
  // headings and heroes
  PageHero,
  SectionHeading,
  Breadcrumbs,
  // links and buttons
  ArrowIcon,
  MoreLink,
  CtaLink,
  StartFree,
  // features
  IconTile,
  FeatureCard,
  FeatureGrid,
  FeatureRow,
  Tick,
  // closing, pricing, quotes, notes
  CtaBand,
  PlanCard,
  PriceTag,
  IllustrativeQuote,
  RatesNote,
} from "./blocks";
export type { FeatureItem, Tint } from "./blocks";
export { Faq } from "./Faq";
export { CountrySwitch } from "./CountrySwitch";
export { SiteCountryProvider, CountryFromUrl, useSiteCountry } from "./SiteCountry";
export { SiteNav } from "./SiteNav";
export { SiteFooter } from "./SiteFooter";
export { CookieNotice, setConsent } from "./CookieNotice";
export type { ConsentChoice } from "./CookieNotice";
