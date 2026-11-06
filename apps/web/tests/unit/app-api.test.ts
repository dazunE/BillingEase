import { APP_ENDPOINTS, isAppEndpoint } from "@billingease/contracts";
import { describe, expect, it } from "vitest";

const ID = "3f2b8c1e-8a4d-4b6e-9a51-0c7d2e1f4a90";

describe("the phone app's endpoint list", () => {
  it("lets through what the app calls", () => {
    expect(isAppEndpoint("POST", "/auth/sign-in")).toBe(true);
    expect(isAppEndpoint("GET", "/home")).toBe(true);
    expect(isAppEndpoint("GET", `/invoices/${ID}`)).toBe(true);
    expect(isAppEndpoint("POST", `/invoices/${ID}/payments`)).toBe(true);
    expect(isAppEndpoint("post", `/out/bills/${ID}/payments`)).toBe(true);
  });

  it("refuses other endpoints and other methods", () => {
    expect(isAppEndpoint("DELETE", `/invoices/${ID}`)).toBe(false);
    expect(isAppEndpoint("GET", "/business/invites")).toBe(false);
    expect(isAppEndpoint("POST", "/auth/sign-up")).toBe(false);
    expect(isAppEndpoint("GET", "/payroll/runs")).toBe(false);
  });

  it("refuses paths that try to step outside a parameter", () => {
    expect(isAppEndpoint("GET", "/invoices/..")).toBe(false);
    expect(isAppEndpoint("GET", "/invoices/%2e%2e")).toBe(false);
    expect(isAppEndpoint("GET", "/invoices/a%2Fb")).toBe(false);
    expect(isAppEndpoint("GET", "/invoices//")).toBe(false);
    expect(isAppEndpoint("GET", "invoices")).toBe(false);
    expect(isAppEndpoint("GET", "/invoices/x/y")).toBe(false);
  });

  it("only lists endpoints that need a signed-in person, apart from signing in", () => {
    const open = Object.entries(APP_ENDPOINTS).filter(([, e]) => e.auth === "public").map(([k]) => k);
    expect(open.sort()).toEqual(["signIn", "twoStep"]);
  });
});
