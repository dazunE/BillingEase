import { describe, expect, it } from "vitest";
import { phoneRoute } from "../src/lib/links";
import { addDays, shortDate, todayIso } from "../src/lib/dates";

describe("links in notifications", () => {
  it("open the matching screen on the phone", () => {
    expect(phoneRoute("/app/in/invoices/abc")).toBe("/in");
    expect(phoneRoute("/app/in/invoices?status=late")).toBe("/in?status=late");
    expect(phoneRoute("/app/out/bills/abc")).toBe("/out?tab=bills");
    expect(phoneRoute("/app/out?sort=1")).toBe("/out");
    expect(phoneRoute("/app")).toBe("/");
    expect(phoneRoute("/app/check")).toBe("/inbox?tab=check");
  });
  it("stay put for pages the phone doesn't have", () => {
    expect(phoneRoute("/app/settings/people")).toBeNull();
    expect(phoneRoute(null)).toBeNull();
  });
});

describe("dates", () => {
  it("works out today, yesterday and a short label", () => {
    expect(todayIso(new Date(2026, 9, 11))).toBe("2026-10-11");
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30");
    expect(addDays("2026-10-11", 14)).toBe("2026-10-25");
    expect(shortDate("2026-10-11")).toBe("11 Oct");
  });
});
