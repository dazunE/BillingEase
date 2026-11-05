import type { BudgetSettings, BudgetsView, BudgetState, BudgetStatus } from "@billingease/contracts";
import { formatMoney, rulesFor, type IsoDate } from "@billingease/core";
import type { Exec } from "@billingease/db";
import { budgets, businesses } from "@billingease/db/schema";
import { eq } from "drizzle-orm";
import { notify } from "../lib/activity";
import type { BusinessRow } from "../lib/context";
import { categoryTotals } from "./books";
import { threeNumbers } from "./home";
import { comingIn, goingOut } from "./summary";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The calendar month a day is in: budgets reset on the 1st. */
export function monthOf(d: IsoDate) {
  const y = Number(d.slice(0, 4)), m = Number(d.slice(5, 7));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { key: d.slice(0, 7), from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(days)}`, label: `${MONTHS[m - 1]} ${y}`, name: MONTHS[m - 1], days, day: Number(d.slice(8, 10)) };
}

function previousMonth(d: IsoDate) {
  const y = Number(d.slice(0, 4)), m = Number(d.slice(5, 7));
  return monthOf(m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, "0")}-01`);
}

/** How a budget stands, from what's happened so far and how far into the month we are. */
export function stateOf(isGoal: boolean, pct: number, pctWithExtra: number, pace: number): BudgetState {
  if (isGoal) return pct >= 100 ? "met" : pctWithExtra >= 100 ? "on_course" : pct >= pace ? "on_track" : "behind";
  return pct >= 100 ? "over" : pct >= 80 ? "nearly" : pct > pace + 20 ? "fast" : "ok";
}

const pctOf = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

export function settingsOf(b: BusinessRow): BudgetSettings & { weeklySent: string | null } {
  const s = (b.settings?.budgets ?? {}) as Partial<BudgetSettings & { weeklySent: string | null }>;
  return { alerts: s.alerts ?? true, weekly: s.weekly ?? true, weeklySent: s.weeklySent ?? null };
}

const NAMES = { spending: "All spending", income: "Coming in target", keep: "Yours to keep goal" } as const;

/** Every budget for the month `today` is in, worked out from the books. */
export async function budgetsView(db: Exec, b: BusinessRow, today: IsoDate): Promise<BudgetsView> {
  const month = monthOf(today), prev = previousMonth(today);
  const pace = pctOf(month.day, month.days);
  const rows = await db.select().from(budgets).where(eq(budgets.businessId, b.id));
  const cats = rulesFor(b.country).categories;
  const [now, before] = await Promise.all([categoryTotals(db, b, month.from, month.to), categoryTotals(db, b, prev.from, prev.to)]);
  const spentNow = new Map(now.categories.map((c) => [c.categoryId, c.amount]));
  const spentBefore = new Map(before.categories.map((c) => [c.categoryId, c.amount]));
  const needs = new Set(rows.map((r) => r.kind));
  const [out, outPrev, inn, innPrev, nums, numsPrev] = await Promise.all([
    needs.has("spending") ? goingOut(db, b.id, month.from, month.to, today) : null,
    needs.has("spending") ? goingOut(db, b.id, prev.from, prev.to, today) : null,
    needs.has("income") ? comingIn(db, b.id, month.from, month.to, today) : null,
    needs.has("income") ? comingIn(db, b.id, prev.from, prev.to, today) : null,
    needs.has("keep") ? threeNumbers(db, b, "month", today) : null,
    needs.has("keep") ? threeNumbers(db, b, "month", prev.to) : null,
  ]);

  const order = { keep: 0, income: 1, spending: 2, category: 3 } as const;
  const list: BudgetStatus[] = rows.sort((x, y) => order[x.kind] - order[y.kind]).map((r) => {
    const isGoal = r.kind === "income" || r.kind === "keep";
    const cat = r.kind === "category" ? cats.find((c) => c.id === r.categoryId) : undefined;
    let actual = 0, extra = 0, lastMonth: number | null = null;
    if (r.kind === "category") { actual = spentNow.get(r.categoryId) ?? 0; lastMonth = spentBefore.get(r.categoryId) ?? 0; }
    if (r.kind === "spending") { actual = out!.paid; extra = out!.toPay; lastMonth = outPrev!.total; }
    if (r.kind === "income") { actual = inn!.received; extra = inn!.onTheWay; lastMonth = innPrev!.received; }
    if (r.kind === "keep") { actual = Math.max(0, nums!.keep); lastMonth = numsPrev!.keep; }
    const pct = pctOf(actual, r.amount), pctWithExtra = pctOf(actual + extra, r.amount);
    return {
      id: r.id, kind: r.kind, categoryId: r.kind === "category" ? r.categoryId : null,
      name: cat?.name ?? (r.kind === "category" ? r.categoryId : NAMES[r.kind]), official: cat?.official ?? null,
      amount: r.amount, actual, extra, pct, pctWithExtra, lastMonth,
      projected: month.day > 0 ? Math.round((actual * month.days) / month.day) : actual,
      state: stateOf(isGoal, pct, pctWithExtra, pace), isGoal,
    };
  });

  const budgeted = new Set(rows.filter((r) => r.kind === "category").map((r) => r.categoryId));
  const ideas = cats
    .filter((c) => c.scope === "business" && !budgeted.has(c.id) && c.id !== "capital" && ((spentBefore.get(c.id) ?? 0) > 0 || (spentNow.get(c.id) ?? 0) > 0))
    .map((c) => ({ categoryId: c.id, name: c.name, lastMonth: spentBefore.get(c.id) ?? 0, thisMonth: spentNow.get(c.id) ?? 0 }))
    .sort((x, y) => y.lastMonth - x.lastMonth || y.thisMonth - x.thisMonth)
    .slice(0, 6);

  const s = settingsOf(b);
  return { month: { from: month.from, to: month.to, label: month.label, day: month.day, days: month.days, pace }, budgets: list, ideas, settings: { alerts: s.alerts, weekly: s.weekly } };
}

