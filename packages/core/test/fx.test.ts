import { describe, expect, it } from "vitest";
import { balanced, convertMinor, describeRate, formatMoney, homeCleared, invertRate, parseMoney, parseRate, posting, toHome } from "../src";

describe("exchange rates", () => {
  it("tidies rates and refuses nonsense", () => {
    expect(parseRate("0.79120")).toBe("0.7912");
    expect(parseRate(" 1,234.5 ")).toBe("1234.5");
    expect(parseRate("0.00523456789049")).toBe("0.0052345679");
    expect(parseRate(0.5)).toBe("0.5");
    expect(parseRate("0")).toBeNull();
    expect(parseRate("-1")).toBeNull();
    expect(parseRate("abc")).toBeNull();
    expect(parseRate("")).toBeNull();
  });

  it("converts minor units exactly, rounding half away from zero", () => {
    expect(convertMinor(100000, "USD", "GBP", "0.7912")).toBe(79120);
    expect(convertMinor(1, "USD", "GBP", "0.5")).toBe(1);
    expect(convertMinor(-1, "USD", "GBP", "0.5")).toBe(-1);
    expect(convertMinor(123456, "USD", "LKR", "298.4567")).toBe(36846270);
    expect(convertMinor(5000, "GBP", "GBP", "9")).toBe(5000);
  });

  it("handles currencies without minor units", () => {
    // 120,000 yen at 0.0052 GBP per yen is £624.00
    expect(convertMinor(120000, "JPY", "GBP", "0.0052")).toBe(62400);
    // $10.00 at 150 yen per dollar is 1,500 yen
    expect(convertMinor(1000, "USD", "JPY", "150")).toBe(1500);
  });

  it("inverts and describes rates", () => {
    expect(invertRate("0.8")).toBe("1.25");
    expect(describeRate("USD", "GBP", "0.79123456")).toBe("1 USD = 0.79123 GBP");
    expect(describeRate("USD", "LKR", "298.456789")).toBe("1 USD = 298.4568 LKR");
  });

  it("converts each part so the home total is their sum", () => {
    const h = toHome({ net: 100001, vat: 20000, sscl: 0 }, "USD", "GBP", "0.79");
    expect(h).toEqual({ net: 79001, vat: 15800, sscl: 0, total: 94801 });
  });

  it("clears the receivable to exactly zero over part payments", () => {
    const total = 100000, homeTotal = 79123;
    const first = homeCleared({ total, settledBefore: 0, amount: 33333, homeTotal, homeClearedBefore: 0 });
    const second = homeCleared({ total, settledBefore: 33333, amount: 33333, homeTotal, homeClearedBefore: first });
    const last = homeCleared({ total, settledBefore: 66666, amount: 33334, homeTotal, homeClearedBefore: first + second });
    expect(first).toBe(26374);
    expect(first + second + last).toBe(homeTotal);
  });
});

describe("money in other currencies", () => {
  it("formats foreign amounts with clear symbols", () => {
    expect(formatMoney(98000, "EUR")).toBe("€980");
    expect(formatMoney(120000, "JPY")).toBe("JP¥120,000");
    expect(formatMoney(125050, "USD", { homeOf: "GBP" })).toBe("US$1,250.50");
    expect(formatMoney(125050, "USD", { homeOf: "USD" })).toBe("$1,250.50");
    expect(formatMoney(5000, "CHF")).toBe("CHF 50");
  });

  it("parses amounts for currencies with other decimal places", () => {
    expect(parseMoney("¥1,200", 0)).toBe(1200);
    expect(parseMoney("1200.5", 0)).toBeNull();
    expect(parseMoney("€12.50")).toBe(1250);
    expect(parseMoney("12.50 EUR")).toBe(1250);
    expect(parseMoney("1 2a")).toBeNull();
  });
});

describe("postings with an exchange difference", () => {
  it("books a gain when more arrives than the invoice was worth", () => {
    const lines = balanced(posting.receipt(80000, "Bank transfer", 79120));
    expect(lines).toContainEqual({ code: "4800", debit: 0, credit: 880 });
  });
  it("books a loss when a bill costs more to pay than it was worth", () => {
    const lines = balanced(posting.billPayment(51000, "Bank transfer", 50000));
    expect(lines).toContainEqual({ code: "4800", debit: 1000, credit: 0 });
  });
  it("adds no exchange line when nothing moved", () => {
    expect(balanced(posting.receipt(5000, "Cash")).map((l) => l.code)).toEqual(["1010", "1100"]);
  });
});
