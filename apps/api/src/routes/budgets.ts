import { budgetsApi } from "@billingease/contracts";
import { rulesFor, today } from "@billingease/core";
import { budgets, businesses } from "@billingease/db/schema";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { logActivity } from "../lib/activity";
import { badRequest, notFound } from "../lib/errors";
import { route } from "../lib/route";
import { budgetsView, checkBudgetAlerts, settingsOf } from "../services/budgets";

/** Monthly budgets: a limit per category or for all spending, a Coming in target, a Yours to keep goal. */
export async function budgetRoutes(app: FastifyInstance) {
  route(app, budgetsApi.list, ({ ctx }) => budgetsView(ctx.db, ctx.business, today()));

  route(app, budgetsApi.save, async ({ body, ctx }) => {
    const b = ctx.business;
    const categoryId = body.kind === "category" ? body.categoryId! : "";
    if (body.kind === "category") {
      const cat = rulesFor(b.country).categories.find((c) => c.id === categoryId && c.scope === "business");
      if (!cat) throw badRequest("Pick one of your country's spending categories.", { categoryId: "Not a spending category" });
    }
    const [row] = await ctx.db.insert(budgets).values({ businessId: b.id, kind: body.kind, categoryId, amount: body.amount })
      .onConflictDoUpdate({ target: [budgets.businessId, budgets.kind, budgets.categoryId], set: { amount: body.amount, updatedAt: new Date() } })
      .returning();
    await logActivity(ctx.db, b.id, "Set a monthly budget", { actorId: ctx.user.id, link: "/app/budgets" });
    // A lower limit can mean it's already past 80% or over: say so now rather than at the next change.
    await checkBudgetAlerts(ctx.db, b, today());
    const view = await budgetsView(ctx.db, b, today());
    return view.budgets.find((s) => s.id === row.id)!;
  });

  route(app, budgetsApi.remove, async ({ params, ctx }) => {
    if (!/^[0-9a-f-]{36}$/i.test(params.id)) throw notFound("That budget");
    const gone = await ctx.db.delete(budgets).where(and(eq(budgets.id, params.id), eq(budgets.businessId, ctx.business.id))).returning();
    if (!gone.length) throw notFound("That budget");
    return { ok: true as const };
  });

  route(app, budgetsApi.settings, async ({ body, ctx }) => {
    const b = ctx.business;
    const s = settingsOf(b);
    await ctx.db.update(businesses).set({ settings: { ...b.settings, budgets: { alerts: body.alerts, weekly: body.weekly, weeklySent: s.weeklySent } } }).where(eq(businesses.id, b.id));
    return { alerts: body.alerts, weekly: body.weekly };
  });
}
