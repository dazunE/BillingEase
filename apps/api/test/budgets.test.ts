import { businesses, notifications } from "@billingease/db/schema";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { budgetAlertsJob, budgetWeeklyJob } from "../src/services/budget-jobs";
import { monthOf, stateOf, weeklyDue } from "../src/services/budgets";
import { signUpWithBusiness, testApp } from "./helpers";

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp(); });
afterAll(() => t.close());

// BILLINGEASE_TODAY is 2026-10-11 in the API tests: day 11 of 31, 35% through October.
const expense = (spentOn: string, payee: string, categoryId: string | null, gross: number) => ({ spentOn, payee, categoryId, gross, method: "Card" });
const titles = async (businessId: string) => (await t.db.select().from(notifications).where(eq(notifications.businessId, businessId))).map((n) => n.title);

describe("budgets", () => {
  it("works out a category limit from the books, with last month and the month's pace", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    await api.post("/out/expenses", expense("2026-10-02", "LNER", "travel", 4000));
    await api.post("/out/expenses", expense("2026-10-09", "Trainline", "travel", 2000));
    await api.post("/out/expenses", expense("2026-09-12", "LNER", "travel", 9000));
    await api.post("/out/expenses", expense("2026-10-05", "Ryman", "office", 1500));

    const saved = await api.put("/budgets", { kind: "category", categoryId: "travel", amount: 15000 });
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({ kind: "category", categoryId: "travel", amount: 15000, actual: 6000, pct: 40, lastMonth: 9000, isGoal: false });
    expect(saved.body.projected).toBe(Math.round((6000 * 31) / 11));

    const v = await api.get("/budgets");
    expect(v.body.month).toMatchObject({ from: "2026-10-01", to: "2026-10-31", label: "October 2026", day: 11, days: 31, pace: 35 });
    expect(v.body.budgets).toHaveLength(1);
    // Office has spending and no budget yet: it's offered as an idea.
    expect(v.body.ideas.map((i: { categoryId: string }) => i.categoryId)).toContain("office");
    expect(v.body.ideas.map((i: { categoryId: string }) => i.categoryId)).not.toContain("travel");
  });

  it("changes the amount rather than adding a second budget for the same thing, and removes one", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const a = await api.put("/budgets", { kind: "spending", amount: 100000 });
    const b = await api.put("/budgets", { kind: "spending", amount: 120000 });
    expect(b.body.id).toBe(a.body.id);
    expect(b.body.amount).toBe(120000);
    expect((await api.get("/budgets")).body.budgets).toHaveLength(1);
    expect((await api.del(`/budgets/${a.body.id}`)).status).toBe(200);
    expect((await api.get("/budgets")).body.budgets).toHaveLength(0);
  });

  it("refuses a category that isn't a spending category, and keeps businesses apart", async () => {
    const one = await signUpWithBusiness(t.app, "uk");
    const other = await signUpWithBusiness(t.app, "uk");
    expect((await one.api.put("/budgets", { kind: "category", categoryId: "sales", amount: 1000 })).status).toBe(400);
    expect((await one.api.put("/budgets", { kind: "category", amount: 1000 })).status).toBe(400);
    const mine = await one.api.put("/budgets", { kind: "keep", amount: 400000 });
    expect((await other.api.del(`/budgets/${mine.body.id}`)).status).toBe(404);
    expect((await other.api.get("/budgets")).body.budgets).toHaveLength(0);
  });

  it("follows Coming in and Yours to keep as goals", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk");
    const c = await api.post("/customers", { name: "Colombo Dental Clinic" });
    const inv = await api.post("/invoices", { customerId: c.body.id, issueDate: "2026-10-03", dueDate: "2026-11-02", lines: [{ description: "Signage", quantityMilli: 1000, unitPrice: 10000000 }] });
    await api.post(`/invoices/${inv.body.id}/issue`, { email: false });
    const income = await api.put("/budgets", { kind: "income", amount: 20000000 });
    expect(income.body).toMatchObject({ isGoal: true, actual: 0, state: "behind" });
    expect(income.body.extra).toBeGreaterThan(0);
    const keep = await api.put("/budgets", { kind: "keep", amount: 100 });
    expect(keep.body.isGoal).toBe(true);
    expect(["met", "on_track", "behind", "on_course"]).toContain(keep.body.state);
  });

  it("alerts once at 80% and once when over, and not again the same month", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    await api.put("/budgets", { kind: "category", categoryId: "travel", amount: 10000 });
    await api.post("/out/expenses", expense("2026-10-04", "LNER", "travel", 8500));
    await budgetAlertsJob(t.db);
    expect(await titles(business.id)).toContain("Car, van and travel: 85% of the budget used");
    await budgetAlertsJob(t.db);
    expect((await titles(business.id)).filter((x) => x.includes("85%"))).toHaveLength(1);
    await api.post("/out/expenses", expense("2026-10-10", "Trainline", "travel", 2000));
    await budgetAlertsJob(t.db);
    expect(await titles(business.id)).toContain("Car, van and travel is over budget");
    await budgetAlertsJob(t.db);
    expect((await titles(business.id)).filter((x) => x.includes("over budget"))).toHaveLength(1);
  });

  it("stays quiet when alerts are off, and sends the Monday summary once", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    expect((await api.put("/budgets/settings", { alerts: false, weekly: true })).body).toEqual({ alerts: false, weekly: true });
    await api.put("/budgets", { kind: "category", categoryId: "office", amount: 1000 });
    await api.post("/out/expenses", expense("2026-10-04", "Ryman", "office", 5000));
    await budgetAlertsJob(t.db);
    expect((await titles(business.id)).some((x) => x.includes("over budget"))).toBe(false);
    expect((await api.get("/budgets")).body.settings).toEqual({ alerts: false, weekly: true });

    const monday9am = new Date("2026-10-12T08:30:00Z"); // 09:30 in London
    await budgetWeeklyJob(t.db, monday9am);
    await budgetWeeklyJob(t.db, monday9am);
    const weekly = (await t.db.select().from(notifications).where(eq(notifications.businessId, business.id))).filter((n) => n.title === "Your budgets this week");
    expect(weekly).toHaveLength(1);
    expect(weekly[0].body).toContain("Phone, internet and office is over.");
    const [b] = await t.db.select().from(businesses).where(eq(businesses.id, business.id));
    expect((b.settings.budgets as { weeklySent: string }).weeklySent).toBe("2026-10-12");
  });
});

