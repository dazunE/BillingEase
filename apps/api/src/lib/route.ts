import type { Endpoint } from "@billingease/contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { z } from "zod";
import { authenticate } from "./auth";
import type { BizCtx, Ctx } from "./context";
import { AppError } from "./errors";

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
      const result = await handler({ body, query, params: (req.params ?? {}) as Record<string, string>, raw: { body: req.body }, ctx, req, reply } as never);
      if (reply.sent) return reply;
      return parseOutput(e, result, req);
    },
  });
}
