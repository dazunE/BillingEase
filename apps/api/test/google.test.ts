import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkIdToken, type GoogleProfile } from "../src/services/google";
import { as, testApp } from "./helpers";

// The code stands in for a Google account: the fake answers with the profile filed under it.
const accounts = new Map<string, GoogleProfile>();
const google = { verify: async ({ code }: { code: string }) => { const p = accounts.get(code); if (!p) throw new Error("unknown code"); return p; } };
const code = (c: string) => ({ code: c, codeVerifier: "v".repeat(43), nonce: "n".repeat(16), redirectUri: "http://localhost:3000/auth/google/callback" });

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => {
  t = await testApp({ google });
  accounts.set("new", { sub: "g-1", email: "maya@example.com", emailVerified: true, name: "Maya Perera" });
  accounts.set("pw", { sub: "g-2", email: "ellie@example.com", emailVerified: true, name: "Ellie" });
  accounts.set("unverified", { sub: "g-3", email: "sam@example.com", emailVerified: false, name: "Sam" });
  accounts.set("other", { sub: "g-4", email: "other@gmail.com", emailVerified: true, name: "Other" });
});
afterAll(() => t.close());

describe("sign in with Google", () => {
  it("makes a new account the first time, then signs in to it", async () => {
    const first = await as(t.app).post("/auth/google", code("new"));
    expect(first.status).toBe(200);
    expect(first.body.created).toBe(true);
    const me = await as(t.app, first.body.token).get("/auth/me");
    expect(me.body.user).toMatchObject({ email: "maya@example.com", name: "Maya Perera" });
    const again = await as(t.app).post("/auth/google", code("new"));
    expect(again.body.created).toBe(false);
    expect((await as(t.app, again.body.token).get("/auth/me")).body.user.id).toBe(me.body.user.id);
    const m = await as(t.app, again.body.token).get("/auth/sign-in-methods");
    expect(m.body).toEqual({ email: "maya@example.com", hasPassword: false, google: { email: "maya@example.com" }, googleAvailable: true });
  });

  it("links a verified Google email to an existing password account", async () => {
    const up = await as(t.app).post("/auth/sign-up", { name: "Ellie", email: "ellie@example.com", password: "a long password" });
    const g = await as(t.app).post("/auth/google", code("pw"));
    expect(g.body.created).toBe(false);
    const a = await as(t.app, up.body.token).get("/auth/me");
    const b = await as(t.app, g.body.token).get("/auth/me");
    expect(b.body.user.id).toBe(a.body.user.id);
    expect((await as(t.app).post("/auth/sign-in", { email: "ellie@example.com", password: "a long password" })).status).toBe(200);
  });

  it("refuses an email Google hasn't verified", async () => {
    const r = await as(t.app).post("/auth/google", code("unverified"));
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("google_unverified");
  });

  it("keeps at least one way to sign in", async () => {
    const g = await as(t.app).post("/auth/google", code("new"));
    const api = as(t.app, g.body.token);
    // No password: can't sign in with one, can't change one, can't drop Google.
    expect((await as(t.app).post("/auth/sign-in", { email: "maya@example.com", password: "anything at all" })).status).toBe(401);
    expect((await api.post("/auth/change-password", { current: "x", password: "a new password!" })).status).toBe(400);
    expect((await api.del("/auth/google")).body.error.code).toBe("last_method");
    const set = await api.post("/auth/set-password", { password: "maya's password" });
    expect(set.body.hasPassword).toBe(true);
    expect((await api.post("/auth/set-password", { password: "another password" })).status).toBe(409);
    const off = await api.del("/auth/google");
    expect(off.body.google).toBeNull();
    expect((await as(t.app).post("/auth/sign-in", { email: "maya@example.com", password: "maya's password" })).status).toBe(200);
    // Connect it back.
    expect((await api.post("/auth/google/link", code("new"))).body.google).toEqual({ email: "maya@example.com" });
  });

  it("connects a Google account with another email, but only to one person", async () => {
    const up = await as(t.app).post("/auth/sign-up", { name: "Raj", email: "raj@example.com", password: "a long password" });
    const raj = as(t.app, up.body.token);
    expect((await raj.post("/auth/google/link", code("other"))).body.google).toEqual({ email: "other@gmail.com" });
    // Signing in with that Google account now reaches Raj.
    const g = await as(t.app).post("/auth/google", code("other"));
    expect((await as(t.app, g.body.token).get("/auth/me")).body.user.email).toBe("raj@example.com");
    // Someone else can't take it.
    const up2 = await as(t.app).post("/auth/sign-up", { name: "Zed", email: "zed@example.com", password: "a long password" });
    expect((await as(t.app, up2.body.token).post("/auth/google/link", code("other"))).body.error.code).toBe("google_taken");
    // And Raj can't add a second one.
    expect((await raj.post("/auth/google/link", code("new"))).status).toBe(409);
  });

  it("says when Google isn't set up", async () => {
    const off = await testApp();
    const r = await as(off.app).post("/auth/google", code("new"));
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("google_off");
    await off.close();
  });
});

describe("checking Google's ID token", () => {
  const good = { iss: "https://accounts.google.com", aud: "client-1", exp: Math.floor(Date.now() / 1000) + 600, nonce: "nonce-123", sub: "42", email: "A@Example.com", email_verified: true, name: "A" };
  it("accepts a good one and tidies the email", () => {
    expect(checkIdToken(good, "client-1", "nonce-123")).toEqual({ sub: "42", email: "a@example.com", emailVerified: true, name: "A" });
  });
  it.each([
    ["another issuer", { iss: "https://evil.example" }],
    ["another app", { aud: "client-2" }],
    ["expired", { exp: Math.floor(Date.now() / 1000) - 3600 }],
    ["another attempt's nonce", { nonce: "other" }],
    ["no subject", { sub: "" }],
  ])("refuses %s", (_, change) => {
    expect(() => checkIdToken({ ...good, ...change }, "client-1", "nonce-123")).toThrow(/Google didn't confirm/);
  });
});
