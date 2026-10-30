import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { trialBalance } from "@billingease/db";
import { activity, agentEvents, agentRuns, expenses, jobs, lockedPeriods, notifications, proposals } from "@billingease/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { propose } from "../src/agents/platform/proposals";
import { claim, drain, enqueue, onQueue } from "../src/agents/platform/queue";
import { APP_NAME } from "../src/agents/platform/runner";
import { DbSessionService } from "../src/agents/platform/session-service";
import { loadConfig } from "../src/config";
import { calls, fakeModels, text } from "./fake-models";
import { signUpWithBusiness } from "./helpers";
import { homeTestApp } from "./home-helpers";

const models = fakeModels(loadConfig({ NODE_ENV: "test" }));
let t: Awaited<ReturnType<typeof homeTestApp>>;
beforeAll(async () => { t = await homeTestApp({ models }); });
afterAll(() => t.close());

/** The database's own refusal (drizzle wraps it as the cause). */
async function refused(q: PromiseLike<unknown>, re: RegExp) {
  const err = await Promise.resolve(q).then(() => null, (e: Error & { cause?: Error }) => e);
  expect(err?.cause?.message ?? err?.message).toMatch(re);
}

const expenseBody = { spentOn: "2026-10-09", payee: "EE", categoryId: "office", gross: 4800, vat: 800, method: "card" };

async function aProposal(businessId: string, payload: Record<string, unknown> = expenseBody) {
  return propose(t.db, {
    businessId, runId: null, agent: "ask", kind: "expense.create", payload,
    title: "EE phone bill, £48", summary: "From the receipt photo: EE, 9 Oct, £48 with £8 VAT.", confidence: 92,
    sources: [{ kind: "note", label: "Receipt photo" }],
  });
}

