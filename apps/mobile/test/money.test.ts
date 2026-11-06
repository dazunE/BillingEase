import { describe, expect, it } from "vitest";
import { fit, padDisplay, padPress, padToMinor, shortMoney, symbol } from "../src/lib/money";

const type = (keys: string[]) => keys.reduce(padPress, "");

describe("the number pad", () => {
  it("types an amount and reads it as minor units", () => {
    expect(type(["4", "2", ".", "5"])).toBe("42.5");
    expect(padToMinor("42.5")).toBe(4250);
    expect(padToMinor("1250")).toBe(125000);
    expect(padToMinor("")).toBe(0);
    expect(padToMinor(".")).toBe(0);
  });
  it("stops at two decimal places, one point and nine digits", () => {
    expect(type(["1", ".", "2", "3", "4"])).toBe("1.23");
    expect(type(["1", ".", ".", "5"])).toBe("1.5");
    expect(type("1234567890".split(""))).toBe("123456789");
    expect(type([".", "5"])).toBe("0.5");
  });
  it("deletes and doesn't keep a leading zero", () => {
    expect(type(["0", "7"])).toBe("7");
    expect(type(["1", "2", "del"])).toBe("1");
  });
  it("shows thousands separators", () => {
    expect(padDisplay("1250000.5")).toBe("1,250,000.5");
    expect(padDisplay("")).toBe("0");
  });
});

describe("money in small spaces", () => {
  it("shortens big rupee amounts and leaves pounds", () => {
    expect(shortMoney(395000, "GBP")).toBe("£3,950");
    expect(shortMoney(203433500, "LKR")).toBe("Rs 2.03m");
    expect(shortMoney(33866000, "LKR")).toBe("Rs 339k");
  });
  it("puts a space after a symbol made of letters", () => {
    expect(symbol("GBP")).toBe("£");
    expect(symbol("LKR")).toBe("Rs ");
  });
  it("shrinks a long figure to fit", () => {
    expect(fit("£4,620", 46, 11)).toBe(46);
    expect(fit("Rs 3,749,450.00", 46, 11)).toBeLessThan(46);
  });
});
