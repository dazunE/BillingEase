import { lk } from "./lk";
import { uk } from "./uk";
import type { CountryCode, CountryRules } from "./types";

export * from "./types";
export { uk, lk };

const RULES: Record<CountryCode, CountryRules> = { uk, lk };

export function rulesFor(country: CountryCode): CountryRules {
  const r = RULES[country];
  if (!r) throw new Error(`Unknown country: ${country}`);
  return r;
}

export function isCountryCode(x: unknown): x is CountryCode {
  return x === "uk" || x === "lk";
}

export function categoryById(country: CountryCode, id: string) {
  return rulesFor(country).categories.find((c) => c.id === id) ?? null;
}

export function vatRateById(country: CountryCode, id: string) {
  return rulesFor(country).vatRates.find((r) => r.id === id) ?? null;
}
