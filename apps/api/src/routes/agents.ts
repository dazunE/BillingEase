import { agents } from "@billingease/contracts";
import { today } from "@billingease/core";
import { agentRuns, agentSettings, agentSteps, proposals, usageMonthly, users } from "@billingease/db/schema";
import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { approve, expireOld, loadProposal, reject, toProposal } from "../agents/platform/proposals";
import { agentDef, agentName, allAgents } from "../agents/platform/registry";
import { monthOf } from "../agents/platform/runner";
import { notFound } from "../lib/errors";
import { route } from "../lib/route";

export async function agentRoutes(app: FastifyInstance) {
  route(app, agents.proposals, async ({ query, ctx }) => {
    await expireOld(ctx.db, ctx.business.id);
    const where = query.status === "pending" ? eq(proposals.status, "pending") : query.status === "decided" ? ne(proposals.status, "pending") : undefined;
    const rows = await ctx.db.select({ p: proposals, decidedBy: users.name }).from(proposals).leftJoin(users, eq(users.id, proposals.decidedByUserId))
      .where(and(eq(proposals.businessId, ctx.business.id), where))
      .orderBy(desc(proposals.createdAt)).limit(100);
    const [{ n }] = await ctx.db.select({ n: count() }).from(proposals).where(and(eq(proposals.businessId, ctx.business.id), eq(proposals.status, "pending")));
    return { proposals: rows.map((r) => toProposal(r.p, r.decidedBy)), pending: n };
  });

  route(app, agents.proposal, async ({ params, ctx }) => {
    const r = await loadProposal(ctx, params.id);
    return toProposal(r.p, r.decidedBy);
  });

  route(app, agents.approve, async ({ params, body, ctx, req }) => {
    const r = await approve(app, req, ctx, params.id, body.payload);
    return toProposal(r.p, r.decidedBy);
  });

  route(app, agents.reject, async ({ params, body, ctx }) => {
    const r = await reject(ctx, params.id, body.reason ?? null);
    return toProposal(r.p, r.decidedBy);
  });

  const runOut = (r: typeof agentRuns.$inferSelect, proposalCount: number) => ({
    id: r.id, agent: r.agent, agentName: agentName(r.agent), version: r.version, trigger: r.trigger, status: r.status, model: r.model,
    tokensIn: r.tokensIn, tokensOut: r.tokensOut, costMicros: r.costMicros, error: r.error, proposals: proposalCount,
    createdAt: r.createdAt.toISOString(), finishedAt: r.finishedAt?.toISOString() ?? null,
  });

  route(app, agents.runs, async ({ ctx }) => {
    const runs = await ctx.db.select().from(agentRuns).where(eq(agentRuns.businessId, ctx.business.id)).orderBy(desc(agentRuns.createdAt)).limit(50);
    const counts = runs.length
      ? await ctx.db.select({ runId: proposals.runId, n: count() }).from(proposals).where(and(eq(proposals.businessId, ctx.business.id), inArray(proposals.runId, runs.map((r) => r.id)))).groupBy(proposals.runId)
      : [];
    const by = new Map(counts.map((c) => [c.runId, c.n]));
    return { runs: runs.map((r) => runOut(r, by.get(r.id) ?? 0)) };
  });

  route(app, agents.run, async ({ params, ctx }) => {
    if (!/^[0-9a-f-]{36}$/i.test(params.id)) throw notFound("That run");
    const [r] = await ctx.db.select().from(agentRuns).where(and(eq(agentRuns.id, params.id), eq(agentRuns.businessId, ctx.business.id)));
    if (!r) throw notFound("That run");
    const steps = await ctx.db.select().from(agentSteps).where(eq(agentSteps.runId, r.id)).orderBy(asc(agentSteps.seq));
    const [{ n }] = await ctx.db.select({ n: count() }).from(proposals).where(eq(proposals.runId, r.id));
    return {
      run: runOut(r, n),
      steps: steps.map((s) => ({ seq: s.seq, kind: s.kind, name: s.name, tokensIn: s.tokensIn, tokensOut: s.tokensOut, costMicros: s.costMicros, ms: s.ms, error: s.error, at: s.at.toISOString() })),
    };
  });

  const usedThisMonth = async (businessId: string, month: string) => {
    const rows = await app.be.db.select().from(usageMonthly).where(and(eq(usageMonthly.businessId, businessId), eq(usageMonthly.month, month)));
    return new Map(rows.map((r) => [r.agent, r]));
  };
  /** Every agent with this month's runs and spend, and the business's settings for it. */
  const usageOf = async (businessId: string, month: string) => {
    const used = await usedThisMonth(businessId, month);
    const settings = await app.be.db.select().from(agentSettings).where(eq(agentSettings.businessId, businessId));
    const set = new Map(settings.map((s) => [s.agent, s]));
    return allAgents().map((d) => ({
      agent: d.id, name: d.name, description: d.description, enabled: set.get(d.id)?.enabled ?? true,
      model: app.be.config.ai.models[d.tier], runs: used.get(d.id)?.runs ?? 0, costMicros: used.get(d.id)?.costMicros ?? 0,
      monthlyBudgetMicros: set.get(d.id)?.monthlyBudgetMicros ?? null,
    }));
  };
  route(app, agents.usage, async ({ ctx }) => {
    const month = monthOf(today());
    const list = await usageOf(ctx.business.id, month);
    return {
      setUp: !!ctx.services.models, month,
      costMicros: list.reduce((s, a) => s + a.costMicros, 0),
      budgetMicros: ctx.config.ai.monthlyBudgetMicros,
      agents: list,
    };
  });

  route(app, agents.setAgent, async ({ params, body, ctx }) => {
    const def = agentDef(params.agent);
    if (!def) throw notFound("That agent");
    await ctx.db.insert(agentSettings).values({ businessId: ctx.business.id, agent: def.id, enabled: body.enabled, monthlyBudgetMicros: body.monthlyBudgetMicros ?? null })
      .onConflictDoUpdate({
        target: [agentSettings.businessId, agentSettings.agent],
        set: { enabled: body.enabled, monthlyBudgetMicros: body.monthlyBudgetMicros === undefined ? undefined : body.monthlyBudgetMicros, updatedAt: new Date() },
      });
    return (await usageOf(ctx.business.id, monthOf(today()))).find((a) => a.agent === def.id)!;
  });
}