describe("Proposals", () => {
  it("waits for a person, then applies through the expense endpoint with every check", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk", { vatRegistered: true, vatNumber: "GB123456789" });
    const p = await aProposal(business.id);

    // Nothing has happened to the books yet.
    expect(await t.db.select().from(expenses).where(eq(expenses.businessId, business.id))).toHaveLength(0);
    const list = await api.get("/proposals");
    expect(list.body.pending).toBe(1);
    expect(list.body.proposals[0]).toMatchObject({ id: p.id, agentName: "Ask", kind: "expense.create", status: "pending", confidence: 92, appliedHref: null });
    const [n] = await t.db.select().from(notifications).where(eq(notifications.businessId, business.id));
    expect(n).toMatchObject({ title: "Ask has something for you to check", link: "/app/check" });

    const ok = await api.post(`/proposals/${p.id}/approve`, {});
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ status: "applied", decidedBy: "Test Owner", edits: null });
    const [e] = await t.db.select().from(expenses).where(eq(expenses.businessId, business.id));
    expect(e).toMatchObject({ gross: 4800, vat: 800, payee: "EE", createdVia: "agent", proposalId: p.id });
    expect(ok.body.appliedHref).toBe(`/app/out/expenses/${e.id}`);
    const tb = await trialBalance(t.db, business.id);
    expect(tb.debit).toBe(4800);
    expect(tb.credit).toBe(tb.debit);
    const acts = await t.db.select().from(activity).where(eq(activity.businessId, business.id));
    expect(acts.some((a) => a.message.startsWith("Test Owner approved Ask's expense"))).toBe(true);

    // A second click (or another tab) changes nothing.
    const again = await api.post(`/proposals/${p.id}/approve`, {});
    expect(again.status).toBe(409);
    expect(await t.db.select().from(expenses).where(eq(expenses.businessId, business.id))).toHaveLength(1);
    expect((await api.get("/proposals")).body.pending).toBe(0);
    expect((await api.get("/proposals?status=decided")).body.proposals).toHaveLength(1);
  });

  it("records what a person changed before approving", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk", { vatRegistered: true, vatNumber: "GB123456789" });
    const p = await aProposal(business.id);
    const r = await api.post(`/proposals/${p.id}/approve`, { payload: { gross: 5400, vat: 900 } });
    expect(r.status).toBe(200);
    expect(r.body.edits).toEqual({ gross: [4800, 5400], vat: [800, 900] });
    const [e] = await t.db.select().from(expenses).where(eq(expenses.businessId, business.id));
    expect(e.gross).toBe(5400);
  });

  it("goes back to waiting with the reason when the endpoint says no, e.g. a locked period", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    await t.db.insert(lockedPeriods).values({ businessId: business.id, fromDate: "2026-07-06", toDate: "2026-10-05", label: "Q2 2026/27" });
    const p = await aProposal(business.id, { ...expenseBody, vat: 0, spentOn: "2026-09-01" });
    const r = await api.post(`/proposals/${p.id}/approve`, {});
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("period_locked");
    expect((await api.get(`/proposals/${p.id}`)).body).toMatchObject({ status: "pending", decidedBy: null, error: expect.stringContaining("locked") });
    expect(await t.db.select().from(expenses).where(eq(expenses.businessId, business.id))).toHaveLength(0);
    // Corrected to a date after the locked quarter, it goes in.
    const fixed = await api.post(`/proposals/${p.id}/approve`, { payload: { spentOn: "2026-10-08" } });
    expect(fixed.status).toBe(200);
    expect(fixed.body).toMatchObject({ status: "applied", error: null, edits: { spentOn: ["2026-09-01", "2026-10-08"] } });
  });

  it("can be turned down, and stays turned down", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const p = await aProposal(business.id, { ...expenseBody, vat: 0 });
    const r = await api.post(`/proposals/${p.id}/reject`, { reason: "Personal phone" });
    expect(r.body).toMatchObject({ status: "rejected", reason: "Personal phone" });
    expect((await api.post(`/proposals/${p.id}/approve`, {})).status).toBe(409);
    // The database refuses to reopen or change it, whatever the app does.
    await refused(t.db.update(proposals).set({ status: "pending" }).where(eq(proposals.id, p.id)), /already rejected/);
    await refused(t.db.delete(proposals).where(eq(proposals.id, p.id)), /kept/);
  });

  it("refuses a payload the endpoint would refuse, and a pending payload can't be swapped", async () => {
    const { business } = await signUpWithBusiness(t.app, "uk");
    await expect(aProposal(business.id, { ...expenseBody, gross: -5 })).rejects.toThrow(/doesn't fit/);
    const p = await aProposal(business.id, { ...expenseBody, vat: 0 });
    await refused(t.db.update(proposals).set({ payload: { ...expenseBody, gross: 999999 } }).where(eq(proposals.id, p.id)), /payload changes only/);
  });

  it("belongs to one business", async () => {
    const { business } = await signUpWithBusiness(t.app, "uk");
    const p = await aProposal(business.id, { ...expenseBody, vat: 0 });
    const other = await signUpWithBusiness(t.app, "uk");
    expect((await other.api.get(`/proposals/${p.id}`)).status).toBe(404);
    expect((await other.api.post(`/proposals/${p.id}/approve`, {})).status).toBe(404);
    expect((await other.api.get("/proposals")).body.pending).toBe(0);
  });

  it("expires after 30 days", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const p = await aProposal(business.id, { ...expenseBody, vat: 0 });
    await t.db.update(proposals).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(proposals.id, p.id));
    expect((await api.get(`/proposals/${p.id}`)).body.status).toBe("expired");
    expect((await api.post(`/proposals/${p.id}/approve`, {})).status).toBe(409);
  });
});

describe("Budgets and settings", () => {
  it("stops a run when the month's budget is used up, and lists usage", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    // A tiny cap: one call costs more than it.
    const set = await api.put("/agents/ask", { enabled: true, monthlyBudgetMicros: 1000 });
    expect(set.status).toBe(200);
    expect(set.body).toMatchObject({ agent: "ask", enabled: true, monthlyBudgetMicros: 1000, model: "gemini-4-argon" });
    models.llm.script.push(calls([{ name: "get_business_profile", args: {} }]), text("Done."));
    const first = await api.post("/ask", { question: "Who am I in the books?" });
    expect(first.status).toBe(429);
    expect(first.body.error.code).toBe("agent_budget_reached");
    models.llm.script.length = 0;
    // The next question doesn't even start.
    const second = await api.post("/ask", { question: "And now?" });
    expect(second.status).toBe(429);

    const usage = await api.get("/agents/usage");
    expect(usage.body).toMatchObject({ setUp: true, month: "2026-10-01", budgetMicros: 5_000_000 });
    expect(usage.body.agents.find((a: { agent: string }) => a.agent === "ask")).toMatchObject({ runs: 1, costMicros: expect.any(Number) });
    const runs = await api.get("/agents/runs");
    expect(runs.body.runs[0]).toMatchObject({ agent: "ask", status: "stopped", error: expect.stringContaining("budget") });
    const run = await api.get(`/agents/runs/${runs.body.runs[0].id}`);
    expect(run.body.steps.map((s: { kind: string }) => s.kind)).toEqual(["model", "tool"]);
  });

  it("an agent turned off doesn't run", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    await api.put("/agents/ask", { enabled: false });
    const r = await api.post("/ask", { question: "Anything?" });
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("agent_off");
    expect((await api.put("/agents/nope", { enabled: true })).status).toBe(404);
  });
});

