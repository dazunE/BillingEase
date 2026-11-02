import { describe, expect, it } from "vitest";
import { minorToDecimal, parseCsv, toCsv } from "../src/csv";

describe("csv", () => {
  it("writes quoted cells, CRLF lines and keeps formulas as text", () => {
    const out = toCsv(["Name", "Amount", "Note"], [["Ochre Café", "450.00", 'Said "thanks", paid'], ["=HYPERLINK(1)", "-12.50", null], ["@Kandy", -3, "line\nbreak"]]);
    expect(out).toBe('Name,Amount,Note\r\nOchre Café,450.00,"Said ""thanks"", paid"\r\n\'=HYPERLINK(1),-12.50,\r\n\'@Kandy,-3,"line\nbreak"\r\n');
  });

  it("turns minor units into plain decimals", () => {
    expect(minorToDecimal(123456)).toBe("1234.56");
    expect(minorToDecimal(5)).toBe("0.05");
    expect(minorToDecimal(-1250)).toBe("-12.50");
    expect(minorToDecimal(1500, 0)).toBe("1500");
    expect(minorToDecimal(0)).toBe("0.00");
  });

  it("reads commas, semicolons, tabs, quotes and blank lines", () => {
    expect(parseCsv('﻿name,email\r\n"Kirkstall Brewing, Co",accounts@kirkstall.example\r\n\r\nOchre Café , hello@ochre.example\n')).toEqual([
      ["name", "email"], ["Kirkstall Brewing, Co", "accounts@kirkstall.example"], ["Ochre Café", "hello@ochre.example"],
    ]);
    expect(parseCsv("name;email\nA;a@x.example")).toEqual([["name", "email"], ["A", "a@x.example"]]);
    expect(parseCsv('name\temail\n"Say ""hi"""\tb@x.example')).toEqual([["name", "email"], ['Say "hi"', "b@x.example"]]);
  });
});
