import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, signUpWithBusiness, testApp } from "./helpers";

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp(); });
afterAll(() => t.close());

describe("properties (UK)", () => {
  it("records rent and costs at the owner's share, kept apart, with mortgage interest separate", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk", { kind: "both" });
    const flat = (await api.post("/properties", { name: "Flat 2, 18 Ash Grove", address: "Headingley, Leeds LS6", monthlyRent: 105000, rentDay: 7, agent: "Headingley Lettings", sharePct: 100 })).body;
    expect(flat.id).toBeTruthy();
    expect((await api.post(`/properties/${flat.id}/entries`, { kind: "rent", on: "2026-09-07", description: "Rent for September", amount: 105000 })).status).toBe(200);
    expect((await api.post(`/properties/${flat.id}/entries`, { kind: "cost", on: "2026-09-07", description: "10% of September's rent", payee: "Headingley Lettings", categoryId: "p-professional", amount: 10500 })).status).toBe(200);
    const mortgage = (await api.post(`/properties/${flat.id}/entries`, { kind: "cost", on: "2026-09-01", description: "Mortgage interest", categoryId: "p-finance", amount: 41000 })).body;
    expect((await api.post(`/properties/${flat.id}/entries`, { kind: "cost", on: "2026-09-01", description: "Office chair", categoryId: "office", amount: 100 })).status).toBe(400);

    const r = (await api.get("/properties")).body;
    expect(r.totals).toEqual({ rent: 105000, costs: 10500, finance: 41000, profit: 94500 });
    expect(r.properties[0].rentMonths.find((m: { month: string }) => m.month === "2026-09").received).toBe(105000);
    expect(r.quarters[1]).toMatchObject({ label: "Q2 2026/27", rent: 105000 });

    // Rent is in the ledger as property income, not in Coming in.
    const pl = (await api.get("/books/profit-and-loss")).body;
    expect(pl.income.find((l: { code: string }) => l.code === "4500").amount).toBe(105000);
    expect((await api.get("/home?period=quarter")).body.comingIn.total).toBe(0);

    expect((await api.del(`/properties/entries/${mortgage.id}`)).status).toBe(200);
    expect((await api.get("/properties")).body.totals.finance).toBe(0);
  });

  it("takes a half share at half", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk", { kind: "landlord" });
    const p = (await api.post("/properties", { name: "12 Mill Lane", sharePct: 50 })).body;
    const e = (await api.post(`/properties/${p.id}/entries`, { kind: "rent", on: "2026-09-01", description: "Rent", amount: 90000 })).body;
    expect(e.share).toBe(45000);
  });

  it("isn't offered in Sri Lanka", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk");
    expect((await api.get("/properties")).status).toBe(404);
    expect((await api.get("/mileage")).status).toBe(404);
  });
});

describe("mileage (UK)", () => {
  it("claims 45p a mile, posts it to car and travel, counts in Going out", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const trip = await api.post("/mileage", { on: "2026-10-08", from: "Leeds", to: "York", purpose: "Ochre Café menu proofs", miles: 250, returnTrip: true });
    expect(trip.body).toMatchObject({ miles: 500, amount: 2250, to: "York and back" });
    const r = (await api.get("/mileage")).body;
    expect(r.totals).toMatchObject({ miles: 500, amount: 2250, trips: 1 });
    expect(r.quarters[2]).toMatchObject({ label: "Q3 2026/27", miles: 500 });
    expect((await api.get("/home?period=quarter")).body.goingOut.paid).toBe(2250);
    const pl = (await api.get("/books/profit-and-loss")).body;
    expect(pl.expenses.find((l: { name: string }) => l.name === "Car, van and travel").amount).toBe(2250);
    expect((await api.del(`/mileage/${trip.body.id}`)).status).toBe(200);
    expect((await api.get("/mileage")).body.totals.amount).toBe(0);
  });
});

describe("your accountant", () => {
  it("lists the accountant, takes requests and messages both ways", async () => {
    const s = await signUpWithBusiness(t.app, "uk");
    await s.api.post("/business/invites", { email: "priya@dale.example", role: "accountant" });
    const token = decodeURIComponent(/\/invite\/([^\s]+)/.exec(t.sent.find((m) => m.to === "priya@dale.example")!.text)![1]);
    const priya = (await as(t.app).post("/auth/sign-up", { name: "Priya Shaw", email: "priya@dale.example", password: "correct horse battery" })).body.token;
    await as(t.app, priya).post(`/invites/${encodeURIComponent(token)}/accept`);
    const asPriya = as(t.app, priya, s.business.id);

    const req = await asPriya.post("/practice/requests", { title: "Upload the September letting agent statement", body: "For Flat 2.", link: "/app/out/properties" });
    expect(req.body).toMatchObject({ status: "open", from: "Priya Shaw" });
    expect((await asPriya.post("/practice/requests", { title: "x", link: "https://evil.example" })).status).toBe(400);
    await asPriya.post("/practice/messages", { body: "Q2 has closed; two things first." });
    await s.api.post("/practice/messages", { body: "Thanks Priya." });

    const o = (await s.api.get("/practice")).body;
    expect(o.accountants.map((a: { name: string }) => a.name)).toEqual(["Priya Shaw"]);
    expect(o.requests[0].title).toBe("Upload the September letting agent statement");
    expect(o.messages.map((m: { from: string; mine: boolean }) => [m.from, m.mine])).toEqual([["Priya Shaw", false], ["Test Owner", true]]);

    const done = await s.api.post(`/practice/requests/${req.body.id}`, { status: "done" });
    expect(done.body.status).toBe("done");
    expect((await s.api.get("/notifications")).body.items.some((n: { title: string }) => n.title.startsWith("Priya Shaw asked"))).toBe(true);
  });
});
