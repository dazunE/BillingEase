import type { Exec } from "@billingease/db";
import { apiCalls, apiUsageDaily } from "@billingease/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { FastifyReply } from "fastify";
import { AppError } from "../lib/errors";
import type { Surface, TokenCtx } from "./tokens";

const day = () => new Date().toISOString().slice(0, 10);

/** Calls this business has made today. */
export async function callsToday(db: Exec, businessId: string) {
  const [r] = await db.select({ calls: apiUsageDaily.calls }).from(apiUsageDaily).where(and(eq(apiUsageDaily.businessId, businessId), eq(apiUsageDaily.day, day())));
  return r?.calls ?? 0;
}

/**
 * Counts one call against the business's daily quota, in one statement so two calls at once
 * can't both slip under it. Over the quota: 429 until midnight UTC.
 */
export async function useQuota(ctx: TokenCtx, reply: FastifyReply) {
  const [r] = await ctx.db.insert(apiUsageDaily).values({ businessId: ctx.business.id, day: day(), calls: 1 })
    .onConflictDoUpdate({ target: [apiUsageDaily.businessId, apiUsageDaily.day], set: { calls: sql`${apiUsageDaily.calls} + 1` } })
    .returning({ calls: apiUsageDaily.calls });
  if (r.calls > ctx.config.api.dailyQuota) {
    const midnight = new Date(`${day()}T00:00:00Z`).getTime() + 86_400_000;
    reply.header("retry-after", String(Math.ceil((midnight - Date.now()) / 1000)));
    throw new AppError(429, "quota_reached", `This business has used its ${ctx.config.api.dailyQuota} API calls for today. It resets at midnight UTC.`);
  }
}

/** One line in the call log. Failures to write it never fail the call. */
export async function logCall(ctx: TokenCtx, surface: Surface, operation: string, status: number, startedAt: number) {
  try {
    await ctx.db.insert(apiCalls).values({
      businessId: ctx.business.id, tokenId: ctx.token.id, clientId: ctx.token.clientId, surface,
      operation: operation.slice(0, 200), status, ms: Math.max(0, Math.round(performance.now() - startedAt)),
    });
  } catch {
    // The log is for the owner's interest; the call itself already happened.
  }
}
