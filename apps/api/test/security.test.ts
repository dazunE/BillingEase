import { businesses, users } from "@billingease/db/schema";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { base32Decode, base32Encode, codeAt, matchStep, stepAt } from "../src/lib/totp";
import { purgeClosed } from "../src/services/purge";
import { as, signUpWithBusiness, testApp } from "./helpers";

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp(); });
afterAll(() => t.close());

const tokenFrom = (text: string) => decodeURIComponent(/\/invite\/([^\s]+)/.exec(text)?.[1] ?? /token=([^\s&]+)/.exec(text)![1]);

describe("one-time codes", () => {
  it("matches the RFC 6238 test vector (SHA-1)", () => {
    // The RFC's secret is the ASCII "12345678901234567890"; at 59 seconds the 8-digit code is 94287082.
    const secret = base32Encode(Buffer.from("12345678901234567890"));
    expect(base32Decode(secret).toString()).toBe("12345678901234567890");
    expect(codeAt(secret, 1)).toBe("287082");
    expect(codeAt(secret, Math.floor(1111111109 / 30))).toBe("081804");
  });

  it("allows one step of clock drift and never the same step twice", () => {
    const secret = base32Encode(Buffer.from("12345678901234567890"));
    const now = 1_700_000_000_000;
    const s = stepAt(now);
    expect(matchStep(secret, codeAt(secret, s - 1), null, now)).toBe(s - 1);
    expect(matchStep(secret, codeAt(secret, s + 2), null, now)).toBeNull();
    expect(matchStep(secret, codeAt(secret, s), s, now)).toBeNull();
    expect(matchStep(secret, "12345", null, now)).toBeNull();
  });
});

