/**
 * The marketing site's two countries, shared by server and client code.
 * (Server components read the visitor's country with `getSiteCountry()` from
 * `@/lib/site-country`; client components with `useSiteCountry()` from
 * `@/components/site`.) Nothing in here touches cookies or headers.
 */

export type SiteCountry = "uk" | "lk";

export const SITE_COUNTRIES: SiteCountry[] = ["uk", "lk"];
export const DEFAULT_SITE_COUNTRY: SiteCountry = "uk";

/** Cookie that remembers the visitor's choice (set by <CountrySwitch/>, read by getSiteCountry()). */
export const SITE_COUNTRY_COOKIE = "be_site_country";
/** Cookie that remembers the cookie-notice choice: "necessary" or "all". */
export const SITE_CONSENT_COOKIE = "be_cookies";

export const COUNTRY_META: Record<SiteCountry, { name: string; short: string; sym: string; currency: string; taxYear: string; yearWord: string }> = {
  uk: { name: "United Kingdom", short: "UK", sym: "£", currency: "pounds", taxYear: "6 April to 5 April", yearWord: "tax year" },
  lk: { name: "Sri Lanka", short: "Sri Lanka", sym: "Rs", currency: "rupees", taxYear: "1 April to 31 March", yearWord: "year of assessment" },
};

export function isSiteCountry(v: unknown): v is SiteCountry {
  return v === "uk" || v === "lk";
}

/** Copy that differs by country is written `{ uk: …, lk: … }`; copy that doesn't is just the value. */
export type ByCountry<T> = { uk: T; lk: T };
export type Copy<T = string> = T | ByCountry<T>;

function isByCountry<T>(v: Copy<T>): v is ByCountry<T> {
  return typeof v === "object" && v !== null && !Array.isArray(v) && "uk" in v && "lk" in v;
}

/** The value for a country: `pick({ uk: "£", lk: "Rs" }, "lk")` → "Rs"; `pick("Same everywhere", c)` → "Same everywhere". */
export function pick<T>(v: Copy<T>, country: SiteCountry): T {
  return isByCountry(v) ? v[country] : v;
}

/** Whole amounts in the country's currency: £12,400 or Rs 1,240,000. Negative numbers get a proper minus. */
export function money(v: number, country: SiteCountry): string {
  const n = Math.round(Math.abs(v)).toLocaleString("en-GB");
  const sign = v < 0 ? "−" : "";
  return country === "lk" ? `${sign}Rs ${n}` : `${sign}£${n}`;
}

/** Where every "Start free" button goes. */
export function signUpHref(country: SiteCountry): string {
  return `/sign-up?country=${country}`;
}