describe("budget rules", () => {
  it("knows the month", () => {
    expect(monthOf("2026-02-11")).toMatchObject({ from: "2026-02-01", to: "2026-02-28", days: 28, day: 11, label: "February 2026" });
    expect(monthOf("2028-02-03").days).toBe(29);
  });
  it("names the state of a limit and of a goal", () => {
    expect(stateOf(false, 40, 40, 35)).toBe("ok");
    expect(stateOf(false, 60, 60, 35)).toBe("fast");
    expect(stateOf(false, 85, 85, 35)).toBe("nearly");
    expect(stateOf(false, 101, 101, 35)).toBe("over");
    expect(stateOf(true, 20, 20, 35)).toBe("behind");
    expect(stateOf(true, 40, 60, 35)).toBe("on_track");
    expect(stateOf(true, 50, 110, 35)).toBe("on_course");
    expect(stateOf(true, 100, 100, 35)).toBe("met");
  });
  it("sends the summary on Monday from 8am local time, once", () => {
    expect(weeklyDue("uk", new Date("2026-10-12T06:30:00Z"), null)).toBeNull(); // 07:30 London
    expect(weeklyDue("uk", new Date("2026-10-12T07:30:00Z"), null)).toBe("2026-10-12");
    expect(weeklyDue("uk", new Date("2026-10-12T07:30:00Z"), "2026-10-12")).toBeNull();
    expect(weeklyDue("lk", new Date("2026-10-12T02:45:00Z"), null)).toBe("2026-10-12"); // 08:15 Colombo
    expect(weeklyDue("uk", new Date("2026-10-13T09:00:00Z"), null)).toBeNull(); // Tuesday
  });
});
