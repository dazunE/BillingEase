import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, signUpWithBusiness, testApp } from "./helpers";

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp(); });
afterAll(() => t.close());

async function signUp(email: string, name = "Priya Shaw") {
  const s = await as(t.app).post("/auth/sign-up", { name, email, password: "correct horse battery" });
  if (s.status !== 200) throw new Error(JSON.stringify(s.body));
  return s.body.token as string;
}

const tokenFrom = (text: string) => decodeURIComponent(/\/invite\/([^\s]+)/.exec(text)![1]);

describe("people and access", () => {
  it("lists the owner, invites an accountant who accepts, and removes them", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const first = await api.get("/business/members");
    expect(first.status).toBe(200);
    expect(first.body.members).toHaveLength(1);
    expect(first.body.members[0]).toMatchObject({ role: "owner", you: true });
    expect(first.body.invites).toEqual([]);

    const inv = await api.post("/business/invites", { email: "Priya@DaleAndShaw.co.uk", role: "accountant" });
    expect(inv.status).toBe(200);
    expect(inv.body).toMatchObject({ email: "priya@daleandshaw.co.uk", role: "accountant" });
    const mail = t.sent.find((m) => m.to === "priya@daleandshaw.co.uk");
    expect(mail?.subject).toContain("Harper Studio");
    const token = tokenFrom(mail!.text);

    const preview = await as(t.app).get(`/invites/${encodeURIComponent(token)}`);
    expect(preview.body).toMatchObject({ businessName: "Harper Studio", role: "accountant", state: "ok", country: "uk" });

    // Someone else can't take it.
    const stranger = await signUp("someone@example.com", "Someone");
    const wrong = await as(t.app, stranger).post(`/invites/${encodeURIComponent(token)}/accept`);
    expect(wrong.status).toBe(403);

    const priya = await signUp("priya@daleandshaw.co.uk");
    const ok = await as(t.app, priya).post(`/invites/${encodeURIComponent(token)}/accept`);
    expect(ok.status).toBe(200);
    expect(ok.body.businessId).toBe(business.id);
    expect((await as(t.app, priya).post(`/invites/${encodeURIComponent(token)}/accept`)).status).toBe(400);

    // The accountant sees the books but can't invite or remove.
    const asPriya = as(t.app, priya, business.id);
    expect((await asPriya.get("/business")).body.role).toBe("accountant");
    expect((await asPriya.post("/business/invites", { email: "x@example.com", role: "admin" })).status).toBe(403);

    const list = await api.get("/business/members");
    expect(list.body.members.map((m: { role: string }) => m.role)).toEqual(["owner", "accountant"]);
    const priyaId = list.body.members[1].userId;
    expect((await api.del(`/business/members/${list.body.members[0].userId}`)).status).toBe(400);
    expect((await api.del(`/business/members/${priyaId}`)).status).toBe(200);
    expect((await asPriya.get("/business")).status).toBe(403);
  });

  it("refuses someone who already has access, and cancels an invitation", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk");
    const me = (await api.get("/business/members")).body.members[0];
    expect((await api.post("/business/invites", { email: me.email, role: "admin" })).status).toBe(400);
    const inv = await api.post("/business/invites", { email: "ruwan@jayasinghe.lk", role: "accountant" });
    expect((await api.get("/business/members")).body.invites).toHaveLength(1);
    expect((await api.del(`/business/invites/${inv.body.id}`)).status).toBe(200);
    expect((await api.get("/business/members")).body.invites).toHaveLength(0);
    const token = tokenFrom(t.sent.filter((m) => m.to === "ruwan@jayasinghe.lk").at(-1)!.text);
    expect((await as(t.app).get(`/invites/${encodeURIComponent(token)}`)).body.state).toBe("revoked");
  });
});

describe("where you're signed in", () => {
  it("lists sessions, ends one, and ends every other", async () => {
    const email = "devices@example.com";
    const a = await signUp(email, "Devi");
    const b = (await as(t.app).post("/auth/sign-in", { email, password: "correct horse battery" })).body.token as string;
    const c = (await as(t.app).post("/auth/sign-in", { email, password: "correct horse battery" })).body.token as string;
    const list = await as(t.app, a).get("/auth/sessions");
    expect(list.body.sessions).toHaveLength(3);
    const mine = list.body.sessions.find((s: { current: boolean }) => s.current);
    expect(mine).toBeTruthy();
    expect((await as(t.app, a).del(`/auth/sessions/${mine.id}`)).status).toBe(400);
    const other = list.body.sessions.find((s: { current: boolean }) => !s.current);
    expect((await as(t.app, a).del(`/auth/sessions/${other.id}`)).status).toBe(200);
    expect((await as(t.app, a).get("/auth/sessions")).body.sessions).toHaveLength(2);
    expect((await as(t.app, a).post("/auth/sessions/end-others")).body.ended).toBe(1);
    expect((await as(t.app, b).get("/auth/me")).status).toBe(401);
    expect((await as(t.app, c).get("/auth/me")).status).toBe(401);
    expect((await as(t.app, a).get("/auth/me")).status).toBe(200);
  });
});
