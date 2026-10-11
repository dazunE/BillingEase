import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AskClient, AskRequest, AskResponse } from "../src/services/ask-client";
import { tidySources } from "../src/services/ask";
import { as, signUpWithBusiness } from "./helpers";
import { homeTestApp, seed } from "./home-helpers";

/** A fake Claude: returns the scripted responses in order and records every request. */
function fakeClient() {
  const script: Partial<AskResponse>[] = [];
  const calls: AskRequest[] = [];
  const client: AskClient = {
    model: "claude-opus-5-5",
    async create(params) {
      calls.push(structuredClone(params));
      const next = script.shift();
      if (!next) throw new Error("No scripted response left");
      return { id: "msg_" + calls.length, type: "message", role: "assistant", model: "claude-opus-5-5", usage: {}, stop_sequence: null, ...next } as unknown as AskResponse;
    },
  };
  return { client, calls, script };
}

const toolUse = (blocks: { name: string; input: unknown }[]): Partial<AskResponse> => ({
  stop_reason: "tool_use",
  content: [
    { type: "thinking", thinking: "", signature: "sig" },
    ...blocks.map((b, i) => ({ type: "tool_use", id: `toolu_${i}_${b.name}`, name: b.name, input: b.input })),
  ] as AskResponse["content"],
});
const text = (s: string): Partial<AskResponse> => ({ stop_reason: "end_turn", content: [{ type: "text", text: s, citations: null }] as AskResponse["content"] });

const fake = fakeClient();
let t: Awaited<ReturnType<typeof homeTestApp>>;
beforeAll(async () => { t = await homeTestApp({ ask: fake.client }); });
afterAll(() => t.close());

