import { describe, expect, it } from "vitest";
import { ApiFailure, buildUrl, call, fillPath, problem } from "../src/lib/api";

describe("the API client", () => {
  it("fills path parameters, encoded", () => {
    expect(fillPath("/invoices/:id/payments", { id: "a b" })).toBe("/invoices/a%20b/payments");
    expect(() => fillPath("/invoices/:id", {})).toThrow();
  });
  it("leaves empty query values out", () => {
    expect(buildUrl("https://x/app-api", "/invoices", { status: "late", q: "", c: undefined })).toBe("https://x/app-api/invoices?status=late");
  });
  it("sends the session and business, and the body as JSON", async () => {
    let seen: { url: string; init: RequestInit } | null = null;
    const fake = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;
    await call("remind", { params: { id: "inv-1" }, body: { email: true } }, { token: "t0k", businessId: "b1" }, fake);
    const h = seen!.init.headers as Record<string, string>;
    expect(seen!.url).toMatch(/\/app-api\/invoices\/inv-1\/remind$/);
    expect(seen!.init.method).toBe("POST");
    expect(h.authorization).toBe("Bearer t0k");
    expect(h["x-business-id"]).toBe("b1");
    expect(JSON.parse(seen!.init.body as string)).toEqual({ email: true });
  });
  it("turns an API refusal into a plain message, preferring a field's", async () => {
    const fake = (async () => new Response(JSON.stringify({ error: { code: "invalid", message: "Check the form", fields: { amount: "Enter an amount more than 0" } } }), { status: 400 })) as unknown as typeof fetch;
    const e = await call("createExpense", { body: {} as never }, { token: "t", businessId: null }, fake).catch((x) => x);
    expect(e).toBeInstanceOf(ApiFailure);
    expect(e.status).toBe(400);
    expect(problem(e)).toBe("Enter an amount more than 0");
  });
  it("says so when there's no connection", async () => {
    const fake = (async () => { throw new TypeError("Network request failed"); }) as unknown as typeof fetch;
    const e = await call("home", {}, { token: "t", businessId: null }, fake).catch((x) => x);
    expect(e.code).toBe("offline");
  });
});