describe("two-step sign-in", () => {
  it("turns on with an app code, then sign-in needs a code or a backup code", async () => {
    const email = "twostep@example.com";
    const up = await as(t.app).post("/auth/sign-up", { name: "Two Step", email, password: "correct horse battery" });
    const me = as(t.app, up.body.token);
    expect((await me.get("/auth/sign-in-methods")).body.twoStep).toEqual({ on: false, since: null, backupLeft: 0 });

    const setup = await me.post("/auth/two-step/setup");
    expect(setup.body.uri).toContain("otpauth://totp/BillingEase%3Atwostep%40example.com?secret=");
    const secret = setup.body.secret as string;
    const s = stepAt();
    expect((await me.post("/auth/two-step/enable", { code: "000000" === codeAt(secret, s) ? "111111" : "000000" })).status).toBe(400);
    const on = await me.post("/auth/two-step/enable", { code: codeAt(secret, s) });
    expect(on.status).toBe(200);
    expect(on.body.codes).toHaveLength(10);
    expect(on.body.codes[0]).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    expect((await me.get("/auth/sign-in-methods")).body.twoStep).toMatchObject({ on: true, backupLeft: 10 });

    // The password alone gets a ticket, not a session.
    const first = await as(t.app).post("/auth/sign-in", { email, password: "correct horse battery" });
    expect(first.body).toMatchObject({ twoStep: true, ticket: expect.any(String) });
    expect(first.body.token).toBeUndefined();
    expect((await as(t.app).post("/auth/two-step", { ticket: first.body.ticket, code: "999999" === codeAt(secret, s + 1) ? "888888" : "999999" })).status).toBe(400);
    // The code already used to turn it on doesn't work again.
    expect((await as(t.app).post("/auth/two-step", { ticket: first.body.ticket, code: codeAt(secret, s) })).status).toBe(400);
    const done = await as(t.app).post("/auth/two-step", { ticket: first.body.ticket, code: codeAt(secret, s + 1) });
    expect(done.status).toBe(200);
    expect((await as(t.app, done.body.token).get("/auth/me")).status).toBe(200);
    // A ticket works once.
    expect((await as(t.app).post("/auth/two-step", { ticket: first.body.ticket, code: on.body.codes[0] })).status).toBe(401);

    // A backup code works once, typed any way.
    const second = await as(t.app).post("/auth/sign-in", { email, password: "correct horse battery" });
    const backup = on.body.codes[1].toLowerCase().replace("-", " ");
    expect((await as(t.app).post("/auth/two-step", { ticket: second.body.ticket, code: backup })).status).toBe(200);
    const third = await as(t.app).post("/auth/sign-in", { email, password: "correct horse battery" });
    expect((await as(t.app).post("/auth/two-step", { ticket: third.body.ticket, code: backup })).status).toBe(400);
    expect((await me.get("/auth/sign-in-methods")).body.twoStep.backupLeft).toBe(9);

    // Too many wrong codes end the ticket.
    for (let i = 0; i < 4; i++) await as(t.app).post("/auth/two-step", { ticket: third.body.ticket, code: "12345678" });
    expect((await as(t.app).post("/auth/two-step", { ticket: third.body.ticket, code: on.body.codes[2] })).status).toBe(401);

    // A password reset still needs the code.
    await as(t.app).post("/auth/forgot-password", { email });
    const mail = t.sent.filter((m) => m.to === email).at(-1)!;
    const reset = await as(t.app).post("/auth/reset-password", { token: tokenFrom(mail.text), password: "a brand new password" });
    expect(reset.body).toMatchObject({ twoStep: true });
    // The reset signed out everywhere; finish it with a backup code.
    expect((await as(t.app, done.body.token).get("/auth/me")).status).toBe(401);
    const afterReset = await as(t.app).post("/auth/two-step", { ticket: reset.body.ticket, code: on.body.codes[4] });
    expect(afterReset.status).toBe(200);

    // New backup codes need a fresh app code; the old ones stop working.
    const meNow = as(t.app, afterReset.body.token);
    await t.db.update(users).set({ totpLastStep: null }).where(eq(users.email, email));
    const fresh = await meNow.post("/auth/two-step/codes", { code: codeAt(secret, stepAt()) });
    expect(fresh.body.codes).toHaveLength(10);
    const fourth = await as(t.app).post("/auth/sign-in", { email, password: "a brand new password" });
    expect((await as(t.app).post("/auth/two-step", { ticket: fourth.body.ticket, code: on.body.codes[3] })).status).toBe(400);

    // Turning off takes a backup code too.
    expect((await meNow.post("/auth/two-step/disable", { code: "not-a-code" })).status).toBe(400);
    expect((await meNow.post("/auth/two-step/disable", { code: fresh.body.codes[0] })).status).toBe(200);
    const plain = await as(t.app).post("/auth/sign-in", { email, password: "a brand new password" });
    expect(plain.body.token).toEqual(expect.any(String));
  });

  it("logs sign-ins and failed attempts, and emails about a new device", async () => {
    const email = "log@example.com";
    const inject = (ua: string, password: string) => t.app.inject({ method: "POST", url: "/auth/sign-in", payload: { email, password }, headers: { "user-agent": ua } });
    const up = await t.app.inject({ method: "POST", url: "/auth/sign-up", payload: { name: "Log", email, password: "correct horse battery" }, headers: { "user-agent": "Laptop Firefox" } });
    const token = up.json().token as string;
    expect((await inject("Strange Phone", "guess guess guess")).statusCode).toBe(401);
    expect((await inject("Laptop Firefox", "correct horse battery")).statusCode).toBe(200);
    expect(t.sent.filter((m) => m.to === email && /new sign-in/i.test(m.subject))).toHaveLength(0);
    expect((await inject("Office Chrome", "correct horse battery")).statusCode).toBe(200);
    expect(t.sent.filter((m) => m.to === email && /new sign-in/i.test(m.subject))).toHaveLength(1);

    const log = (await as(t.app, token).get("/auth/sign-ins")).body.signIns;
    expect(log.map((e: { method: string; ok: boolean; userAgent: string }) => [e.method, e.ok, e.userAgent])).toEqual([
      ["password", true, "Office Chrome"],
      ["password", true, "Laptop Firefox"],
      ["password", false, "Strange Phone"],
      ["sign_up", true, "Laptop Firefox"],
    ]);
    expect(log[2].reason).toBe("wrong_password");
  });
});

