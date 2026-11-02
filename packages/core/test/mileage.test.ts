import { describe, expect, it } from "vitest";
import { parseMiles, showMiles, tripAmount } from "../src/mileage";

describe("mileage", () => {
  it("pays 45p a mile, then 25p after 10,000 miles in the year", () => {
    expect(tripAmount(500, "car")).toBe(2250);
    expect(tripAmount(320, "car")).toBe(1440);
    // 50 miles when 9,980 are done: 20 at 45p, 30 at 25p.
    expect(tripAmount(500, "car", 99_800)).toBe(900 + 750);
    expect(tripAmount(100, "car", 120_000)).toBe(250);
    expect(tripAmount(100, "motorcycle")).toBe(240);
    expect(tripAmount(105, "bicycle")).toBe(210);
  });

  it("reads and shows miles in tenths", () => {
    expect(parseMiles("12.5")).toBe(125);
    expect(parseMiles(" 50 ")).toBe(500);
    expect(parseMiles("1.25")).toBeNull();
    expect(parseMiles("-3")).toBeNull();
    expect(showMiles(125)).toBe("12.5");
    expect(showMiles(500)).toBe("50");
    expect(showMiles(98_680)).toBe("9,868");
  });
});
