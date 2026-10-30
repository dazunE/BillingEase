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
