import { home } from "@billingease/contracts";
import { today } from "@billingease/core";
import { notifications } from "@billingease/db/schema";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { BizCtx } from "../lib/context";
import { notFound } from "../lib/errors";
import { route } from "../lib/route";
import { homeSummary, search } from "../services/home";

/** Notifications for this business that are for everyone in it, or for the caller. */
const mine = (ctx: BizCtx) => and(eq(notifications.businessId, ctx.business.id), or(isNull(notifications.userId), eq(notifications.userId, ctx.user.id)));

async function unreadCount(ctx: BizCtx) {
  const [r] = await ctx.db.select({ c: sql<string>`count(*)` }).from(notifications).where(and(mine(ctx), isNull(notifications.readAt)));
  return Number(r.c);
}

export async function homeRoutes(app: FastifyInstance) {
  route(app, home.summary, ({ query, ctx }) => homeSummary(ctx.db, ctx.business, query.period, today()));

  route(app, home.search, async ({ query, ctx }) => ({ q: query.q, results: await search(ctx.db, ctx.business, query.q) }));

  route(app, home.notifications, async ({ query, ctx }) => {
    const rows = await ctx.db.select().from(notifications)
      .where(and(mine(ctx), query.filter === "unread" ? isNull(notifications.readAt) : undefined))
      .orderBy(sql`${notifications.readAt} is not null`, desc(notifications.createdAt)).limit(100);
    const [t] = await ctx.db.select({ c: sql<string>`count(*)` }).from(notifications).where(mine(ctx));
    return {
      items: rows.map((r) => ({ id: r.id, title: r.title, body: r.body, link: r.link, read: !!r.readAt, createdAt: r.createdAt.toISOString() })),
      unread: await unreadCount(ctx),
      total: Number(t.c),
    };
  });

  route(app, home.unreadCount, async ({ ctx }) => ({ unread: await unreadCount(ctx) }));

  route(app, home.markRead, async ({ params, body, ctx }) => {
    if (!/^[0-9a-f-]{36}$/i.test(params.id)) throw notFound("That notification");
    const r = await ctx.db.update(notifications).set({ readAt: body.read ? new Date() : null })
      .where(and(mine(ctx), eq(notifications.id, params.id))).returning({ id: notifications.id });
    if (!r.length) throw notFound("That notification");
    return { ok: true as const };
  });

  route(app, home.markAllRead, async ({ ctx }) => {
    const r = await ctx.db.update(notifications).set({ readAt: new Date() }).where(and(mine(ctx), isNull(notifications.readAt))).returning({ id: notifications.id });
    return { ok: true as const, marked: r.length };
  });
}
