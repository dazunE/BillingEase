import { rulesFor, type CountryCode, type TaxPeriod } from "./countries";
import { addDays, addMonths, monthEnd, monthPeriod, type IsoDate, type Period } from "./dates";

export type PeriodKey = "month" | "quarter" | "year";

/**
 * The periods Home and the area pages switch between. UK: this MTD quarter and the tax year.
 * US: the calendar quarter and year. Sri Lanka: this month (VAT period) and the year of assessment. All also have the month.
 */
export function periodsFor(b: { country: CountryCode; quarterType?: "standard" | "calendar" }, today: IsoDate): Record<PeriodKey, Period> & { default: PeriodKey } {
  const rules = rulesFor(b.country);
  const year = rules.taxYearOf(today);
  const month = monthPeriod(today);
  const q = b.country !== "lk" ? rules.periodOf(today, { quarterType: b.quarterType }) : null;
  return {
    month,
    quarter: q ? { from: q.from, to: q.to, label: q.label } : month,
    year: { ...year, label: `Tax year ${year.label}` },
    default: b.country === "lk" ? "month" : "quarter",
  };
}

/**
 * A UK VAT return period: calendar quarters (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec), the most common
 * stagger. Returns and payment are due one month and seven days after the period ends.
 */
export function ukVatQuarterOf(date: IsoDate): TaxPeriod {
  const [y, m] = date.split("-").map(Number);
  const q = Math.floor((m - 1) / 3);
  const from = `${y}-${String(q * 3 + 1).padStart(2, "0")}-01`;
  const to = monthEnd(addMonths(from, 2));
  const names = ["Jan – Mar", "Apr – Jun", "Jul – Sep", "Oct – Dec"];
  return { id: `${y}-vq${q + 1}`, kind: "quarter", from, to, label: `${names[q]} ${y}`, due: addDays(addMonths(addDays(to, 1), 1), 6) };
}

export type FilingKind = "mtd" | "vat";

/**
 * Every filing period in the tax year that holds `date`, oldest first. `mtd`: the UK's Making
 * Tax Digital quarters. `vat`: Sri Lanka's monthly VAT and SSCL periods, or the UK's VAT quarters
 * that end in the tax year.
 */
export function filingPeriods(b: { country: CountryCode; quarterType?: "standard" | "calendar" }, kind: FilingKind, date: IsoDate): TaxPeriod[] {
  const rules = rulesFor(b.country);
  const year = rules.taxYearOf(date);
  let at: (d: IsoDate) => TaxPeriod;
  let start: IsoDate;
  let keep: (p: TaxPeriod) => boolean;
  if (kind === "mtd" && rules.features.mtdQuarters) {
    at = (d) => rules.periodOf(d, { quarterType: b.quarterType });
    start = year.from;
    keep = (p) => p.from <= year.to;
  } else if (kind === "vat" && b.country === "uk") {
    // The VAT quarters that end inside the tax year.
    at = ukVatQuarterOf;
    start = ukVatQuarterOf(year.from).from;
    keep = (p) => p.to <= year.to;
  } else if (kind === "vat" && b.country === "lk") {
    at = (d) => rules.periodOf(d);
    start = year.from;
    keep = (p) => p.from <= year.to;
  } else return [];
  const out: TaxPeriod[] = [];
  for (let p = at(start); keep(p) && out.length < 12; p = at(addDays(p.to, 1))) if (p.to >= year.from) out.push(p);
  return out;
}
