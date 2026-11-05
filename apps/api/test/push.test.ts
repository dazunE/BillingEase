import { notifications, pushDevices } from "@billingease/db/schema";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { notify } from "../src/lib/activity";
import { deliverPushes, kindOf, type PushMessage, type PushTransport } from "../src/services/push";
import { signUpWithBusiness, testApp } from "./helpers";

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp(); });
afterAll(() => t.close());

/** Records what would have gone to Expo; tokens starting "gone" come back as uninstalled. */
class FakePush implements PushTransport {
  sent: PushMessage[] = [];
  async send(messages: PushMessage[]) {
    this.sent.push(...messages);
    return messages.map((m) => (m.to.includes("[gone") ? { status: "error" as const, details: { error: "DeviceNotRegistered" } } : { status: "ok" as const }));
  }
}
const token = (s: string) => `ExponentPushToken[${s.padEnd(12, "x")}]`;

describe("push notifications", () => {
  it("registers a phone, and moves a token to whoever signs in on it", async () => {
    const a = await signUpWithBusiness(t.app, "uk");
    const b = await signUpWithBusiness(t.app, "uk");
    const tok = token("move");
    expect((await a.api.put("/push/devices", { token: tok, platform: "ios", kinds: ["paid", "late"] })).body).toEqual({ token: tok, platform: "ios", kinds: ["paid", "late"] });
    await b.api.put("/push/devices", { token: tok, platform: "ios", kinds: ["budgets"] });
    const rows = await t.db.select().from(pushDevices).where(eq(pushDevices.token, tok));
    expect(rows).toHaveLength(1);
    expect(rows[0].kinds).toEqual(["budgets"]);
    expect((await a.api.put("/push/devices", { token: "not-a-token", platform: "ios", kinds: [] })).status).toBe(400);
  });

  it("pushes each notification once, only the kinds a phone asked for, to that business's people", async () => {
    const owner = await signUpWithBusiness(t.app, "uk");
    const stranger = await signUpWithBusiness(t.app, "uk");
    await owner.api.put("/push/devices", { token: token("owner"), platform: "ios", kinds: ["paid", "budgets"] });
    await stranger.api.put("/push/devices", { token: token("stranger"), platform: "android", kinds: ["paid", "late", "budgets"] });
    await notify(t.db, owner.business.id, "Kirkstall Brewing paid £3,950", { body: "HS-0047 is paid in full.", link: "/app/in/invoices/x" });
    await notify(t.db, owner.business.id, "Ochre Café is 19 days late", { link: "/app/in/invoices/y" });
    await notify(t.db, owner.business.id, "Travel is over budget", { link: "/app/budgets" });
    const fake = new FakePush();
    await deliverPushes(t.db, fake);
    const mine = fake.sent.filter((m) => m.to === token("owner"));
    expect(mine.map((m) => m.title).sort()).toEqual(["Kirkstall Brewing paid £3,950", "Travel is over budget"]);
    expect(mine.find((m) => m.title.startsWith("Kirkstall"))!.data).toMatchObject({ link: "/app/in/invoices/x", businessId: owner.business.id });
    // Not to someone outside the business.
    expect(fake.sent.some((m) => m.to === token("stranger"))).toBe(false);
    // And not twice.
    const again = new FakePush();
    await deliverPushes(t.db, again);
    expect(again.sent.filter((m) => m.to === token("owner"))).toHaveLength(0);
    const left = await t.db.select().from(notifications).where(eq(notifications.businessId, owner.business.id));
    expect(left.every((n) => n.pushedAt)).toBe(true);
  });

  it("stops pushing to a phone the service says is gone, and after sign-out", async () => {
    const o = await signUpWithBusiness(t.app, "lk");
    await o.api.put("/push/devices", { token: token("gone"), platform: "android", kinds: ["paid"] });
    await notify(t.db, o.business.id, "Colombo Dental Clinic paid Rs 338,660", { link: "/app/in/invoices/z" });
    await deliverPushes(t.db, new FakePush());
    const [d] = await t.db.select().from(pushDevices).where(eq(pushDevices.token, token("gone")));
    expect(d.disabledAt).not.toBeNull();

    await o.api.put("/push/devices", { token: token("bye"), platform: "ios", kinds: ["paid"] });
    expect((await o.api.post("/push/devices/remove", { token: token("bye") })).status).toBe(200);
    expect(await t.db.select().from(pushDevices).where(eq(pushDevices.token, token("bye")))).toHaveLength(0);
  });

  it("knows a notification's kind from its link", () => {
    expect(kindOf("/app/budgets", "x")).toBe("budgets");
    expect(kindOf("/app/check", "3 lines to check")).toBe("drafts");
    expect(kindOf("/app/out/payroll", "October payroll")).toBe("payroll");
    expect(kindOf("/app/in/invoices/1", "Ochre Café is 19 days late")).toBe("late");
    expect(kindOf("/app/in/invoices/1", "Kirkstall paid £3,950")).toBe("paid");
    expect(kindOf("/app/accountant", "Priya sent a request")).toBe("accountant");
    expect(kindOf(null, "VAT return due in 7 days")).toBe("deadlines");
    expect(kindOf("/app/settings", "Something else")).toBeNull();
  });
});
