import { lk } from "./lk";
import { uk } from "./uk";
import { us } from "./us";
import { COUNTRY_CODES, type CountryCode, type CountryRules } from "./types";

export * from "./types";
export { uk, lk, us };

const RULES: Record<CountryCode, CountryRules> = { uk, lk, us };

export function rulesFor(country: CountryCode): CountryRules {
  const r = RULES[country];
  if (!r) throw new Error(`Unknown country: ${country}`);
  return r;
}

export function isCountryCode(x: unknown): x is CountryCode {
  return COUNTRY_CODES.includes(x as CountryCode);
}

export function categoryById(country: CountryCode, id: string) {
  return rulesFor(country).categories.find((c) => c.id === id) ?? null;
}

export function vatRateById(country: CountryCode, id: string) {
  return rulesFor(country).vatRates.find((r) => r.id === id) ?? null;
}
