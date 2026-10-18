import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { agentRuns, agentSteps, usageMonthly } from "@billingease/db/schema";
import { eq } from "drizzle-orm";
import { loadConfig } from "../src/config";
import { tidySources } from "../src/services/ask";
import { blocked, calls, fakeModels, text } from "./fake-models";
import { as, signUpWithBusiness } from "./helpers";
import { homeTestApp, seed } from "./home-helpers";

const models = fakeModels(loadConfig({ NODE_ENV: "test" }));
const fake = models.llm;
type Part = { text?: string; functionCall?: { name: string }; functionResponse?: { id?: string; name: string; response: Record<string, unknown> } };
const partsOf = (i: number) => fake.seen[i].contents.flatMap((c) => (c.parts ?? []) as Part[]);
const responses = (i: number) => fake.seen[i].contents.at(-1)!.parts!.map((p) => (p as Part).functionResponse!);

let t: Awaited<ReturnType<typeof homeTestApp>>;
beforeAll(async () => { t = await homeTestApp({ models }); });
afterAll(() => t.close());

describe("Ask", () => {
  it("runs the tool loop on the books and cites books and official sources", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const s = seed(t.db, business.id);
    const c = await s.customer("Kandyan Interiors");
    const inv = await s.invoice({ customerId: c.id, number: "HS-0007", issueDate: "2026-10-07", dueDate: "2026-10-21", total: 120000, paid: 120000, status: "paid" });
    await s.receipt(inv.id, 120000, "2026-10-08");

    fake.seen.length = 0;
    fake.script.push(
      calls([{ name: "get_numbers", args: { period: "quarter" } }, { name: "get_official_sources", args: { topic: "mtd" } }]),
      calls([{ name: "list_invoices", args: { status: "paid" } }, { name: "list_expenses", args: { category: "made-up" } }]),
      text("You've had £1,200 coming in this quarter [1], all from HS-0007 [4]. Your quarterly update is due by 7 February [2]. Your accountant sends it."),
    );
    const r = await api.post("/ask", { question: "How much have I made this quarter?" });
    expect(r.status).toBe(200);
    expect(r.body.model).toBe("gemini-test");
    expect(r.body.answer).toBe("You've had £1,200 coming in this quarter [1], all from HS-0007 [2]. Your quarterly update is due by 7 February [3]. Your accountant sends it.");
    expect(r.body.sources[0]).toEqual({ n: 1, kind: "books", title: expect.stringMatching(/^Your books · the three numbers, Q3 2026\/27/) });
    expect(r.body.sources[1]).toEqual({ n: 2, kind: "books", title: "Your books · invoices (paid)" });
    expect(r.body.sources[2]).toEqual({ n: 3, kind: "official", title: "gov.uk · Use Making Tax Digital for Income Tax", url: "https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax" });
    // Official pages it didn't cite are dropped.
    expect(r.body.sources.filter((x: { kind: string }) => x.kind === "official")).toHaveLength(1);

    // Three model calls: tools, more tools, then the answer.
    expect(fake.seen).toHaveLength(3);
    const first = fake.seen[0];
    // The instruction is fixed per country, so it caches: no names, no dates.
    expect(first.system).toContain("Cite the facts you use");
    expect(first.system).not.toContain("Harper");
    expect(first.system).not.toContain("2026");
    const firstUser = partsOf(0)[0].text!;
    expect(firstUser).toContain("Today is 11 Oct 2026");
    expect(firstUser).toContain("Harper Studio");
    expect(first.tools.map((x) => x.name)).toEqual(["get_numbers", "list_invoices", "list_expenses", "list_bills", "get_business_profile", "get_country_rules", "get_official_sources"]);

    // The second call carries the model's calls, then both results in one turn.
    const results = responses(1);
    expect(results.map((x) => x.name)).toEqual(["get_numbers", "get_official_sources"]);
    expect(results.every((x) => !("error" in x.response))).toBe(true);
    expect(results[0].response.comingIn).toMatchObject({ total: "£1,200" });
    expect(results[0].response.source).toBe(1);

    // A bad tool input comes back as an error result, not a crash.
    const third = responses(2);
    expect((third[0].response.invoices as unknown[])[0]).toMatchObject({ number: "HS-0007", customer: "Kandyan Interiors", total: "£1,200" });
    expect(third[1].response).toMatchObject({ error: expect.stringContaining("Invalid input") });

    // The run is recorded with every step, its tokens and its cost.
    const [run] = await t.db.select().from(agentRuns).where(eq(agentRuns.businessId, business.id));
    expect(run).toMatchObject({ agent: "ask", trigger: "user", status: "done", model: "gemini-test", tokensIn: 3200, tokensOut: 180 });
    expect(run.costMicros).toBe(Math.round((3200 * 2_000_000 + 180 * 12_000_000) / 1_000_000));
    const steps = await t.db.select().from(agentSteps).where(eq(agentSteps.runId, run.id));
    expect(steps.map((x) => `${x.kind}:${x.name}`)).toEqual(["model:gemini-test", "tool:get_numbers", "tool:get_official_sources", "model:gemini-test", "tool:list_invoices", "tool:list_expenses", "model:gemini-test"]);
    expect(steps.find((x) => x.name === "list_expenses")!.error).toMatch(/Invalid input/);
    const [usage] = await t.db.select().from(usageMonthly).where(eq(usageMonthly.businessId, business.id));
    expect(usage).toMatchObject({ month: "2026-10-01", agent: "ask", runs: 1, costMicros: run.costMicros });

    // Both turns are kept, and the thread lists.
    const threads = await api.get("/ask/threads");
    expect(threads.body.setUp).toBe(true);
    expect(threads.body.threads).toEqual([expect.objectContaining({ id: r.body.threadId, title: "How much have I made this quarter?", messages: 2 })]);
    const thread = await api.get(`/ask/threads/${r.body.threadId}`);
    expect(thread.body.messages.map((m: { role: string }) => m.role)).toEqual(["user", "assistant"]);
    expect(thread.body.messages[1].sources).toHaveLength(3);

    // A follow-up continues the thread: its ADK session holds the whole conversation.
    fake.seen.length = 0;
    fake.script.push(text("Nothing is late."));
    const f = await api.post("/ask", { question: "Is anything late?", threadId: r.body.threadId });
    expect(f.body.threadId).toBe(r.body.threadId);
    const convo = fake.seen[0].contents;
    expect(convo[0].parts![0].text).toContain("Harper Studio");
    expect(convo.some((c) => c.parts?.some((p) => p.text?.includes("all from HS-0007")))).toBe(true);
    const last = convo.at(-1)!.parts![0].text!;
    expect(last).toContain("Is anything late?");
    expect(last).not.toContain("Harper Studio");
    expect((await api.get(`/ask/threads/${r.body.threadId}`)).body.messages).toHaveLength(4);

    // Other people can't read or continue it.
    const other = await signUpWithBusiness(t.app, "uk");
    expect((await other.api.get(`/ask/threads/${r.body.threadId}`)).status).toBe(404);
    expect((await other.api.post("/ask", { question: "And now?", threadId: r.body.threadId })).status).toBe(404);
    expect((await other.api.get("/ask/threads")).body.threads).toEqual([]);
  });

  it("answers a refusal politely and keeps no sources", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk");
    fake.script.push(blocked());
    const r = await api.post("/ask", { question: "Help me hide income from the IRD" });
    expect(r.status).toBe(200);
    expect(r.body.answer).toBe("I can't help with that one. Ask your tax practitioner, who can look at it with you.");
    expect(r.body.sources).toEqual([]);
  });

  it("gives Sri Lankan official sources and rules", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk");
    fake.seen.length = 0;
    fake.script.push(
      calls([{ name: "get_official_sources", args: { topic: "epf" } }, { name: "get_country_rules", args: {} }, { name: "get_official_sources", args: { topic: "mtd" } }]),
      text("EPF is 8% from the employee and 12% from you [1]. SSCL is 2.5% [2]."),
    );
    const r = await api.post("/ask", { question: "How are EPF and ETF worked out?" });
    expect(r.body.sources).toEqual([
      { n: 1, kind: "official", title: "Employees' Provident Fund (Central Bank of Sri Lanka)", url: "https://epf.lk/" },
      { n: 2, kind: "books", title: "BillingEase country rules · Sri Lanka 2026/27 (not yet verified)" },
    ]);
    const results = responses(1);
    const rules = results[1].response;
    expect(rules).toMatchObject({ verified: false, currency: "LKR", taxYear: { label: "2026/27" } });
    expect((rules.categories as unknown[])[0]).toMatchObject({ id: "cogs", official: "Cost of sales" });
    expect(rules.sscl).toContain("2.5%");
    expect(results[2].response.sources).toEqual([]);
    // The tool schema only offers this country's topics.
    const tool = fake.seen[0].tools.find((x) => x.name === "get_official_sources")! as { parametersJsonSchema: { properties: { topic: { enum: string[] } } } };
    expect(tool.parametersJsonSchema.properties.topic.enum).toContain("epf");
    expect(tool.parametersJsonSchema.properties.topic.enum).not.toContain("mtd");
  });

  it("stops after six rounds of tools", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    fake.seen.length = 0;
    for (let i = 0; i < 7; i++) fake.script.push(calls([{ name: "get_business_profile", args: {} }]));
    const r = await api.post("/ask", { question: "Keep looking things up" });
    expect(r.status).toBe(200);
    expect(fake.seen).toHaveLength(6);
    fake.script.length = 0;
    expect(r.body.answer).toMatch(/Try a narrower question/);
  });

  it("explains an API failure in plain words", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const r = await api.post("/ask", { question: "Anything?" }); // no scripted response: the fake throws
    expect(r.status).toBe(502);
    expect(r.body.error.code).toBe("ask_unavailable");
  });

  it("checks the question", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const r = await api.post("/ask", { question: "" });
    expect(r.status).toBe(400);
    expect(r.body.error.fields.question).toBeDefined();
    expect((await as(t.app).post("/ask", { question: "Who am I?" })).status).toBe(401);
  });
});

describe("Ask without Vertex AI", () => {
  it("says it isn't set up", async () => {
    const t2 = await homeTestApp({ models: null });
    try {
      const { api } = await signUpWithBusiness(t2.app, "uk");
      const r = await api.post("/ask", { question: "What can I claim?" });
      expect(r.status).toBe(503);
      expect(r.body.error.code).toBe("ask_not_set_up");
      expect((await api.get("/ask/threads")).body).toEqual({ setUp: false, threads: [] });
    } finally {
      await t2.close();
    }
  });
});

describe("tidySources", () => {
  it("renumbers in citation order and drops unknown citations", () => {
    const r = tidySources("A [3]. B [1] [9].", [
      { n: 1, kind: "books", title: "x" }, { n: 2, kind: "official", title: "y", url: "https://www.gov.uk/" }, { n: 3, kind: "official", title: "z", url: "https://www.gov.uk/z" },
    ]);
    expect(r.text).toBe("A [1]. B [2].");
    expect(r.sources.map((s) => [s.n, s.title])).toEqual([[1, "z"], [2, "x"]]);
  });
});
