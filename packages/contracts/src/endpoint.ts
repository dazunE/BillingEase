import { isListedCurrency, parseRate } from "@billingease/core";
import { z } from "zod";

/**
 * One API endpoint, described once and used by both sides: Fastify validates the body
 * (and, in development, the response) with these schemas, and the web client gets types.
 */
export type Endpoint<B extends z.ZodType = z.ZodType, Q extends z.ZodType = z.ZodType, R extends z.ZodType = z.ZodType> = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  body?: B;
  query?: Q;
  response: R;
  /** Who may call it. Default: a signed-in member of the business. */
  auth?: "public" | "user" | "business";
  /** Roles allowed, when narrower than any member. */
  roles?: ("owner" | "accountant" | "admin")[];
};

export function endpoint<B extends z.ZodType = z.ZodNever, Q extends z.ZodType = z.ZodNever, R extends z.ZodType = z.ZodType>(e: Endpoint<B, Q, R>) {
  return e;
}

export type BodyOf<E> = E extends Endpoint<infer B, z.ZodType, z.ZodType> ? z.input<B> : never;
export type QueryOf<E> = E extends Endpoint<z.ZodType, infer Q, z.ZodType> ? z.input<Q> : never;
export type ResponseOf<E> = E extends Endpoint<z.ZodType, z.ZodType, infer R> ? z.output<R> : never;

/** Error body for every failed request. `fields` maps a body field to what's wrong with it. */
export const ApiError = z.object({
  error: z.object({ code: z.string(), message: z.string(), fields: z.record(z.string(), z.string()).optional() }),
});
export type ApiError = z.infer<typeof ApiError>;

export const Ok = z.object({ ok: z.literal(true) });
export const IdParam = z.string().uuid();

// Shared field types.
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-10-11");
/** Minor units (pence, cents): a whole number. */
export const Minor = z.number().int();
export const PositiveMinor = z.number().int().positive("Enter an amount more than 0");
export const Country = z.enum(["uk", "lk", "us"]);
export const optionalText = (max = 500) => z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null));

/** A currency a document can be written in: an ISO code from core's list (EUR, AUD, JPY…). */
export const CurrencyCode = z.string().trim().toUpperCase().refine(isListedCurrency, "Pick a currency from the list");
/**
 * An exchange rate as typed or sent: units of the home currency per unit of the document's
 * currency ("0.7912" or 0.7912). Comes out as a tidy decimal string; left out, the API looks one up.
 */
export const FxRateInput = z.union([z.string(), z.number()]).optional().nullable()
  .transform((v, ctx) => {
    if (v == null || v === "") return null;
    const r = parseRate(v);
    if (!r) ctx.addIssue({ code: "custom", message: "Enter a rate above 0, like 0.7912" });
    return r;
  });
/** A document's currency and rate, as every list and detail shows them. */
export const FxShown = {
  currency: z.string(),
  /** Units of the home currency per unit of `currency`; "1" in the home currency. */
  fxRate: z.string(),
};

export const FxRate = z.object({
  from: z.string(),
  to: z.string(),
  /** Null when no rate could be found: the person types one. */
  rate: z.string().nullable(),
  /** The day the rate is for (a weekend or holiday uses the last working day before it). */
  day: IsoDate.nullable(),
  /** "1 USD = 0.7912 GBP". */
  label: z.string().nullable(),
});
export type FxRate = z.infer<typeof FxRate>;
