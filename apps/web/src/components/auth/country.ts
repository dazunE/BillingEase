import { formatDate, formatMoney, rulesFor, today, type CountryCode } from "@billingease/core";

/** What the signed-out pages say about each country, worded from the real rules in @billingease/core. */
export type Cty = CountryCode;

export function isCty(v: unknown): v is Cty {
  return v === "uk" || v === "lk";
}

export const SYMBOL: Record<Cty, string> = { uk: "£", lk: "Rs" };

/** Whole-unit amount in the country's currency, e.g. "£2,400" or "Rs 640,000". */
export function money(units: number, c: Cty) {
  return formatMoney(units * 100, rulesFor(c).currency, { decimals: "never" });
}

/** "6 Apr" (UK tax year) or "1 Apr" (Sri Lanka year of assessment). */
export function yearStart(c: Cty) {
  return formatDate(rulesFor(c).taxYearOf(today()).from).replace(" ", "\u00a0");
}

export function yearSpan(c: Cty) {
  const y = rulesFor(c).taxYearOf(today());
  return `${formatDate(y.from)} to ${formatDate(y.to)}`;
}

/** The standard VAT rate label, e.g. "20%" or "18%". */
export function vatRate(c: Cty) {
  const r = rulesFor(c);
  return (r.vatRates.find((v) => v.id === r.defaultVatRateId) ?? r.vatRates[0]).label;
}

/** "2.5%" from basis points. */
export function ssclRate(c: Cty) {
  const bps = rulesFor(c).ssclBps;
  return `${(bps / 100).toFixed(2).replace(/\.?0+$/, "")}%`;
}

/** The four MTD quarters of the current tax year, "6 Apr–5 Jul, …". */
export function quarterSpans(type: "standard" | "calendar") {
  const r = rulesFor("uk");
  const y = Number(r.taxYearOf(today()).from.slice(0, 4));
  return [`${y}-05-15`, `${y}-08-15`, `${y}-11-15`, `${y + 1}-02-15`]
    .map((d) => r.periodOf(d, { quarterType: type }))
    .map((p) => `${formatDate(p.from)}–${formatDate(p.to)}`)
    .join(", ");
}

/** Illustrative month for a small design studio, used on the dark explainer panels. */
export function example(c: Cty) {
  const ex = c === "lk" ? { in: 1_450_000, out: 980_000, setAside: 0.2 } : { in: 5200, out: 1950, setAside: 0.25 };
  const profit = ex.in - ex.out;
  const keep = profit - Math.round(profit * ex.setAside);
  return { in: money(ex.in, c), out: money(ex.out, c), keep: money(keep, c), setAsidePct: `${Math.round(ex.setAside * 100)}%` };
}

/** Sample documents from the country's sample business (Harper Studio, Serendib Design Studio). */
export function sampleDocs(c: Cty, variant: "a" | "b") {
  const W = c === "lk"
    ? { a: { invNo: "SDS-0216", invWho: "Colombo Dental Clinic", inv: 180_000, out: 12_500, rcWho: "Internet · Oct" }, b: { invNo: "SDS-0214", invWho: "Kandyan Spice Co", inv: 640_000, out: 350_000, rcWho: "Office rent · Oct" } }
    : { a: { invNo: "HS-0046", invWho: "Ochre Café", inv: 450, out: 54, rcWho: "Software · Oct" }, b: { invNo: "HS-0048", invWho: "Kirkstall Brewing Co", inv: 2400, out: 180, rcWho: "Desk · Oct" } };
  const w = W[variant];
  return { ...w, invAmt: money(w.inv, c), outAmt: money(w.out, c), inPill: `+${money(w.inv, c)}`, outPill: `−${money(w.out, c)}` };
}

/** Rates on these pages are illustrative until the rules are checked. */
export function ratesNote(c: Cty) {
  return rulesFor(c).verified ? "" : c === "lk" ? "Rates are checked against ird.gov.lk before launch." : "Rates are checked against gov.uk before launch.";
}
