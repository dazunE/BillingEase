/**
 * The marketing site map. The nav, the footer and every "more about" link
 * import from here, so a page only ever moves in one place.
 *
 *   import { ROUTES, NAV } from "@/content/site/routes";
 *   const { label } = routeText(ROUTES.pricing, country);
 *   <Link href={ROUTES.pricing.href}>{label}</Link>
 *
 * `label` and `hint` (the one-line description shown in menus) may differ
 * by country (`{ uk, lk }`); resolve them with `routeText(route, country)`.
 */
import { pick, type Copy, type SiteCountry } from "./country";

/** Menu icon tones: violet tint, orange tint, dark, grey. */
export type IconTone = "violet" | "orange" | "dark" | "grey";

export type SiteRoute = {
  href: string;
  /** Link text; may differ by country. */
  label: Copy;
  hint: Copy;
  /** 24×24 stroke path for menus. */
  icon: string;
  tone: IconTone;
};

const I = {
  features: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 16.5h7M16.5 13v7",
  in: "M12 4v11M7 10l5 5 5-5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4",
  out: "M12 20V9M7 14l5-5 5 5M4 5h16",
  keep: "M7 4h10M8 4v2a4 4 0 0 0-3 4v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a4 4 0 0 0-3-4V4M9 14h6",
  security: "M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6zM9 12l2 2 4-4",
  changelog: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z",
  soleTrader: "M4 5h16v11H4zM2 19h20M12 16v3",
  landlord: "M3 11 12 4l9 7M5 10v10h14V10M10 20v-5h4v5",
  smallBiz: "M4 9h16l-1.5-5h-13zM5 9v11h14V9M9 20v-6h6v6",
  accountants: "M3 7h18v12H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18",
  countries: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3",
  pricing: "M20 12l-8 8-9-9V3h8zM7.5 7.5h.01",
  guides: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7M8 11h5",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01",
  switch: "M4 8h13l-3-3M20 16H7l3 3",
  about: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  careers: "M12 3v4M5 8l2.5 2.5M19 8l-2.5 2.5M4 21h16M7 21v-4a5 5 0 0 1 10 0v4",
  press: "M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5M8 16h3",
  contact: "M4 5h16v11H8l-4 4zM8 9h8M8 12h5",
  legal: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
};

export const ROUTES = {
  home: { href: "/", label: "Home", hint: "Your whole business in three numbers", icon: I.features, tone: "violet" },
  features: { href: "/features", label: "Features", hint: "Everything, around three numbers", icon: I.features, tone: "violet" },
  comingIn: { href: "/coming-in", label: "Coming in", hint: "Invoices, quotes, payments you record", icon: I.in, tone: "violet" },
  goingOut: {
    href: "/going-out",
    label: "Going out",
    hint: { uk: "Expenses, bills, suppliers, payroll records", lk: "Expenses, bills, suppliers, payroll" },
    icon: I.out,
    tone: "orange",
  },
  yoursToKeep: {
    href: "/yours-to-keep",
    label: "Yours to keep",
    hint: { uk: "Profit after tax, MTD quarters, reports", lk: "Profit after tax, VAT and SSCL, reports" },
    icon: I.keep,
    tone: "dark",
  },
  security: { href: "/security", label: "Security", hint: "How we keep your books safe", icon: I.security, tone: "grey" },
  changelog: { href: "/changelog", label: "What’s new", hint: "Every update, in plain words", icon: I.changelog, tone: "violet" },

  soleTraders: {
    href: "/for/sole-traders",
    label: "Sole traders",
    hint: { uk: "Ready for Making Tax Digital", lk: "Sole proprietors and freelancers" },
    icon: I.soleTrader,
    tone: "violet",
  },
  landlords: {
    href: "/for/landlords",
    label: "Landlords",
    hint: { uk: "Properties, rent and mortgage interest", lk: "Rent as income, kept tidy" },
    icon: I.landlord,
    tone: "orange",
  },
  smallBusinesses: {
    href: "/for/small-businesses",
    label: "Small businesses",
    hint: { uk: "Invoices, VAT and payroll records", lk: "Tax Invoices, VAT, SSCL and payroll" },
    icon: I.smallBiz,
    tone: "violet",
  },
  accountants: {
    href: "/accountants",
    label: { uk: "Accountants", lk: "Tax practitioners" },
    hint: { uk: "See every client’s books in one place", lk: "Client books and the TaxWise.lk hand-off" },
    icon: I.accountants,
    tone: "grey",
  },
  countries: { href: "/countries", label: "UK and Sri Lanka", hint: "What changes with your country", icon: I.countries, tone: "orange" },

  pricing: { href: "/pricing", label: "Pricing", hint: { uk: "Plans in pounds", lk: "Plans in rupees" }, icon: I.pricing, tone: "violet" },
  switch: { href: "/switch", label: "Switch to BillingEase", hint: "From spreadsheets or another tool", icon: I.switch, tone: "orange" },

  guides: { href: "/guides", label: "Guides", hint: { uk: "MTD, VAT and tax dates, explained", lk: "VAT, SSCL, EPF and ETF, explained" }, icon: I.guides, tone: "violet" },
  help: { href: "/help", label: "Help centre", hint: "Answers, and a person when you need one", icon: I.help, tone: "grey" },
  developers: { href: "/developers", label: "Developers", hint: "Connect an AI assistant, or call the API", icon: I.features, tone: "dark" },

  about: { href: "/about", label: "About", hint: "Why we built BillingEase", icon: I.about, tone: "violet" },
  careers: { href: "/careers", label: "Careers", hint: "Work with us", icon: I.careers, tone: "orange" },
  press: { href: "/press", label: "Press", hint: "News and brand kit", icon: I.press, tone: "grey" },
  contact: { href: "/contact", label: "Contact", hint: "For practices, teams and questions", icon: I.contact, tone: "violet" },

  terms: { href: "/legal/terms", label: "Terms", hint: "The agreement between us", icon: I.legal, tone: "grey" },
  privacy: { href: "/legal/privacy", label: "Privacy", hint: "What we keep and why", icon: I.legal, tone: "grey" },
  cookies: { href: "/legal/cookies", label: "Cookies", hint: "The few cookies we use", icon: I.legal, tone: "grey" },
  dataProcessing: { href: "/legal/data-processing", label: "Data processing", hint: "For accountants and practices", icon: I.legal, tone: "grey" },

  signIn: { href: "/sign-in", label: "Sign in", hint: "Back to your books", icon: I.user, tone: "grey" },
  /** Use signUpHref(country) for the real link; this is the bare path. */
  signUp: { href: "/sign-up", label: "Start free", hint: "No card needed", icon: I.user, tone: "violet" },
} satisfies Record<string, SiteRoute>;

