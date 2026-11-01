import { comingIn } from "@billingease/contracts";
import { describeRate, today } from "@billingease/core";
import type { FastifyInstance } from "fastify";
import { route } from "../../lib/route";

/** The rate a form fills in for a document in another currency. The person can change it. */
export async function fxRoutes(app: FastifyInstance) {
  route(app, comingIn.fxRate, async ({ query, ctx }) => {
    const b = ctx.business;
    const day = query.on ?? today();
    const found = await ctx.services.fx.rate(ctx.db, query.from, b.currency, day);
    return {
      from: query.from, to: b.currency, rate: found?.rate ?? null, day: found?.day ?? null,
      label: found ? describeRate(query.from, b.currency, found.rate) : null,
    };
  });
}