describe("Ask", () => {
  it("runs the tool loop on the books and cites books and official sources", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const s = seed(t.db, business.id);
    const c = await s.customer("Kandyan Interiors");
    const inv = await s.invoice({ customerId: c.id, number: "HS-0007", issueDate: "2026-10-07", dueDate: "2026-10-21", total: 120000, paid: 120000, status: "paid" });
    await s.receipt(inv.id, 120000, "2026-10-08");

    fake.calls.length = 0;
    fake.script.push(
      toolUse([{ name: "get_numbers", input: { period: "quarter" } }, { name: "get_official_sources", input: { topic: "mtd" } }]),
      toolUse([{ name: "list_invoices", input: { status: "paid" } }, { name: "list_expenses", input: { category: "made-up" } }]),
      text("You've had £1,200 coming in this quarter [1], all from HS-0007 [4]. Your quarterly update is due by 7 February [2]. Your accountant sends it."),
    );
    const r = await api.post("/ask", { question: "How much have I made this quarter?" });
    expect(r.status).toBe(200);
    expect(r.body.model).toBe("claude-opus-5-5");
    expect(r.body.answer).toBe("You've had £1,200 coming in this quarter [1], all from HS-0007 [2]. Your quarterly update is due by 7 February [3]. Your accountant sends it.");
    expect(r.body.sources[0]).toEqual({ n: 1, kind: "books", title: expect.stringMatching(/^Your books · the three numbers, Q3 2026\/27/) });
    expect(r.body.sources[1]).toEqual({ n: 2, kind: "books", title: "Your books · invoices (paid)" });
    expect(r.body.sources[2]).toEqual({ n: 3, kind: "official", title: "gov.uk · Use Making Tax Digital for Income Tax", url: "https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax" });
    // Official pages it didn't cite are dropped.
    expect(r.body.sources.filter((x: { kind: string }) => x.kind === "official")).toHaveLength(1);

    // Three calls: the model, the tools' results, then the answer.
    expect(fake.calls).toHaveLength(3);
    const first = fake.calls[0] as unknown as Record<string, unknown>;
    expect(first).toMatchObject({ model: "claude-opus-5-5", max_tokens: 4000, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default", output_config: { effort: "low" } });
    expect(first.thinking).toBeUndefined();
    expect(first.tool_choice).toBeUndefined();
    const system = first.system as { text: string; cache_control: unknown }[];
    expect(system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(system[0].text).not.toContain("Harper");
    expect(system[0].text).not.toContain("2026");
    const firstUser = (first.messages as { content: string }[])[0].content;
    expect(firstUser).toContain("Today is 11 Oct 2026");
    expect(firstUser).toContain("Harper Studio");
    expect((first.tools as { name: string }[]).map((x) => x.name)).toEqual(["get_numbers", "list_invoices", "list_expenses", "list_bills", "get_business_profile", "get_country_rules", "get_official_sources"]);

    // The second request carries the assistant turn as sent, then ONE user turn with both results.
    const msgs = fake.calls[1].messages;
    expect(msgs).toHaveLength(3);
    expect(msgs[1].role).toBe("assistant");
    expect((msgs[1].content as { type: string }[])[0].type).toBe("thinking");
    const results = msgs[2].content as { type: string; tool_use_id: string; content: string; is_error?: boolean }[];
    expect(results.map((x) => x.tool_use_id)).toEqual(["toolu_0_get_numbers", "toolu_1_get_official_sources"]);
    expect(results.every((x) => x.type === "tool_result" && !x.is_error)).toBe(true);
    const numbers = JSON.parse(results[0].content);
    expect(numbers.comingIn.total).toBe("£1,200");
    expect(numbers.source).toBe(1);

    // A bad tool input comes back as an error result, not a crash.
    const third = fake.calls[2].messages.at(-1)!.content as { tool_use_id: string; is_error?: boolean; content: string }[];
    expect(third[0].is_error).toBeFalsy();
    expect(JSON.parse(third[0].content).invoices[0]).toMatchObject({ number: "HS-0007", customer: "Kandyan Interiors", total: "£1,200" });
    expect(third[1]).toMatchObject({ is_error: true, content: expect.stringContaining("Invalid input") });

    // Both turns are kept, and the thread lists.
    const threads = await api.get("/ask/threads");
    expect(threads.body.setUp).toBe(true);
    expect(threads.body.threads).toEqual([expect.objectContaining({ id: r.body.threadId, title: "How much have I made this quarter?", messages: 2 })]);
    const thread = await api.get(`/ask/threads/${r.body.threadId}`);
    expect(thread.body.messages.map((m: { role: string }) => m.role)).toEqual(["user", "assistant"]);
    expect(thread.body.messages[1].sources).toHaveLength(3);

    // A follow-up continues the thread with its history.
    fake.calls.length = 0;
    fake.script.push(text("Nothing is late."));
    const f = await api.post("/ask", { question: "Is anything late?", threadId: r.body.threadId });
    expect(f.body.threadId).toBe(r.body.threadId);
    expect(fake.calls[0].messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(fake.calls[0].messages[0].content).toContain("<context>");
    expect(fake.calls[0].messages[2].content).toBe("Is anything late?");
    expect((await api.get(`/ask/threads/${r.body.threadId}`)).body.messages).toHaveLength(4);

    // Other people can't read or continue it.
    const other = await signUpWithBusiness(t.app, "uk");
    expect((await other.api.get(`/ask/threads/${r.body.threadId}`)).status).toBe(404);
    expect((await other.api.post("/ask", { question: "And now?", threadId: r.body.threadId })).status).toBe(404);
    expect((await other.api.get("/ask/threads")).body.threads).toEqual([]);
  });

  it("answers a refusal politely and keeps no sources", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk");
    fake.script.push({ stop_reason: "refusal", content: [] });
    const r = await api.post("/ask", { question: "Help me hide income from the IRD" });
    expect(r.status).toBe(200);
    expect(r.body.answer).toBe("I can't help with that one. Ask your tax practitioner, who can look at it with you.");
    expect(r.body.sources).toEqual([]);
  });

  it("gives Sri Lankan official sources and rules", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk");
    fake.calls.length = 0;
    fake.script.push(
      toolUse([{ name: "get_official_sources", input: { topic: "epf" } }, { name: "get_country_rules", input: {} }, { name: "get_official_sources", input: { topic: "mtd" } }]),
      text("EPF is 8% from the employee and 12% from you [1]. SSCL is 2.5% [2]."),
    );
    const r = await api.post("/ask", { question: "How are EPF and ETF worked out?" });
    expect(r.body.sources).toEqual([
      { n: 1, kind: "official", title: "Employees' Provident Fund (Central Bank of Sri Lanka)", url: "https://epf.lk/" },
      { n: 2, kind: "books", title: "BillingEase country rules · Sri Lanka 2026/27 (not yet verified)" },
    ]);
    const results = fake.calls[1].messages.at(-1)!.content as { content: string }[];
    const rules = JSON.parse(results[1].content);
    expect(rules).toMatchObject({ verified: false, currency: "LKR", taxYear: { label: "2026/27" } });
    expect(rules.categories[0]).toMatchObject({ id: "cogs", official: "Cost of sales" });
    expect(rules.sscl).toContain("2.5%");
    expect(JSON.parse(results[2].content).sources).toEqual([]);
    // The tool schema only offers this country's topics.
    const tool = (fake.calls[0] as unknown as { tools: { name: string; input_schema: { properties: { topic?: { enum: string[] } } } }[] }).tools.find((x) => x.name === "get_official_sources")!;
    expect(tool.input_schema.properties.topic!.enum).toContain("epf");
    expect(tool.input_schema.properties.topic!.enum).not.toContain("mtd");
  });

  it("stops after six rounds of tools", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    fake.calls.length = 0;
    for (let i = 0; i < 6; i++) fake.script.push(toolUse([{ name: "get_business_profile", input: {} }]));
    const r = await api.post("/ask", { question: "Keep looking things up" });
    expect(r.status).toBe(200);
    expect(fake.calls).toHaveLength(6);
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

describe("Ask without a key", () => {
  it("says it isn't set up", async () => {
    const t2 = await homeTestApp({ ask: null });
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