/**
 * Sends a notification for each limit that has reached 80% or gone over since the last check,
 * once per level per month. Safe to run as often as you like.
 */
export async function checkBudgetAlerts(db: Exec, b: BusinessRow, today: IsoDate) {
  const view = await budgetsView(db, b, today);
  const month = monthOf(today);
  const rows = await db.select().from(budgets).where(eq(budgets.businessId, b.id));
  const sent: string[] = [];
  const settings = settingsOf(b);
  for (const s of view.budgets) {
    if (s.isGoal) continue;
    const row = rows.find((r) => r.id === s.id)!;
    const level = s.pct >= 100 ? 100 : s.pct >= 80 ? 80 : 0;
    const had = row.alertMonth === month.key ? row.alertLevel : 0;
    if (level <= had) continue;
    await db.update(budgets).set({ alertMonth: month.key, alertLevel: level }).where(eq(budgets.id, row.id));
    if (!settings.alerts) continue;
    const m = (n: number) => formatMoney(n, b.currency, { decimals: "never" });
    const daysLeft = month.days - month.day;
    if (level === 100) {
      await notify(db, b.id, `${s.name} is over budget`, { body: `${m(s.actual)} of ${m(s.amount)} this month, with ${daysLeft} ${daysLeft === 1 ? "day" : "days"} to go.`, link: "/app/budgets" });
    } else {
      await notify(db, b.id, `${s.name}: ${s.pct}% of the budget used`, { body: `${m(s.amount - s.actual)} left of ${m(s.amount)} for the rest of ${month.name}.`, link: "/app/budgets" });
    }
    sent.push(s.id);
  }
  return sent;
}

/** The Monday notification about every budget. */
export function weeklyText(view: BudgetsView) {
  const limits = view.budgets.filter((s) => !s.isGoal);
  const over = limits.filter((s) => s.state === "over");
  const close = limits.filter((s) => s.state === "nearly" || s.state === "fast");
  const fine = limits.length - over.length - close.length;
  const keep = view.budgets.find((s) => s.kind === "keep");
  const parts: string[] = [];
  if (over.length) parts.push(`${over.map((s) => s.name).join(", ")} ${over.length === 1 ? "is" : "are"} over.`);
  if (close.length) parts.push(`${close.length} close to the limit.`);
  if (fine) parts.push(`${fine} on track.`);
  if (keep) parts.push(`Yours to keep: ${keep.pct}% of your goal.`);
  return parts.join(" ") || "No budgets set yet.";
}

const ZONE = { uk: "Europe/London", lk: "Asia/Colombo", us: "America/New_York" } as const;

/** Monday from 8am in the business's country, once a week. */
export function weeklyDue(country: keyof typeof ZONE, now: Date, lastSent: string | null) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: ZONE[country], weekday: "short", hour: "numeric", hour12: false, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(now).map((p) => [p.type, p.value]));
  const localDay = `${parts.year}-${parts.month}-${parts.day}`;
  return parts.weekday === "Mon" && Number(parts.hour) >= 8 && lastSent !== localDay ? localDay : null;
}

export async function sendWeekly(db: Exec, b: BusinessRow, today: IsoDate, localDay: string) {
  const view = await budgetsView(db, b, today);
  if (!view.budgets.length) return false;
  await notify(db, b.id, "Your budgets this week", { body: weeklyText(view), link: "/app/budgets" });
  const s = settingsOf(b);
  await db.update(businesses).set({ settings: { ...b.settings, budgets: { alerts: s.alerts, weekly: s.weekly, weeklySent: localDay } } }).where(eq(businesses.id, b.id));
  return true;
}
