"use server";

import { comingIn, type FxRate } from "@billingease/contracts";
import { call } from "@/lib/api";

/** The day's rate from `from` to the business's home currency, for a form to fill in. */
export async function lookupRate(from: string, on: string): Promise<FxRate | null> {
  try {
    return await call(comingIn.fxRate, { query: { from, on } });
  } catch {
    return null;
  }
}