describe("closing a business", () => {
  it("closes on the typed name, signs everyone out, stays readable, reopens, and is purged after 30 days", async () => {
    const { api, token, business } = await signUpWithBusiness(t.app, "uk");
    const ownerEmail = (await api.get("/auth/me")).body.user.email as string;
    // An accountant with access.
    await api.post("/business/invites", { email: "acc@example.com", role: "accountant" });
    const acc = await as(t.app).post("/auth/sign-up", { name: "Acc", email: "acc@example.com", password: "correct horse battery" });
    const invite = t.sent.filter((m) => m.to === "acc@example.com").at(-1)!;
    expect((await as(t.app, acc.body.token).post(`/invites/${encodeURIComponent(tokenFrom(invite.text))}/accept`)).status).toBe(200);
    const asAcc = as(t.app, acc.body.token, business.id);
    expect((await asAcc.post("/business/close", { confirm: "Harper Studio" })).status).toBe(403);

    expect((await api.post("/business/close", { confirm: "Harper" })).status).toBe(400);
    const closed = await api.post("/business/close", { confirm: "  harper   studio " });
    expect(closed.status).toBe(200);
    const days = (Date.parse(closed.body.purgeAfter) - Date.parse(closed.body.closedAt)) / 86400000;
    expect(days).toBe(30);
    expect(t.sent.some((m) => m.to === ownerEmail && /closed/.test(m.subject))).toBe(true);

    // Everyone is signed out; the accountant has no access any more.
    expect((await api.get("/business")).status).toBe(401);
    expect((await asAcc.get("/business")).status).toBe(401);
    const accAgain = await as(t.app).post("/auth/sign-in", { email: "acc@example.com", password: "correct horse battery" });
    expect((await as(t.app, accAgain.body.token, business.id).get("/business")).status).toBe(403);

    // The owner can still sign in and look, but not change anything.
    const back = await as(t.app).post("/auth/sign-in", { email: ownerEmail, password: "correct horse battery" });
    const owner = as(t.app, back.body.token, business.id);
    const b = await owner.get("/business");
    expect(b.body.closedAt).toBe(closed.body.closedAt);
    expect((await owner.get("/customers")).status).toBe(200);
    const write = await owner.post("/customers", { name: "Ochre Café" });
    expect(write.status).toBe(409);
    expect(write.body.error.code).toBe("business_closed");

    // Changed their mind.
    expect((await owner.post("/business/reopen")).status).toBe(200);
    expect((await owner.post("/customers", { name: "Ochre Café" })).status).toBe(200);
    expect((await owner.get("/business")).body.closedAt).toBeNull();

    // Closed again, and 30 days pass: everything goes, the owner's account too.
    await owner.post("/business/close", { confirm: "Harper Studio" });
    expect(await purgeClosed(t.db, t.app.be.services.storage)).toBe(0);
    await t.db.update(businesses).set({ purgeAfter: new Date(Date.now() - 1000) }).where(eq(businesses.id, business.id));
    expect(await purgeClosed(t.db, t.app.be.services.storage)).toBe(1);
    expect(await t.db.select().from(businesses).where(eq(businesses.id, business.id))).toEqual([]);
    expect((await as(t.app).post("/auth/sign-in", { email: ownerEmail, password: "correct horse battery" })).status).toBe(401);
    // The accountant's own account stays.
    expect((await as(t.app).post("/auth/sign-in", { email: "acc@example.com", password: "correct horse battery" })).status).toBe(200);
    void token;
  });
});
