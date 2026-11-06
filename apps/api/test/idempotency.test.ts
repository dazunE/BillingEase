import { idempotencyKeys } from "@billingease/db/schema";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { tidyIdempotencyKeys } from "../src/lib/route";
import { signUpWithBusiness, testApp } from "./helpers";

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp(); });
afterAll(() => t.close());

async function post(token: string, businessId: string, url: string, body: unknown, key?: string) {
  const res = await t.app.inject({ method: "POST", url, payload: body as object, headers: { authorization: `Bearer ${token}`, "x-business-id": businessId, ...(key ? { "idempotency-key": key } : {}) } });
  return { status: res.statusCode, body: res.json() };
}
const expense = { spentOn: "2026-10-09", payee: "Royal Mail", categoryId: "office", gross: 1250, method: "Card" };

describe("Idempotency-Key", () => {
  it("saves a write once however many times it's sent, and returns the first answer", async () => {
    const { token, business, api } = await signUpWithBusiness(t.app, "uk");
    const a = await post(token, business.id, "/out/expenses", expense, "phone-0001-abcdef");
    const b = await post(token, business.id, "/out/expenses", expense, "phone-0001-abcdef");
    expect(a.status).toBe(200);
    expect(b).toEqual(a);
    expect((await api.get("/out/expenses")).body.expenses).toHaveLength(1);
    // Without a key, or with a new one, it's a new expense.
    await post(token, business.id, "/out/expenses", expense, "phone-0002-abcdef");
    await post(token, business.id, "/out/expenses", expense);
    expect((await api.get("/out/expenses")).body.expenses).toHaveLength(3);
  });

  it("keeps keys apart between people, and refuses a key reused for something else", async () => {
    const one = await signUpWithBusiness(t.app, "uk");
    const two = await signUpWithBusiness(t.app, "uk");
    expect((await post(one.token, one.business.id, "/out/expenses", expense, "shared-key-123")).status).toBe(200);
    expect((await post(two.token, two.business.id, "/out/expenses", expense, "shared-key-123")).status).toBe(200);
    expect((await two.api.get("/out/expenses")).body.expenses).toHaveLength(1);
    const c = await one.api.post("/customers", { name: "Ochre Café" });
    expect((await post(one.token, one.business.id, "/customers", { name: "Other" }, "shared-key-123")).status).toBe(422);
    expect(c.status).toBe(200);
  });

  it("gives the key back when the write fails, so it can be tried again", async () => {
    const { token, business, api } = await signUpWithBusiness(t.app, "uk");
    const bad = await post(token, business.id, "/out/expenses", { ...expense, gross: 0 }, "retry-me-0001");
    expect(bad.status).toBe(400);
    const good = await post(token, business.id, "/out/expenses", expense, "retry-me-0001");
    expect(good.status).toBe(200);
    expect((await api.get("/out/expenses")).body.expenses).toHaveLength(1);
  });

  it("says to wait while the first copy is still saving, and retries one left pending", async () => {
    const { token, business, api, } = await signUpWithBusiness(t.app, "uk");
    const me = (await api.get("/auth/me")).body.user.id as string;
    await t.db.insert(idempotencyKeys).values({ key: `${me}:in-flight-0001`, userId: me, method: "POST", path: "/out/expenses" });
    expect((await post(token, business.id, "/out/expenses", expense, "in-flight-0001")).status).toBe(409);
    await t.db.update(idempotencyKeys).set({ createdAt: new Date(Date.now() - 5 * 60_000) }).where(eq(idempotencyKeys.key, `${me}:in-flight-0001`));
    expect((await post(token, business.id, "/out/expenses", expense, "in-flight-0001")).status).toBe(200);
    expect((await api.get("/out/expenses")).body.expenses).toHaveLength(1);
  });

  it("commits the write and its key together: a pending key means nothing was saved", async () => {
    const { token, business, api } = await signUpWithBusiness(t.app, "uk");
    const me = (await api.get("/auth/me")).body.user.id as string;
    await post(token, business.id, "/out/expenses", expense, "together-0001");
    const [k] = await t.db.select().from(idempotencyKeys).where(eq(idempotencyKeys.key, `${me}:together-0001`));
    expect(k.status).toBe("done");
    expect((k.response as { payee: string }).payee).toBe("Royal Mail");
    // A write refused part-way (paying more than a bill owes) leaves no key and nothing saved.
    const bill = await api.post("/out/bills", { supplierName: "Footprint Print", billDate: "2026-10-02", dueDate: "2026-10-16", lines: [{ description: "Posters", categoryId: "office", net: 42000 }] });
    const over = await post(token, business.id, `/out/bills/${bill.body.id}/payments`, { amount: 99999999, paidOn: "2026-10-10", method: "Bank transfer" }, "together-0002");
    expect(over.status).toBe(400);
    expect(await t.db.select().from(idempotencyKeys).where(eq(idempotencyKeys.key, `${me}:together-0002`))).toHaveLength(0);
    const paid = await post(token, business.id, `/out/bills/${bill.body.id}/payments`, { amount: 42000, paidOn: "2026-10-10", method: "Bank transfer" }, "together-0002");
    expect(paid.body.status).toBe("paid");
  });

  it("forgets keys after a week, and turns down a key that isn't one", async () => {
    const { token, business } = await signUpWithBusiness(t.app, "uk");
    expect((await post(token, business.id, "/out/expenses", expense, "x")).status).toBe(400);
    await post(token, business.id, "/out/expenses", expense, "old-key-00001");
    await tidyIdempotencyKeys(t.db, new Date(Date.now() + 8 * 24 * 60 * 60_000));
    expect(await t.db.select().from(idempotencyKeys)).toHaveLength(0);
  });
});
