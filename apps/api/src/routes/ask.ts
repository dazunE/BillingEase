import { ask } from "@billingease/contracts";
import { today } from "@billingease/core";
import { askMessages } from "@billingease/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { AppError, notFound } from "../lib/errors";
import { route } from "../lib/route";
import { runAsk } from "../services/ask";

const NOT_SET_UP = "Ask isn't set up on this BillingEase yet: it needs a Claude API key. Your books are fine; ask whoever runs BillingEase for you to add one.";

export async function askRoutes(app: FastifyInstance) {
  route(app, ask.ask, async ({ body, ctx, req }) => {
    const client = ctx.services.ask;
    if (!client) throw new AppError(503, "ask_not_set_up", NOT_SET_UP);
    const b = ctx.business;
    // A follow-up continues one of the caller's own threads in this business.
    let history: { role: "user" | "assistant"; content: string }[] = [];
    const threadId = body.threadId ?? crypto.randomUUID();
    if (body.threadId) {
      const rows = await ctx.db.select({ role: askMessages.role, content: askMessages.content }).from(askMessages)
        .where(and(eq(askMessages.businessId, b.id), eq(askMessages.userId, ctx.user.id), eq(askMessages.threadId, body.threadId)))
        .orderBy(asc(askMessages.createdAt));
      if (!rows.length) throw notFound("That conversation");
      history = rows.slice(-12);
      if (history[0]?.role !== "user") history = history.slice(1);
    }
    let result;
    try {
      result = await runAsk({ client, db: ctx.db, business: b, today: today(), history, question: body.question });
    } catch (err) {
      req.log.error({ err }, "ask failed");
      throw new AppError(502, "ask_unavailable", "Ask couldn't answer just now. Try again in a minute.");
    }
    await ctx.db.transaction(async (tx) => {
      await tx.insert(askMessages).values({ businessId: b.id, userId: ctx.user.id, threadId, role: "user", content: body.question });
      await tx.insert(askMessages).values({ businessId: b.id, userId: ctx.user.id, threadId, role: "assistant", content: result.answer, sources: result.sources, model: result.model });
    });
    return { threadId, answer: result.answer, sources: result.sources, model: result.model };
  }, { rateLimit: { max: 20, timeWindow: "1 minute" } });

  route(app, ask.threads, async ({ ctx }) => {
    const rows = await ctx.db.select({
      id: askMessages.threadId,
      title: sql<string>`(array_agg(${askMessages.content} order by ${askMessages.createdAt}) filter (where ${askMessages.role} = 'user'))[1]`,
      lastAt: sql<string>`max(${askMessages.createdAt})`,
      messages: sql<string>`count(*)`,
    }).from(askMessages)
      .where(and(eq(askMessages.businessId, ctx.business.id), eq(askMessages.userId, ctx.user.id)))
      .groupBy(askMessages.threadId).orderBy(sql`max(${askMessages.createdAt}) desc`).limit(30);
    return {
      setUp: !!ctx.services.ask,
      threads: rows.map((r) => ({ id: r.id, title: r.title ?? "Question", lastAt: new Date(r.lastAt).toISOString(), messages: Number(r.messages) })),
    };
  });

  route(app, ask.thread, async ({ params, ctx }) => {
    if (!/^[0-9a-f-]{36}$/i.test(params.id)) throw notFound("That conversation");
    const rows = await ctx.db.select().from(askMessages)
      .where(and(eq(askMessages.businessId, ctx.business.id), eq(askMessages.userId, ctx.user.id), eq(askMessages.threadId, params.id)))
      .orderBy(asc(askMessages.createdAt));
    if (!rows.length) throw notFound("That conversation");
    return { id: params.id, messages: rows.map((r) => ({ id: r.id, role: r.role, content: r.content, sources: r.sources, model: r.model, createdAt: r.createdAt.toISOString() })) };
  });
}
