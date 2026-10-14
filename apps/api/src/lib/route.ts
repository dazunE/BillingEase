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

/**
 * Registers an endpoint from the shared contracts. The body and query are checked with the
 * contract's schema, and the response is parsed through it too, so nothing outside the
 * contract (a password hash, another business's id) can leak out.
 */
export function route<E extends Endpoint>(app: FastifyInstance, e: E, handler: Handler<E>, opts: { rateLimit?: { max: number; timeWindow: string } } = {}) {
  app.route({
    method: e.method,
    url: e.path,
    config: opts.rateLimit ? { rateLimit: opts.rateLimit } : undefined,
    handler: async (req, reply) => {
      const ctx = await authenticate(app, req, e);
      let body: unknown;
      let query: unknown;
      if (e.body) {
        const r = e.body.safeParse(req.body ?? {});
        if (!r.success) throw new AppError(400, "invalid", "Some details need fixing.", fieldErrors(r.error));
        body = r.data;
      }
      if (e.query) {
        const r = e.query.safeParse(req.query ?? {});
        if (!r.success) throw new AppError(400, "invalid", "Some details need fixing.", fieldErrors(r.error));
        query = r.data;
      }
      const result = await handler({ body, query, params: (req.params ?? {}) as Record<string, string>, ctx, req, reply } as never);
      if (reply.sent) return reply;
      const out = e.response.safeParse(result);
      if (!out.success) {
        req.log.error({ issues: out.error.issues, url: e.path }, "response does not match its contract");
        throw new AppError(500, "contract", "Something went wrong on our side.");
      }
      return out.data;
    },
  });
}
