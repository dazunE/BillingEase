import type { Db } from "@billingease/db";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import type { Config } from "./config";
import { AppError } from "./lib/errors";
import { LockedPeriodError } from "@billingease/db";
import { LedgerError, TaxError } from "@billingease/core";
import { registerRoutes } from "./routes";
import type { Services } from "./services";

declare module "fastify" {
  interface FastifyInstance {
    be: { db: Db; config: Config; services: Services };
  }
}

export async function buildApp(opts: { db: Db; config: Config; services: Services; logger?: boolean }): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opts.logger ?? opts.config.env !== "test",
    bodyLimit: 2 * 1024 * 1024,
    trustProxy: true,
  });
  app.decorate("be", { db: opts.db, config: opts.config, services: opts.services });

  // Per-route limits (sign-in, sign-up, password resets). Tests make many accounts from one address.
  await app.register(rateLimit, { global: false, allowList: () => opts.config.env === "test" });

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof AppError) return reply.status(err.status).send({ error: { code: err.code, message: err.message, fields: err.fields } });
    if (err instanceof LockedPeriodError) return reply.status(409).send({ error: { code: "period_locked", message: `${err.label} is filed and locked. Ask your accountant to reopen it, or use a later date.` } });
    if (err instanceof TaxError || err instanceof LedgerError) return reply.status(400).send({ error: { code: "invalid", message: err.message } });
    if (err instanceof ZodError) return reply.status(400).send({ error: { code: "invalid", message: "Some details need fixing." } });
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 429) return reply.status(429).send({ error: { code: "rate_limited", message: "Too many tries. Wait a minute and try again." } });
    if (status && status >= 400 && status < 500) return reply.status(status).send({ error: { code: "bad_request", message: (err as Error).message } });
    req.log.error(err);
    return reply.status(500).send({ error: { code: "server", message: "Something went wrong on our side. Try again in a moment." } });
  });
  app.setNotFoundHandler((_req, reply) => reply.status(404).send({ error: { code: "not_found", message: "No such endpoint." } }));

  app.get("/health", async () => ({ ok: true }));
  await registerRoutes(app);
  return app;
}
