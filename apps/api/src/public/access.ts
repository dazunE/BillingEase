import { apiAccess } from "@billingease/contracts";
import { apiCalls, apiTokens, oauthClients, oauthCodes, users } from "@billingease/db/schema";
import { and, desc, eq, gt, inArray, isNotNull, isNull, max, min, or, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { logActivity } from "../lib/activity";
import type { BizCtx } from "../lib/context";
import { AppError, notFound } from "../lib/errors";
import { route } from "../lib/route";
import { callsToday } from "./metering";
import { revokeGrant } from "./oauth";
import { mintToken, resources } from "./tokens";

const MAX_TOKENS_PER_PERSON = 20;

const live = () => and(isNull(apiTokens.revokedAt), or(isNull(apiTokens.expiresAt), gt(apiTokens.expiresAt, new Date())));
const iso = (d: Date | null) => d?.toISOString() ?? null;
const hostOf = (u: string | null) => {
  try {
    return u ? new URL(u).host : null;
  } catch {
    return null;
  }
};

/** Owners see and can revoke everyone's; others, their own. */
const canManage = (ctx: BizCtx, userId: string) => ctx.role === "owner" || ctx.user.id === userId;

/** Settings → Apps and API: tokens, connected apps and the call log. */
export function accessRoutes(app: FastifyInstance) {
  route(app, apiAccess.list, async ({ ctx }) => {
    const b = ctx.business.id;
    const mineOnly = ctx.role === "owner" ? undefined : eq(apiTokens.userId, ctx.user.id);
    const tokens = await ctx.db.select({ t: apiTokens, owner: users.name }).from(apiTokens).innerJoin(users, eq(users.id, apiTokens.userId))
      .where(and(eq(apiTokens.businessId, b), eq(apiTokens.kind, "personal"), live(), mineOnly)).orderBy(desc(apiTokens.createdAt));

    // A connected app is a grant with a refresh token still able to work.
    const grants = await ctx.db.select({
      grantId: apiTokens.grantId, userId: apiTokens.userId, owner: users.name, name: oauthClients.name, kind: oauthClients.kind, clientId: oauthClients.id, uri: oauthClients.uri,
      scopes: sql<string[]>`(array_agg(${apiTokens.scopes} order by ${apiTokens.createdAt} desc))[1]`,
      connectedAt: min(apiTokens.createdAt), lastUsedAt: max(apiTokens.lastUsedAt),
    }).from(apiTokens)
      .innerJoin(users, eq(users.id, apiTokens.userId))
      .innerJoin(oauthClients, eq(oauthClients.id, apiTokens.clientId))
      .where(and(eq(apiTokens.businessId, b), isNotNull(apiTokens.grantId), isNull(apiTokens.revokedAt), mineOnly))
      .groupBy(apiTokens.grantId, apiTokens.userId, users.name, oauthClients.name, oauthClients.kind, oauthClients.id, oauthClients.uri)
      .having(sql`bool_or(${apiTokens.kind} = 'refresh' and ${apiTokens.usedAt} is null and ${apiTokens.expiresAt} > now())`)
      .orderBy(desc(min(apiTokens.createdAt)));

    const calls = await ctx.db.select({ c: apiCalls, token: apiTokens.name }).from(apiCalls).leftJoin(apiTokens, eq(apiTokens.id, apiCalls.tokenId))
      .where(and(eq(apiCalls.businessId, b), ctx.role === "owner" ? undefined : eq(apiTokens.userId, ctx.user.id)))
      .orderBy(desc(apiCalls.createdAt)).limit(50);

    const r = resources(ctx.config.appUrl);
    return {
      tokens: tokens.map(({ t, owner }) => ({
        id: t.id, name: t.name, prefix: t.prefix, scopes: t.scopes, owner, mine: t.userId === ctx.user.id,
        createdAt: t.createdAt.toISOString(), lastUsedAt: iso(t.lastUsedAt), expiresAt: iso(t.expiresAt),
      })),
      apps: grants.map((g) => ({
        grantId: g.grantId!, name: g.name, host: hostOf(g.kind === "metadata_url" ? g.clientId : g.uri), scopes: g.scopes as never,
        owner: g.owner, mine: g.userId === ctx.user.id, connectedAt: (g.connectedAt as Date).toISOString(), lastUsedAt: iso(g.lastUsedAt as Date | null),
      })),
      calls: calls.map(({ c, token }) => ({ at: c.createdAt.toISOString(), surface: c.surface, operation: c.operation, status: c.status, ms: c.ms, by: token ?? "A removed token" })),
      usage: { today: await callsToday(ctx.db, b), dailyQuota: ctx.config.api.dailyQuota, perMinute: ctx.config.api.perMinute },
      urls: { mcp: r.mcp, rest: r.rest, docs: `${ctx.config.appUrl}/developers` },
    };
  });

  route(app, apiAccess.createToken, async ({ body, ctx }) => {
    const active = await ctx.db.select({ id: apiTokens.id }).from(apiTokens)
      .where(and(eq(apiTokens.userId, ctx.user.id), eq(apiTokens.businessId, ctx.business.id), eq(apiTokens.kind, "personal"), live()));
    if (active.length >= MAX_TOKENS_PER_PERSON) throw new AppError(409, "too_many_tokens", `You have ${active.length} tokens. Revoke one you no longer use first.`);
    const m = mintToken("personal");
    const [t] = await ctx.db.insert(apiTokens).values({
      kind: "personal", hash: m.hash, prefix: m.prefix, name: body.name, userId: ctx.user.id, businessId: ctx.business.id,
      scopes: [...new Set(body.scopes)], expiresAt: body.expiresInDays ? new Date(Date.now() + body.expiresInDays * 86_400_000) : null,
    }).returning();
    await logActivity(ctx.db, ctx.business.id, `${ctx.user.name} made an API token: ${t.name}`, { actorId: ctx.user.id, link: "/app/settings/apps" });
    return {
      token: m.raw,
      info: { id: t.id, name: t.name, prefix: t.prefix, scopes: t.scopes, owner: ctx.user.name, mine: true, createdAt: t.createdAt.toISOString(), lastUsedAt: null, expiresAt: iso(t.expiresAt) },
    };
  });

  route(app, apiAccess.revokeToken, async ({ params, ctx }) => {
    if (!/^[0-9a-f-]{36}$/i.test(params.id)) throw notFound("That token");
    const [t] = await ctx.db.select().from(apiTokens).where(and(eq(apiTokens.id, params.id), eq(apiTokens.businessId, ctx.business.id), eq(apiTokens.kind, "personal")));
    if (!t || !canManage(ctx, t.userId)) throw notFound("That token");
    if (!t.revokedAt) {
      await ctx.db.update(apiTokens).set({ revokedAt: new Date() }).where(eq(apiTokens.id, t.id));
      await logActivity(ctx.db, ctx.business.id, `${ctx.user.name} revoked the API token ${t.name}`, { actorId: ctx.user.id });
    }
    return { ok: true as const };
  });

  route(app, apiAccess.revokeApp, async ({ params, ctx }) => {
    if (!/^[0-9a-f-]{36}$/i.test(params.id)) throw notFound("That app");
    const rows = await ctx.db.select({ userId: apiTokens.userId, name: apiTokens.name }).from(apiTokens)
      .where(and(eq(apiTokens.grantId, params.id), eq(apiTokens.businessId, ctx.business.id))).limit(1);
    if (!rows.length || !canManage(ctx, rows[0].userId)) throw notFound("That app");
    await revokeGrant(app, params.id);
    await logActivity(ctx.db, ctx.business.id, `${ctx.user.name} disconnected ${rows[0].name}`, { actorId: ctx.user.id });
    return { ok: true as const };
  });
}

/** Old calls, used codes and long-dead tokens: cleared daily. */
export async function tidyApi(app: FastifyInstance) {
  const { db } = app.be;
  await db.delete(apiCalls).where(sql`${apiCalls.createdAt} < now() - interval '90 days'`);
  await db.delete(oauthCodes).where(sql`${oauthCodes.expiresAt} < now() - interval '1 day'`);
  await db.delete(apiTokens).where(and(inArray(apiTokens.kind, ["access", "refresh"]), sql`${apiTokens.expiresAt} < now() - interval '30 days'`));
  // Registered apps nobody connected within a week.
  await db.delete(oauthClients).where(and(eq(oauthClients.kind, "registered"), sql`${oauthClients.createdAt} < now() - interval '7 days'`,
    sql`not exists (select 1 from ${apiTokens} where ${apiTokens.clientId} = ${oauthClients.id})`));
}
