import { mileage, practice, properties as propertiesApi } from "@billingease/contracts";
import { filingPeriods, MILEAGE, moneyAccountFor, rulesFor, sharePct, today, tripAmount } from "@billingease/core";
import { postEntry, reverseEntry } from "@billingease/db";
import { accounts, expenses, invites, lockedPeriods, memberships, practiceMessages, practiceRequests, properties, propertyEntries, sessions, trips, users } from "@billingease/db/schema";
import { and, asc, between, desc, eq, gt, inArray, isNull, like, max, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { logActivity, notify } from "../lib/activity";
import type { BizCtx } from "../lib/context";
import { AppError, badRequest, notFound } from "../lib/errors";
import { route } from "../lib/route";

const n = (v: unknown) => Number(v ?? 0);

function ukOnly(ctx: BizCtx, what: string) {
  if (ctx.business.country !== "uk") throw new AppError(404, "not_here", `${what} is for UK businesses.`);
}

async function accountFor(ctx: BizCtx, categoryId: string) {
  const [a] = await ctx.db.select({ code: accounts.code }).from(accounts).where(and(eq(accounts.businessId, ctx.business.id), eq(accounts.categoryId, categoryId)));
  if (!a) throw badRequest("Pick a category from the list.", { categoryId: "Not a category" });
  return a.code;
}

async function isLocked(ctx: BizCtx, date: string) {
  const [l] = await ctx.db.select({ id: lockedPeriods.id }).from(lockedPeriods)
    .where(and(eq(lockedPeriods.businessId, ctx.business.id), sql`${date} between ${lockedPeriods.fromDate} and ${lockedPeriods.toDate}`));
  return !!l;
}

export async function practiceRoutes(app: FastifyInstance) {
  // ---- Property ----------------------------------------------------------------------------

  const propertyCats = (ctx: BizCtx) => rulesFor(ctx.business.country).categories.filter((c) => c.scope === "property");
  const entryOut = (ctx: BizCtx, e: typeof propertyEntries.$inferSelect) => {
    const c = propertyCats(ctx).find((x) => x.id === e.categoryId);
    return { id: e.id, propertyId: e.propertyId, kind: e.kind, on: e.on, description: e.description, payee: e.payee, categoryId: e.categoryId, categoryName: c?.name ?? null, categoryOfficial: c?.official ?? null, amount: e.amount, share: e.share, method: e.method };
  };
  const propOut = (p: typeof properties.$inferSelect) => ({ id: p.id, name: p.name, address: p.address, sharePct: p.sharePct, monthlyRent: p.monthlyRent, rentDay: p.rentDay, agent: p.agent, archived: p.archived });

  route(app, propertiesApi.list, async ({ query, ctx }) => {
    ukOnly(ctx, "Property");
    const b = ctx.business;
    const y = rulesFor(b.country).taxYearOf(query.date ?? today());
    const props = await ctx.db.select().from(properties).where(eq(properties.businessId, b.id)).orderBy(asc(properties.createdAt));
    const entries = await ctx.db.select().from(propertyEntries)
      .where(and(eq(propertyEntries.businessId, b.id), isNull(propertyEntries.voidedAt), between(propertyEntries.on, y.from, y.to)))
      .orderBy(desc(propertyEntries.on), desc(propertyEntries.createdAt));
    const sum = (list: typeof entries) => {
      const rent = list.filter((e) => e.kind === "rent").reduce((a, e) => a + e.share, 0);
      const finance = list.filter((e) => e.categoryId === "p-finance").reduce((a, e) => a + e.share, 0);
      const costs = list.filter((e) => e.kind === "cost" && e.categoryId !== "p-finance").reduce((a, e) => a + e.share, 0);
      return { rent, costs, finance, profit: rent - costs };
    };
    // Property costs recorded as expenses in Going out count too.
    const [other] = await ctx.db.select({
      costs: sql<string>`coalesce(sum(case when ${expenses.categoryId} <> 'p-finance' then round((${expenses.gross} - ${expenses.vat}) * ${expenses.bizPct} / 100.0) else 0 end), 0)`,
      finance: sql<string>`coalesce(sum(case when ${expenses.categoryId} = 'p-finance' then round((${expenses.gross} - ${expenses.vat}) * ${expenses.bizPct} / 100.0) else 0 end), 0)`,
    }).from(expenses).where(and(eq(expenses.businessId, b.id), like(expenses.categoryId, "p-%"), between(expenses.spentOn, y.from, y.to)));
    const all = sum(entries);
    const totals = { rent: all.rent, costs: all.costs + n(other.costs), finance: all.finance + n(other.finance), profit: all.rent - all.costs - n(other.costs) };
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(Number(y.from.slice(0, 4)), 3 + i, 1)).toISOString().slice(0, 7);
      return d;
    });
    const qs = filingPeriods({ country: b.country, quarterType: b.quarterType }, "mtd", y.from).map((q) => {
      const s = sum(entries.filter((e) => e.on >= q.from && e.on <= q.to));
      return { id: q.id, label: q.label, from: q.from, to: q.to, rent: s.rent, costs: s.costs, finance: s.finance };
    });
    return {
      taxYear: { label: y.label, from: y.from, to: y.to },
      properties: props.map((p) => {
        const mine = entries.filter((e) => e.propertyId === p.id);
        return { ...propOut(p), totals: sum(mine), rentMonths: months.map((m) => ({ month: m, received: mine.filter((e) => e.kind === "rent" && e.on.startsWith(m)).reduce((a, e) => a + e.amount, 0) })) };
      }),
      totals,
      allowance: 100_000,
      quarters: qs,
      entries: entries.map((e) => entryOut(ctx, e)),
      categories: propertyCats(ctx).map((c) => ({ id: c.id, name: c.name, official: c.official })),
    };
  });

  route(app, propertiesApi.create, async ({ body, ctx }) => {
    ukOnly(ctx, "Property");
    const [p] = await ctx.db.insert(properties).values({ ...body, businessId: ctx.business.id }).returning();
    await logActivity(ctx.db, ctx.business.id, `${p.name} added to your properties`, { actorId: ctx.user.id, link: "/app/out/properties" });
    return propOut(p);
  });

  route(app, propertiesApi.update, async ({ params, body, ctx }) => {
    ukOnly(ctx, "Property");
    const [p] = await ctx.db.update(properties).set(body).where(and(eq(properties.id, params.id), eq(properties.businessId, ctx.business.id))).returning();
    if (!p) throw notFound("That property");
    return propOut(p);
  });

  route(app, propertiesApi.addEntry, async ({ params, body, ctx }) => {
    ukOnly(ctx, "Property");
    const b = ctx.business;
    const [p] = await ctx.db.select().from(properties).where(and(eq(properties.id, params.id), eq(properties.businessId, b.id)));
    if (!p) throw notFound("That property");
    if (body.on > today()) throw badRequest("The date can't be in the future.", { on: "In the future" });
    const share = sharePct(body.amount, p.sharePct);
    let lines;
    if (body.kind === "rent") {
      lines = [{ code: moneyAccountFor(body.method), debit: share }, { code: "4500", credit: share }];
    } else {
      if (!body.categoryId || !propertyCats(ctx).some((c) => c.id === body.categoryId)) throw badRequest("Pick a property category.", { categoryId: "Pick one" });
      lines = [{ code: await accountFor(ctx, body.categoryId), debit: share }, { code: moneyAccountFor(body.method), credit: share }];
    }
    const row = await ctx.db.transaction(async (tx) => {
      const [e] = await tx.insert(propertyEntries).values({
        businessId: b.id, propertyId: p.id, kind: body.kind, on: body.on, description: body.description, payee: body.payee,
        categoryId: body.kind === "cost" ? body.categoryId : null, amount: body.amount, share, method: body.method,
      }).returning();
      const entryId = await postEntry(tx, { businessId: b.id, date: body.on, memo: `${p.name}: ${body.description}`, sourceType: "property", sourceId: e.id, createdBy: ctx.user.id, lines });
      const [done] = await tx.update(propertyEntries).set({ entryId }).where(eq(propertyEntries.id, e.id)).returning();
      return done;
    });
    return entryOut(ctx, row);
  });

  route(app, propertiesApi.removeEntry, async ({ params, ctx }) => {
    ukOnly(ctx, "Property");
    const [e] = await ctx.db.select().from(propertyEntries).where(and(eq(propertyEntries.id, params.entryId), eq(propertyEntries.businessId, ctx.business.id), isNull(propertyEntries.voidedAt)));
    if (!e) throw notFound("That entry");
    await ctx.db.transaction(async (tx) => {
      if (e.entryId) await reverseEntry(tx, ctx.business.id, e.entryId, { createdBy: ctx.user.id });
      await tx.update(propertyEntries).set({ voidedAt: new Date() }).where(eq(propertyEntries.id, e.id));
    });
    return { ok: true as const };
  });

  // ---- Mileage -----------------------------------------------------------------------------

  route(app, mileage.list, async ({ query, ctx }) => {
    ukOnly(ctx, "Mileage");
    const b = ctx.business;
    const y = rulesFor(b.country).taxYearOf(query.date ?? today());
    const rows = await ctx.db.select().from(trips).where(and(eq(trips.businessId, b.id), isNull(trips.voidedAt), between(trips.on, y.from, y.to))).orderBy(desc(trips.on), desc(trips.createdAt));
    const locks = await ctx.db.select().from(lockedPeriods).where(eq(lockedPeriods.businessId, b.id));
    const locked = (d: string) => locks.some((l) => d >= l.fromDate && d <= l.toDate);
    const tot = (list: typeof rows) => ({ miles: list.reduce((a, t) => a + t.miles, 0), amount: list.reduce((a, t) => a + t.amount, 0), trips: list.length });
    return {
      taxYear: { label: y.label, from: y.from, to: y.to },
      trips: rows.map((t) => ({ id: t.id, on: t.on, from: t.fromPlace, to: t.toPlace, purpose: t.purpose, miles: t.miles, vehicle: t.vehicle, amount: t.amount, locked: locked(t.on) })),
      totals: { ...tot(rows), carMiles: rows.filter((t) => t.vehicle === "car").reduce((a, t) => a + t.miles, 0) },
      quarters: filingPeriods({ country: b.country, quarterType: b.quarterType }, "mtd", y.from).map((q) => ({ id: q.id, label: q.label, from: q.from, to: q.to, ...tot(rows.filter((t) => t.on >= q.from && t.on <= q.to)) })),
      verified: MILEAGE.verified,
    };
  });

  route(app, mileage.add, async ({ body, ctx }) => {
    ukOnly(ctx, "Mileage");
    const b = ctx.business;
    if (body.on > today()) throw badRequest("The date can't be in the future.", { on: "In the future" });
    const tenths = body.returnTrip ? body.miles * 2 : body.miles;
    const y = rulesFor(b.country).taxYearOf(body.on);
    // Car miles already claimed this tax year decide whether it's 45p or 25p.
    const [before] = await ctx.db.select({ m: sql<string>`coalesce(sum(${trips.miles}), 0)` }).from(trips)
      .where(and(eq(trips.businessId, b.id), isNull(trips.voidedAt), eq(trips.vehicle, "car"), between(trips.on, y.from, y.to)));
    const amount = tripAmount(tenths, body.vehicle, n(before.m));
    const travel = await accountFor(ctx, "travel");
    const row = await ctx.db.transaction(async (tx) => {
      const [t] = await tx.insert(trips).values({ businessId: b.id, on: body.on, fromPlace: body.from, toPlace: body.returnTrip ? `${body.to} and back` : body.to, purpose: body.purpose, miles: tenths, vehicle: body.vehicle, amount }).returning();
      // You paid for the vehicle yourself: the claim is money you put into the business.
      const entryId = await postEntry(tx, { businessId: b.id, date: body.on, memo: `Mileage: ${body.from} to ${body.to}`, sourceType: "mileage", sourceId: t.id, createdBy: ctx.user.id, lines: [{ code: travel, debit: amount }, { code: "3000", credit: amount }] });
      const [done] = await tx.update(trips).set({ entryId }).where(eq(trips.id, t.id)).returning();
      return done;
    });
    return { id: row.id, on: row.on, from: row.fromPlace, to: row.toPlace, purpose: row.purpose, miles: row.miles, vehicle: row.vehicle, amount: row.amount, locked: false };
  });

  route(app, mileage.remove, async ({ params, ctx }) => {
    ukOnly(ctx, "Mileage");
    const [t] = await ctx.db.select().from(trips).where(and(eq(trips.id, params.id), eq(trips.businessId, ctx.business.id), isNull(trips.voidedAt)));
    if (!t) throw notFound("That trip");
    if (await isLocked(ctx, t.on)) throw new AppError(409, "period_locked", "That trip is in a period that's been sent, so it stays.");
    await ctx.db.transaction(async (tx) => {
      if (t.entryId) await reverseEntry(tx, ctx.business.id, t.entryId, { createdBy: ctx.user.id });
      await tx.update(trips).set({ voidedAt: new Date() }).where(eq(trips.id, t.id));
    });
    return { ok: true as const };
  });

  // ---- Your accountant ---------------------------------------------------------------------

  const reqOut = (r: typeof practiceRequests.$inferSelect, from: string | null) => ({
    id: r.id, title: r.title, body: r.body, link: r.link, status: r.status, from, createdAt: r.createdAt.toISOString(), doneAt: r.doneAt?.toISOString() ?? null,
  });

  route(app, practice.overview, async ({ ctx }) => {
    const b = ctx.business;
    const acc = await ctx.db.select({ userId: users.id, name: users.name, email: users.email, since: memberships.createdAt }).from(memberships).innerJoin(users, eq(users.id, memberships.userId))
      .where(and(eq(memberships.businessId, b.id), eq(memberships.role, "accountant")));
    const seen = acc.length ? await ctx.db.select({ userId: sessions.userId, at: max(sql<Date>`coalesce(${sessions.lastSeenAt}, ${sessions.createdAt})`) }).from(sessions).where(inArray(sessions.userId, acc.map((a) => a.userId))).groupBy(sessions.userId) : [];
    const inv = await ctx.db.select({ email: invites.email, expiresAt: invites.expiresAt }).from(invites)
      .where(and(eq(invites.businessId, b.id), eq(invites.role, "accountant"), isNull(invites.acceptedAt), isNull(invites.revokedAt), gt(invites.expiresAt, new Date())));
    const reqs = await ctx.db.select({ r: practiceRequests, from: users.name }).from(practiceRequests).leftJoin(users, eq(users.id, practiceRequests.createdBy))
      .where(eq(practiceRequests.businessId, b.id)).orderBy(sql`${practiceRequests.status} = 'done'`, desc(practiceRequests.createdAt)).limit(50);
    const msgs = await ctx.db.select({ m: practiceMessages, from: users.name, role: memberships.role }).from(practiceMessages)
      .leftJoin(users, eq(users.id, practiceMessages.userId)).leftJoin(memberships, and(eq(memberships.userId, practiceMessages.userId), eq(memberships.businessId, b.id)))
      .where(eq(practiceMessages.businessId, b.id)).orderBy(desc(practiceMessages.createdAt)).limit(50);
    return {
      accountants: acc.map((a) => {
        const s = seen.find((x) => x.userId === a.userId)?.at;
        return { ...a, since: a.since.toISOString(), lastSeenAt: s ? new Date(s as unknown as string).toISOString() : null };
      }),
      invited: inv.map((i) => ({ email: i.email, expiresAt: i.expiresAt.toISOString() })),
      requests: reqs.map((x) => reqOut(x.r, x.from)),
      messages: msgs.reverse().map((x) => ({ id: x.m.id, from: x.from, mine: x.m.userId === ctx.user.id, role: x.role, body: x.m.body, createdAt: x.m.createdAt.toISOString() })),
    };
  });

  route(app, practice.createRequest, async ({ body, ctx }) => {
    const [r] = await ctx.db.insert(practiceRequests).values({ businessId: ctx.business.id, createdBy: ctx.user.id, title: body.title, body: body.body, link: body.link ?? null }).returning();
    await notify(ctx.db, ctx.business.id, `${ctx.user.name} asked: ${body.title}`, { body: body.body ?? undefined, link: "/app/accountant" });
    await logActivity(ctx.db, ctx.business.id, `Request from ${ctx.user.name}: ${body.title}`, { actorId: ctx.user.id, link: "/app/accountant" });
    return reqOut(r, ctx.user.name);
  });

  route(app, practice.setRequest, async ({ params, body, ctx }) => {
    const [r] = await ctx.db.update(practiceRequests)
      .set(body.status === "done" ? { status: "done", doneAt: new Date(), doneBy: ctx.user.id } : { status: "open", doneAt: null, doneBy: null })
      .where(and(eq(practiceRequests.id, params.id), eq(practiceRequests.businessId, ctx.business.id))).returning();
    if (!r) throw notFound("That request");
    if (body.status === "done") await logActivity(ctx.db, ctx.business.id, `Done: ${r.title}`, { actorId: ctx.user.id, link: "/app/accountant" });
    const [from] = r.createdBy ? await ctx.db.select({ name: users.name }).from(users).where(eq(users.id, r.createdBy)) : [];
    return reqOut(r, from?.name ?? null);
  });

  route(app, practice.sendMessage, async ({ body, ctx }) => {
    const [m] = await ctx.db.insert(practiceMessages).values({ businessId: ctx.business.id, userId: ctx.user.id, body: body.body }).returning();
    await notify(ctx.db, ctx.business.id, `Message from ${ctx.user.name}`, { body: body.body.slice(0, 140), link: "/app/accountant" });
    return { id: m.id, from: ctx.user.name, mine: true, role: ctx.role, body: m.body, createdAt: m.createdAt.toISOString() };
  });
}

