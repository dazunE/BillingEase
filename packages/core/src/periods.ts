import { rulesFor, type CountryCode } from "./countries";
import { monthPeriod, type IsoDate, type Period } from "./dates";

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
