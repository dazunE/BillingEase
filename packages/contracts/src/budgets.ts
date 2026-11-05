import { z } from "zod";
import { endpoint, IsoDate, Minor, Ok } from "./endpoint";

/**
 * Monthly budgets, the same every month. A limit for one spending category or for all spending,
 * a Coming in target, or a Yours to keep goal. Where each stands is worked out from the books.
 */
export const BudgetKind = z.enum(["category", "spending", "income", "keep"]);
export type BudgetKind = z.infer<typeof BudgetKind>;

/**
 * Limits: ok, fast (spending faster than the month is passing), nearly (80%+), over.
 * Goals: behind, on_track (at or above the month's pace), on_course (with what's on the way), met.
 */
export const BudgetState = z.enum(["ok", "fast", "nearly", "over", "behind", "on_track", "on_course", "met"]);
export type BudgetState = z.infer<typeof BudgetState>;

export const BudgetStatus = z.object({
  id: z.string(),
  kind: BudgetKind,
  categoryId: z.string().nullable(),
  name: z.string(),
  /** The category's official heading (HMRC box, IRD line). */
  official: z.string().nullable(),
  /** The monthly limit or goal. */
  amount: Minor,
  /** Spent (limits) or reached (goals) so far this month. */
  actual: Minor,
  /** Still to come this month: bills and payroll due (all spending), invoices on the way (Coming in). */
  extra: Minor,
  pct: z.number().int(),
  /** With `extra` counted too. */
  pctWithExtra: z.number().int(),
  /** Last month's figure, for comparison and suggestions. */
  lastMonth: Minor.nullable(),
  /** Where the month ends if it carries on at this pace. */
  projected: Minor,
  state: BudgetState,
  isGoal: z.boolean(),
});
export type BudgetStatus = z.infer<typeof BudgetStatus>;

export const BudgetSettings = z.object({
  /** A notification when a limit reaches 80% and when it goes over. */
  alerts: z.boolean(),
  /** One notification on Monday morning about every budget. */
  weekly: z.boolean(),
});
export type BudgetSettings = z.infer<typeof BudgetSettings>;

export const BudgetsView = z.object({
  month: z.object({ from: IsoDate, to: IsoDate, label: z.string(), day: z.number().int(), days: z.number().int(), pace: z.number().int() }),
  budgets: z.array(BudgetStatus),
  /** Categories with spending but no budget yet, most spent last month first. */
  ideas: z.array(z.object({ categoryId: z.string(), name: z.string(), lastMonth: Minor, thisMonth: Minor })),
  settings: BudgetSettings,
});
export type BudgetsView = z.infer<typeof BudgetsView>;

export const BudgetBody = z.object({
  kind: BudgetKind,
  /** For a category budget: the country's category id. */
  categoryId: z.string().trim().max(40).optional().nullable(),
  amount: z.number({ message: "Enter an amount" }).int().positive("Enter an amount more than 0"),
}).refine((b) => b.kind !== "category" || !!b.categoryId, { path: ["categoryId"], message: "Pick a category" });
export type BudgetBody = z.input<typeof BudgetBody>;

export const budgetsApi = {
  list: endpoint({ method: "GET", path: "/budgets", response: BudgetsView }),
  /** Adds a budget, or changes the amount of the one already there for that kind (and category). */
  save: endpoint({ method: "PUT", path: "/budgets", body: BudgetBody, roles: ["owner", "admin"], response: BudgetStatus }),
  remove: endpoint({ method: "DELETE", path: "/budgets/:id", roles: ["owner", "admin"], response: Ok }),
  settings: endpoint({ method: "PUT", path: "/budgets/settings", body: BudgetSettings, roles: ["owner", "admin"], response: BudgetSettings }),
};