describe("Sessions", () => {
  it("are kept per business: another business can't load one", async () => {
    const a = await signUpWithBusiness(t.app, "uk");
    const b = await signUpWithBusiness(t.app, "lk");
    const mine = new DbSessionService(t.db, { businessId: a.business.id });
    const s = await mine.createSession({ appName: APP_NAME, userId: "u1", state: { x: 1 } });
    expect((await mine.getSession({ appName: APP_NAME, userId: "u1", sessionId: s.id }))?.state).toEqual({ x: 1 });
    const theirs = new DbSessionService(t.db, { businessId: b.business.id });
    expect(await theirs.getSession({ appName: APP_NAME, userId: "u1", sessionId: s.id })).toBeUndefined();
    expect((await theirs.listSessions({ appName: APP_NAME })).totalItems).toBe(0);
  });

  it("keep events append-only", async () => {
    const [ev] = await t.db.select().from(agentEvents).limit(1);
    expect(ev).toBeDefined();
    await refused(t.db.update(agentEvents).set({ author: "someone" }).where(and(eq(agentEvents.sessionId, ev.sessionId), eq(agentEvents.seq, ev.seq))), /append-only/);
  });
});

describe("Queue", () => {
  it("runs each job once, dedupes, and retries a failure", async () => {
    const seen: string[] = [];
    let fail = true;
    onQueue("test-agent", async (_app, job) => {
      seen.push(String(job.payload.n));
      if (job.payload.n === 2 && fail) {
        fail = false;
        throw new Error("flaky");
      }
    });
    const { business } = await signUpWithBusiness(t.app, "uk");
    expect(await enqueue(t.db, { queue: "test-agent", businessId: business.id, payload: { n: 1 }, dedupeKey: `x:${business.id}` })).not.toBeNull();
    // The same key while one is open: refused.
    expect(await enqueue(t.db, { queue: "test-agent", businessId: business.id, payload: { n: 9 }, dedupeKey: `x:${business.id}` })).toBeNull();
    await enqueue(t.db, { queue: "test-agent", businessId: business.id, payload: { n: 2 } });
    expect(await drain(t.app)).toBe(2);
    expect(seen).toEqual(["1", "2"]);
    const [retry] = await t.db.select().from(jobs).where(sql`${jobs.payload}->>'n' = '2'`);
    expect(retry).toMatchObject({ status: "queued", attempts: 1, error: "flaky" });
    // Not due yet.
    expect(await claim(t.db, "w")).toBeNull();
    await t.db.update(jobs).set({ runAt: new Date(Date.now() - 1000) }).where(eq(jobs.id, retry.id));
    expect(await drain(t.app)).toBe(1);
    expect((await t.db.select().from(jobs).where(eq(jobs.id, retry.id)))[0].status).toBe("done");
    // Once done, the key is free again.
    expect(await enqueue(t.db, { queue: "test-agent", businessId: business.id, payload: { n: 3 }, dedupeKey: `x:${business.id}` })).not.toBeNull();
    await drain(t.app);
  });
});

describe("Runs", () => {
  it("are listed for the business only", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "lk");
    models.llm.script.push(text("Hello."));
    expect((await api.post("/ask", { question: "Say hello" })).status).toBe(200);
    const runs = await t.db.select().from(agentRuns).where(eq(agentRuns.businessId, business.id));
    expect(runs).toHaveLength(1);
    const other = await signUpWithBusiness(t.app, "lk");
    expect((await other.api.get(`/agents/runs/${runs[0].id}`)).status).toBe(404);
    expect((await other.api.get("/agents/runs")).body.runs).toEqual([]);
  });
});
