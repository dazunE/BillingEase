import { currencySymbol, formatMoney } from "@billingease/core";

/** Amounts from the API are in minor units (pence, cents). */
export function money(minor: number, currency: string, decimals: "auto" | "never" = "auto") {
  return formatMoney(minor, currency, { decimals });
}

/** For small tiles: £3,950 stays, Rs 2,034,335 becomes Rs 2.03m and Rs 338,660 becomes Rs 339k. */
export function shortMoney(minor: number, currency: string) {
  const whole = Math.round(minor / 100);
  const a = Math.abs(whole);
  if (a < 100_000) return formatMoney(whole * 100, currency, { decimals: "never" });
  const sym = symbol(currency);
  const v = a >= 1_000_000 ? (a / 1_000_000).toFixed(a >= 10_000_000 ? 1 : 2) + "m" : Math.round(a / 1000) + "k";
  return (whole < 0 ? "−" : "") + sym + v;
}

/** The symbol written before an amount, with its space when it's letters: "£" or "Rs ". */
export function symbol(currency: string) {
  const s = currencySymbol(currency);
  return /[A-Za-z]$/.test(s) ? s + " " : s;
}

/** A font size that keeps a figure on one line in a box about `room` characters wide. */
export function fit(text: string, base: number, room: number) {
  return text.length <= room ? base : Math.max(14, Math.floor((base * room) / text.length));
}

/** What the number pad has typed so far ("1250.5") as minor units, or 0. */
export function padToMinor(typed: string) {
  if (!typed || typed === ".") return 0;
  const [whole, frac = ""] = typed.split(".");
  return Number(whole || "0") * 100 + Number((frac + "00").slice(0, 2));
}

/** One key on the number pad. Two decimal places at most, nine digits at most. */
export function padPress(typed: string, key: string) {
  if (key === "del") return typed.slice(0, -1);
  if (key === ".") return typed.includes(".") ? typed : (typed || "0") + ".";
  if (typed.includes(".") && typed.split(".")[1].length >= 2) return typed;
  if (typed.replace(".", "").length >= 9) return typed;
  return typed === "0" ? key : typed + key;
}

/** The typed amount for display: "1,250.5" from "1250.5". */
export function padDisplay(typed: string) {
  if (!typed) return "0";
  const [whole, frac] = typed.split(".");
  const w = Number(whole || "0").toLocaleString("en-US");
  return typed.includes(".") ? `${w}.${frac}` : w;
}

export const CURRENCY_OF = { uk: "GBP", lk: "LKR", us: "USD" } as const;
