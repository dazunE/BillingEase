import type { Endpoint } from "@billingease/contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { z } from "zod";
import { authenticate } from "./auth";
import type { BizCtx, Ctx } from "./context";
import { AppError } from "./errors";
import { idempotencyKeys } from "@billingease/db/schema";
import { and, eq, lt } from "drizzle-orm";

type Handler<E extends Endpoint> = (args: {
  body: NonNullable<E["body"]> extends z.ZodNever ? undefined : z.output<NonNullable<E["body"]>>;
  query: NonNullable<E["query"]> extends z.ZodNever ? undefined : z.output<NonNullable<E["query"]>>;
  params: Record<string, string>;
  /** The body as sent, before the contract's defaults and clean-ups. */
  raw: { body: unknown };
  ctx: E["auth"] extends "public" ? Ctx : E["auth"] extends "user" ? Ctx & { user: NonNullable<Ctx["user"]> } : BizCtx;
  req: FastifyRequest;
  reply: FastifyReply;
}) => Promise<z.input<E["response"]>> | z.input<E["response"]>;

function fieldErrors(err: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const i of err.issues) {
    const key = i.path.join(".") || "_";
    if (!fields[key]) fields[key] = i.message;
  }
  return fields;
}

type Args = { body?: unknown; query?: unknown; params: Record<string, string>; raw: { body: unknown } };

/** Checks a request's body and query against the endpoint's contract. */
export function parseInput(e: Endpoint, raw: { body?: unknown; query?: unknown }) {
  let body: unknown;
  let query: unknown;
  if (e.body) {
    const r = e.body.safeParse(raw.body ?? {});
    if (!r.success) throw new AppError(400, "invalid", "Some details need fixing.", fieldErrors(r.error));
    body = r.data;
  }
  if (e.query) {
    const r = e.query.safeParse(raw.query ?? {});
    if (!r.success) throw new AppError(400, "invalid", "Some details need fixing.", fieldErrors(r.error));
    query = r.data;
  }
  return { body, query };
}

/** Parses a handler's result through the endpoint's response schema. */
export function parseOutput(e: Endpoint, result: unknown, req: FastifyRequest) {
  const out = e.response.safeParse(result);
  if (!out.success) {
    req.log.error({ issues: out.error.issues, url: e.path }, "response does not match its contract");
    throw new AppError(500, "contract", "Something went wrong on our side.");
  }
  return out.data;
}

type Stored = (a: Args & { ctx: Ctx; req: FastifyRequest; reply: FastifyReply }) => Promise<unknown>;
const handlers = new WeakMap<FastifyInstance, Map<Endpoint, Stored>>();

/**
 * The handler registered for an endpoint, for the public API and the MCP server: they
 * authenticate differently (tokens, not sessions) but run exactly the same code.
 */
export function handlerFor(app: FastifyInstance, e: Endpoint): Stored {
  const h = handlers.get(app)?.get(e);
  if (!h) throw new Error(`No handler registered for ${e.method} ${e.path}`);
  return h;
}

/** Records a handler without an internal route (endpoints only the public API has). */
export function define<E extends Endpoint>(app: FastifyInstance, e: E, handler: Handler<E>) {
  if (!handlers.has(app)) handlers.set(app, new Map());
  handlers.get(app)!.set(e, handler as unknown as Stored);
}

/**
 * Registers an endpoint from the shared contracts. The body and query are checked with the
 * contract's schema, and the response is parsed through it too, so nothing outside the
 * contract (a password hash, another business's id) can leak out.
 */
export function route<E extends Endpoint>(app: FastifyInstance, e: E, handler: Handler<E>, opts: { rateLimit?: { max: number; timeWindow: string } } = {}) {
  define(app, e, handler);
  app.route({
    method: e.method,
    url: e.path,
    config: opts.rateLimit ? { rateLimit: opts.rateLimit } : undefined,
    handler: async (req, reply) => {
      const ctx = await authenticate(app, req, e);
      const { body, query } = parseInput(e, { body: req.body, query: req.query });
      const run = async () => {
        const result = await handler({ body, query, params: (req.params ?? {}) as Record<string, string>, raw: { body: req.body }, ctx, req, reply } as never);
        return reply.sent ? reply : parseOutput(e, result, req);
      };
      const key = req.headers["idempotency-key"];
      if (e.method === "GET" || typeof key !== "string" || !ctx.user) return run();
      return once(ctx, ctx.user.id, key, e.method, req.url.split("?")[0], run);
    },
  });
}

const KEY = /^[A-Za-z0-9_-]{8,100}$/;

/**
 * Runs a write once per Idempotency-Key. The key is claimed before the write runs, so two copies
 * of the same request can't both save. A repeat gets the first answer back; a repeat that arrives
 * while the first is still running is told to try again. A failed write gives the key back, so it
 * can be tried again.
 */
async function once(ctx: Ctx, userId: string, key: string, method: string, path: string, run: () => Promise<unknown>) {
  if (!KEY.test(key)) throw new AppError(400, "invalid", "The Idempotency-Key should be 8–100 letters, numbers, - or _.");
  const id = `${userId}:${key}`;
  const [claimed] = await ctx.db.insert(idempotencyKeys).values({ key: id, userId, method, path }).onConflictDoNothing().returning();
  if (!claimed) {
    const [had] = await ctx.db.select().from(idempotencyKeys).where(eq(idempotencyKeys.key, id));
    if (!had) return once(ctx, userId, key, method, path, run);
    if (had.method !== method || had.path !== path) throw new AppError(422, "key_reused", "That Idempotency-Key was used for a different request.");
    if (had.status === "pending") {
      // Left pending by a write that never finished (the server stopped mid-way): try it again.
      if (Date.now() - had.createdAt.getTime() > 2 * 60_000) {
        await ctx.db.delete(idempotencyKeys).where(and(eq(idempotencyKeys.key, id), eq(idempotencyKeys.status, "pending")));
        return once(ctx, userId, key, method, path, run);
      }
      throw new AppError(409, "still_saving", "That's still being saved. Try again in a moment.");
    }
    return had.response;
  }
  try {
    const out = await run();
    // A reply sent directly (a file) has no answer to keep; a repeat then gets null.
    const kept = out && typeof out === "object" && "sent" in out ? null : out;
    await ctx.db.update(idempotencyKeys).set({ status: "done", response: kept as object }).where(eq(idempotencyKeys.key, id));
    return out;
  } catch (err) {
    await ctx.db.delete(idempotencyKeys).where(and(eq(idempotencyKeys.key, id), eq(idempotencyKeys.status, "pending")));
    throw err;
  }
}

/** Keys are kept a week: longer than any phone stays offline with a write waiting. */
export async function tidyIdempotencyKeys(db: Ctx["db"], now = new Date()) {
  await db.delete(idempotencyKeys).where(lt(idempotencyKeys.createdAt, new Date(now.getTime() - 7 * 24 * 60 * 60_000)));
}
