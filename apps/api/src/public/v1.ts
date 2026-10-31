import { openApiDocument, publicApi, SCOPES, V1, v1Path, type ApiScope, type V1Op } from "@billingease/contracts";
import { bills, invoices, proposals } from "@billingease/db/schema";
import { and, count, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { KINDS, propose, toProposal } from "../agents/platform/proposals";
import { AppError, forbidden, notFound } from "../lib/errors";
import { define, handlerFor, parseInput, parseOutput } from "../lib/route";
import { callsToday, logCall, useQuota } from "./metering";
import { authenticateToken, callerName, requireScope, type Surface, type TokenCtx } from "./tokens";

/** Proposals from one token waiting at once, so a runaway script can't bury the owner. */
const MAX_WAITING_PER_TOKEN = 200;

/**
 * Runs one /v1 operation for a token: the scope, the role, the daily quota, then the same
 * handler the web app's endpoint uses, with the contract checked on the way in and out.
 */
export async function invoke(app: FastifyInstance, op: V1Op, ctx: TokenCtx, input: { params: Record<string, string>; query?: unknown; body?: unknown }, req: FastifyRequest, reply: FastifyReply, surface: Surface) {
  requireScope(reply, ctx, op.scope, surface);
  if (op.endpoint.roles && !op.endpoint.roles.includes(ctx.role)) throw forbidden();
  await useQuota(ctx, reply);
  const { body, query } = parseInput(op.endpoint, input);
  const result = await handlerFor(app, op.endpoint)({ body, query, params: input.params, raw: { body: input.body }, ctx, req, reply });
  return parseOutput(op.endpoint, result, req);
}

/** The endpoints only the public API has. */
function definePublic(app: FastifyInstance) {
  define(app, publicApi.me, async ({ ctx }) => {
    const t = (ctx as TokenCtx).token;
    const b = ctx.business;
    return {
      business: { id: b.id, name: b.name, country: b.country, currency: b.currency },
      user: { name: ctx.user.name, role: ctx.role },
      scopes: t.scopes,
      token: { kind: t.kind, name: t.name, app: t.appName, expiresAt: t.expiresAt?.toISOString() ?? null },
      callsLeftToday: Math.max(0, ctx.config.api.dailyQuota - (await callsToday(ctx.db, b.id))),
    };
  });

  define(app, publicApi.propose, async ({ body, raw, ctx }) => {
    const t = (ctx as TokenCtx).token;
    const targetId = "invoiceId" in body ? body.invoiceId : "billId" in body ? body.billId : null;
    // The target must be this business's: the endpoint would refuse it later, but say so now.
    if (targetId) {
      const table = KINDS[body.kind].target === "bills" ? bills : invoices;
      const [found] = await ctx.db.select({ id: table.id }).from(table).where(and(eq(table.id, targetId), eq(table.businessId, ctx.business.id)));
      if (!found) throw notFound(KINDS[body.kind].target === "bills" ? "That bill" : "That invoice");
    }
    const [{ waiting }] = await ctx.db.select({ waiting: count() }).from(proposals)
      .where(and(eq(proposals.businessId, ctx.business.id), eq(proposals.apiTokenId, t.id), eq(proposals.status, "pending")));
    if (waiting >= MAX_WAITING_PER_TOKEN) throw new AppError(429, "too_many_waiting", `${waiting} suggestions from this app are already waiting. They need deciding before it sends more.`);
    const name = callerName(t);
    const row = await propose(ctx.db, {
      businessId: ctx.business.id, runId: null, agent: "api", kind: body.kind, targetId,
      // As sent: the endpoint checks it again, with its own defaults, when a person approves it.
      payload: (raw.body as { payload: Record<string, unknown> }).payload,
      title: body.title, summary: body.summary, confidence: body.confidence ?? null,
      sources: [{ kind: "note", label: `Sent by ${name}` }],
      proposedByKind: "api_client", sourceName: name, apiTokenId: t.id,
    });
    return toProposal(row);
  });
}

const timing = new WeakMap<FastifyRequest, { ctx: TokenCtx; operation: string; startedAt: number }>();

/** /v1: the REST API, one route per operation in V1, plus its OpenAPI document. */
export async function v1Routes(root: FastifyInstance, scope: FastifyInstance) {
  definePublic(root);
  const { config } = root.be;

  scope.addHook("onResponse", async (req, reply) => {
    const t = timing.get(req);
    if (t) await logCall(t.ctx, "rest", t.operation, reply.statusCode, t.startedAt);
  });

  for (const op of V1) {
    const e = op.endpoint;
    const url = v1Path(e);
    scope.route({
      method: e.method,
      url,
      config: { rateLimit: { max: config.api.perMinute, timeWindow: "1 minute", keyGenerator: (req: FastifyRequest) => req.headers.authorization ?? req.ip } },
      handler: async (req, reply) => {
        const startedAt = performance.now();
        const ctx = await authenticateToken(root, req, reply, "rest");
        timing.set(req, { ctx, operation: `${e.method} ${url}`, startedAt });
        return invoke(root, op, ctx, { params: (req.params ?? {}) as Record<string, string>, query: req.query, body: req.body }, req, reply, "rest");
      },
    });
  }

  scope.get("/v1/openapi.json", async () => openApiDocument(config.appUrl));
  scope.get("/v1", async () => ({
    name: "BillingEase API",
    docs: `${config.appUrl}/v1/openapi.json`,
    scopes: Object.fromEntries((Object.keys(SCOPES) as ApiScope[]).map((s) => [s, SCOPES[s].label])),
  }));
}
