/**
 * The currencies a quote, invoice, bill or expense can be written in. The books stay in the
 * business's home currency (GBP, LKR or USD); a document in another currency carries the
 * exchange rate that turns it into the home currency.
 *
 * `digits` is the number of minor-unit decimal places (ISO 4217): amounts are stored as an
 * integer of that minor unit, so 1,000 yen is 1000 and 10.50 euros is 1050.
 */
export const CURRENCIES = [
  { code: "GBP", name: "British pound", digits: 2 },
  { code: "LKR", name: "Sri Lankan rupee", digits: 2 },
  { code: "USD", name: "US dollar", digits: 2 },
  { code: "EUR", name: "Euro", digits: 2 },
  { code: "AUD", name: "Australian dollar", digits: 2 },
  { code: "CAD", name: "Canadian dollar", digits: 2 },
  { code: "NZD", name: "New Zealand dollar", digits: 2 },
  { code: "CHF", name: "Swiss franc", digits: 2 },
  { code: "SEK", name: "Swedish krona", digits: 2 },
  { code: "NOK", name: "Norwegian krone", digits: 2 },
  { code: "DKK", name: "Danish krone", digits: 2 },
  { code: "PLN", name: "Polish złoty", digits: 2 },
  { code: "AED", name: "UAE dirham", digits: 2 },
  { code: "SAR", name: "Saudi riyal", digits: 2 },
  { code: "QAR", name: "Qatari riyal", digits: 2 },
  { code: "INR", name: "Indian rupee", digits: 2 },
  { code: "SGD", name: "Singapore dollar", digits: 2 },
  { code: "HKD", name: "Hong Kong dollar", digits: 2 },
  { code: "MYR", name: "Malaysian ringgit", digits: 2 },
  { code: "CNY", name: "Chinese yuan", digits: 2 },
  { code: "JPY", name: "Japanese yen", digits: 0 },
  { code: "KRW", name: "South Korean won", digits: 0 },
  { code: "ZAR", name: "South African rand", digits: 2 },
  { code: "MXN", name: "Mexican peso", digits: 2 },
  { code: "BRL", name: "Brazilian real", digits: 2 },
  { code: "MVR", name: "Maldivian rufiyaa", digits: 2 },
] as const;

export type ListedCurrency = (typeof CURRENCIES)[number]["code"];
export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as unknown as readonly [ListedCurrency, ...ListedCurrency[]];

export function isListedCurrency(code: unknown): code is ListedCurrency {
  return typeof code === "string" && CURRENCIES.some((c) => c.code === code);
}

/** Decimal places of a currency's minor unit. Unknown codes are treated as 2. */
export function currencyDigits(code: string): number {
  return CURRENCIES.find((c) => c.code === code)?.digits ?? 2;
}

export function currencyName(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.name ?? code;
}
