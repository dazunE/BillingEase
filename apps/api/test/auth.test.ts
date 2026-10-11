import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, signUpWithBusiness, testApp } from "./helpers";

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp(); });
afterAll(() => t.close());

describe("accounts and sessions", () => {
  it("signs up, signs in and out", async () => {
    const up = await as(t.app).post("/auth/sign-up", { name: "Ellie", email: "Ellie@Example.com", password: "a long password" });
    expect(up.status).toBe(200);
    const me = await as(t.app, up.body.token).get("/auth/me");
    expect(me.body.user.email).toBe("ellie@example.com");
    expect(me.body.businesses).toEqual([]);
    expect((await as(t.app).post("/auth/sign-in", { email: "ellie@example.com", password: "wrong one!!" })).status).toBe(401);
    const inn = await as(t.app).post("/auth/sign-in", { email: "ellie@example.com", password: "a long password" });
    expect(inn.status).toBe(200);
    expect((await as(t.app, inn.body.token).post("/auth/sign-out")).status).toBe(200);
    expect((await as(t.app, inn.body.token).get("/auth/me")).status).toBe(401);
  });

  it("explains bad input field by field", async () => {
    const r = await as(t.app).post("/auth/sign-up", { name: "", email: "nope", password: "short" });
    expect(r.status).toBe(400);
    expect(Object.keys(r.body.error.fields).sort()).toEqual(["email", "name", "password"]);
  });

  it("refuses a second account with the same email", async () => {
    await as(t.app).post("/auth/sign-up", { name: "A", email: "dup@example.com", password: "a long password" });
    expect((await as(t.app).post("/auth/sign-up", { name: "B", email: "dup@example.com", password: "a long password" })).status).toBe(409);
  });

  it("resets a password by email and signs out other sessions", async () => {
    const up = await as(t.app).post("/auth/sign-up", { name: "R", email: "reset@example.com", password: "first password" });
    expect((await as(t.app).post("/auth/forgot-password", { email: "nobody@example.com" })).status).toBe(200);
    await as(t.app).post("/auth/forgot-password", { email: "reset@example.com" });
    const mail = t.sent.find((m) => m.to === "reset@example.com")!;
    const token = /token=([^\s]+)/.exec(mail.text)![1];
    const r = await as(t.app).post("/auth/reset-password", { token: decodeURIComponent(token), password: "second password" });
    expect(r.status).toBe(200);
    expect((await as(t.app, up.body.token).get("/auth/me")).status).toBe(401);
    expect((await as(t.app).post("/auth/reset-password", { token: decodeURIComponent(token), password: "third password" })).status).toBe(400);
    expect((await as(t.app).post("/auth/sign-in", { email: "reset@example.com", password: "second password" })).status).toBe(200);
  });
});

describe("businesses", () => {
  it("sets up a UK business with pounds, cash basis and 14-day terms", async () => {
    const { business, api } = await signUpWithBusiness(t.app, "uk");
    expect(business).toMatchObject({ country: "uk", currency: "GBP", basis: "cash", termsDays: 14, invoicePrefix: "HS-", role: "owner" });
    expect((await api.get("/business")).body.name).toBe("Harper Studio");
  });

  it("sets up a Sri Lankan business with rupees, accruals and SSCL", async () => {
    const { business } = await signUpWithBusiness(t.app, "lk");
    expect(business).toMatchObject({ country: "lk", currency: "LKR", basis: "accrual", termsDays: 30, ssclRegistered: true, invoicePrefix: "SDS-" });
  });

  it("checks country rules", async () => {
    const up = await as(t.app).post("/auth/sign-up", { name: "X", email: "rules@example.com", password: "a long password" });
    const api = as(t.app, up.body.token);
    const r = await api.post("/businesses", { country: "uk", kind: "sole_proprietor", name: "X", ownerName: "X", vatRegistered: true, ssclRegistered: true });
    expect(r.status).toBe(400);
    expect(Object.keys(r.body.error.fields).sort()).toEqual(["kind", "ssclRegistered", "vatNumber"]);
  });

  it("keeps businesses apart", async () => {
    const a = await signUpWithBusiness(t.app, "uk");
    const b = await signUpWithBusiness(t.app, "lk");
    expect((await as(t.app, a.token, b.business.id).get("/business")).status).toBe(403);
  });

  it("lets the owner update details and refuses VAT without a number", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    expect((await api.patch("/business", { vatRegistered: true })).status).toBe(400);
    const r = await api.patch("/business", { vatRegistered: true, vatNumber: "GB123456789", termsDays: 30 });
    expect(r.body).toMatchObject({ vatRegistered: true, vatNumber: "GB123456789", termsDays: 30 });
  });
});