export type RouteKey = keyof typeof ROUTES;

/** A route's label and hint for a country. */
export function routeText(r: SiteRoute, country: SiteCountry): { label: string; hint: string } {
  return { label: pick(r.label, country), hint: pick(r.hint, country) };
}

/** Guides: `/guides/[slug]`. Legal documents: `/legal/[doc]`. */
export const guideHref = (slug: string) => `/guides/${slug}`;
export const LEGAL_DOCS = ["terms", "privacy", "cookies", "data-processing"] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];
export const legalHref = (doc: LegalDoc) => `/legal/${doc}`;

export type NavGroup = { label: string; items: SiteRoute[] } | { label: string; href: string; route: SiteRoute };

/** The header menus, in order. A group with `items` is a dropdown; one with `href` is a plain link. */
export const NAV: NavGroup[] = [
  { label: "Product", items: [ROUTES.features, ROUTES.comingIn, ROUTES.goingOut, ROUTES.yoursToKeep, ROUTES.security, ROUTES.changelog] },
  { label: "Who it’s for", items: [ROUTES.soleTraders, ROUTES.landlords, ROUTES.smallBusinesses, ROUTES.accountants, ROUTES.countries] },
  { label: "Pricing", href: ROUTES.pricing.href, route: ROUTES.pricing },
  { label: "Resources", items: [ROUTES.guides, ROUTES.help, ROUTES.switch] },
  { label: "Company", items: [ROUTES.about, ROUTES.careers, ROUTES.press, ROUTES.contact] },
];

/** The footer columns. */
export const FOOTER: { label: string; items: SiteRoute[] }[] = [
  { label: "Product", items: [ROUTES.features, ROUTES.comingIn, ROUTES.goingOut, ROUTES.yoursToKeep, ROUTES.security, ROUTES.changelog] },
  { label: "Who it’s for", items: [ROUTES.soleTraders, ROUTES.landlords, ROUTES.smallBusinesses, ROUTES.accountants, ROUTES.countries] },
  { label: "Pricing", items: [ROUTES.pricing, ROUTES.switch, ROUTES.signUp, ROUTES.signIn] },
  { label: "Resources", items: [ROUTES.guides, ROUTES.help, ROUTES.developers] },
  { label: "Company", items: [ROUTES.about, ROUTES.careers, ROUTES.press, ROUTES.contact] },
];

export const LEGAL_LINKS: SiteRoute[] = [ROUTES.terms, ROUTES.privacy, ROUTES.cookies, ROUTES.dataProcessing];
