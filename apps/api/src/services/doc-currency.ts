import { describeRate, formatDate, formatMoney, parseRate, type Rate } from "@billingease/core";
import type { Exec } from "@billingease/db";
import type { BusinessRow } from "../lib/context";
import { badRequest } from "../lib/errors";
import type { Services } from "./index";

/**
 * Quotes, invoices, bills and expenses can be written in any listed currency; the books stay in
 * the business's home currency. These helpers pick a document's currency and its rate.
 */

/** The document's currency: what was asked for, else the customer's or supplier's, else home. */
export function pickCurrency(b: Pick<BusinessRow, "currency">, requested?: string | null, partyDefault?: string | null): string {
  return requested || partyDefault || b.currency;
}

/**
 * The rate from `currency` to home on `day`: 1 for the home currency, the rate given, or the one
 * the rates service has. When none can be found the person is asked to type it.
 */
export async function rateFor(
  db: Exec, services: Services, b: Pick<BusinessRow, "currency">, currency: string, day: string, given?: Rate | null,
  field = "fxRate",
): Promise<Rate> {
  if (currency === b.currency) return "1";
  if (given) return given;
  const found = await services.fx.rate(db, currency, b.currency, day);
  if (found) return found.rate;
  throw badRequest(
    `We couldn't look up the ${currency} to ${b.currency} rate for ${formatDate(day, { year: true })}. Enter the rate you're using.`,
    { [field]: `How many ${b.currency} is 1 ${currency}?` },
  );
}

/** A stored rate ("0.7912000000") as the API shows it ("0.7912"). */
export const shownRate = (r: string | null | undefined): string => parseRate(r ?? "1") ?? "1";

/** An amount in a document's currency, e.g. "€1,250.00" or "US$980.00" for a UK business. */
export function docMoney(b: Pick<BusinessRow, "currency">, currency: string, minor: number): string {
  return formatMoney(minor, currency, { decimals: "always", homeOf: b.currency as "GBP" | "LKR" | "USD" });
}

/** "1 USD = 0.7912 GBP", or null for a document in the home currency. */
export function rateLabel(b: Pick<BusinessRow, "currency">, currency: string, rate: string): string | null {
  return currency === b.currency ? null : describeRate(currency, b.currency, shownRate(rate));
}
