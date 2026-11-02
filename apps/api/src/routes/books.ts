import { books } from "@billingease/contracts";
import { daysBetween, rulesFor, today } from "@billingease/core";
import { lockedPeriods } from "@billingease/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { logActivity, notify } from "../lib/activity";
import { AppError, badRequest } from "../lib/errors";
import { route } from "../lib/route";
import { balanceSheet, categoryTotals, checks, lockable, lockFor, locks, profitAndLoss, quarters, taxPeriods, yearOf } from "../services/books";
import { threeNumbers } from "../services/home";

export async function bookRoutes(app: FastifyInstance) {
  // Defaults to the tax year so far.
  const range = (country: Parameters<typeof rulesFor>[0], q: { from?: string; to?: string }) => {
    const t = today();
    const y = rulesFor(country).taxYearOf(t);
    const from = q.from ?? y.from, to = q.to ?? (t < y.to ? t : y.to);
    if (from > to) throw badRequest("The start date is after the end date.", { from: "After the end" });
    return { from, to };
  };

  route(app, books.profitAndLoss, async ({ query, ctx }) => {
    const r = range(ctx.business.country, query);
    return profitAndLoss(ctx.db, ctx.business, r.from, r.to);
  });

  route(app, books.balanceSheet, ({ query, ctx }) => balanceSheet(ctx.db, ctx.business, query.at ?? today()));

  route(app, books.categories, async ({ query, ctx }) => {
    const r = range(ctx.business.country, query);
    return categoryTotals(ctx.db, ctx.business, r.from, r.to);
  });

  route(app, books.quarters, async ({ query, ctx }) => {
    if (!rulesFor(ctx.business.country).features.mtdQuarters) throw new AppError(404, "not_here", "Making Tax Digital quarters are for UK businesses.");
    return quarters(ctx.db, ctx.business, query.date ?? today(), today());
  });

  route(app, books.taxPeriods, async ({ query, ctx }) => {
    const b = ctx.business;
    if (b.country === "us") throw new AppError(404, "not_here", "Sales tax isn't set up for US businesses yet.");
    return taxPeriods(ctx.db, b, query.date ?? today(), today());
  });

  route(app, books.yearEnd, async ({ query, ctx }) => {
    const b = ctx.business;
    const t = today();
    const rules = rulesFor(b.country);
    const y = yearOf(b, query.date ?? t);
    const soFar = t < y.to ? t : y.to;
    const pl = await profitAndLoss(ctx.db, b, y.from, soFar);
    const thisYear = y.from <= t && t <= y.to;
    let estimate, instalments;
    if (thisYear) {
      const nums = await threeNumbers(ctx.db, b, "year", t);
      estimate = { label: nums.tax.label, lines: nums.tax.lines, total: nums.tax.yearEstimate, projectedProfit: nums.tax.projectedProfit, verified: nums.tax.verified };
      instalments = nums.tax.instalments;
    } else {
      const est = rules.estimate(Math.max(0, pl.profit), { year: Number(y.from.slice(0, 4)) });
      estimate = { label: est.label, lines: est.lines, total: est.total, projectedProfit: pl.profit, verified: rules.verified };
      instalments = est.instalments;
    }
    const names = b.country === "uk"
      ? ["First payment on account", "Second payment on account"]
      : b.country === "lk" ? ["First quarterly instalment", "Second quarterly instalment", "Third quarterly instalment", "Fourth quarterly instalment"] : [];
    const lock = lockFor(await locks(ctx.db, b.id), y);
    return {
      taxYear: y, daysToEnd: daysBetween(t, y.to), profitAndLoss: pl,
      estimate, instalments: instalments.map((i, k) => ({ ...i, label: names[k] ?? `Payment ${k + 1}` })),
      checks: await checks(ctx.db, b, { from: y.from, to: soFar }, rules.wording.practitionerNoun), lock,
    };
  });

  route(app, books.lockPeriod, async ({ body, ctx }) => {
    const b = ctx.business;
    const known = lockable(b, body.from, body.to);
    if (!known) throw badRequest("That isn't one of your quarters, VAT periods or tax years.");
    if (body.to >= today()) throw badRequest("That period hasn't ended yet. Mark it sent once it's over and the figures are final.");
    const overlap = await ctx.db.select({ id: lockedPeriods.id }).from(lockedPeriods)
      .where(and(eq(lockedPeriods.businessId, b.id), lte(lockedPeriods.fromDate, body.to), gte(lockedPeriods.toDate, body.from)));
    if (overlap.length) {
      const covered = lockFor(await locks(ctx.db, b.id), body);
      if (covered) throw new AppError(409, "already_locked", `${covered.label} is already marked as sent.`);
    }
    const [row] = await ctx.db.insert(lockedPeriods).values({ businessId: b.id, fromDate: body.from, toDate: body.to, label: known.label, reference: body.reference, lockedBy: ctx.user.id }).returning();
    await logActivity(ctx.db, b.id, `${known.label} marked as sent${body.reference ? ` (${body.reference})` : ""}. Nothing more can be recorded in it.`, { actorId: ctx.user.id });
    await notify(ctx.db, b.id, `${known.label} sent`, { body: `${ctx.user.name} marked it as sent. Its figures are now locked.` });
    return { from: row.fromDate, to: row.toDate, label: row.label, reference: row.reference, lockedAt: row.lockedAt.toISOString(), lockedBy: ctx.user.name };
  });
}
