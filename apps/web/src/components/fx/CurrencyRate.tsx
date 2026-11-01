"use client";

import { CURRENCIES, convertMinor, currencyName, formatDate, formatMoney, parseRate, type Currency } from "@billingease/core";
import { useEffect, useRef, useState } from "react";
import { lookupRate } from "@/app/app/fx-actions";
import { Field, Input, Select, cx } from "@/components/ui";

/**
 * The currency a quote, invoice, bill or expense is written in, and (for a foreign one) the rate
 * that turns it into the home currency. The day's rate is filled in; the person can change it to
 * the one their bank used. Shows what the total comes to in the home currency.
 */
export function CurrencyRate({
  home, currency, onCurrency, rate, onRate, date, total, currencyError, rateError, currencyHint, note, className,
}: {
  home: Currency;
  currency: string;
  onCurrency: (c: string) => void;
  rate: string;
  onRate: (r: string) => void;
  /** The day the rate is for (issue, bill or spent date). */
  date: string;
  /** The document's total in its currency, to show in the home currency. */
  total?: number;
  currencyError?: string;
  rateError?: string;
  currencyHint?: string;
  /** A line under the converted total, e.g. what the books record. */
  note?: string;
  className?: string;
}) {
  const foreign = currency !== home;
  // A rate the person typed is theirs: a new date doesn't overwrite it.
  const [typed, setTyped] = useState(false);
  // The last lookup: for which currency and day, and the day the rate was for (null: none found).
  const key = `${currency}|${date}`;
  const [result, setResult] = useState<{ key: string; day: string | null } | null>(null);
  const asked = useRef("");

  useEffect(() => {
    if (!foreign || !date || asked.current === key) return;
    asked.current = key;
    if (typed && rate) return;
    let live = true;
    lookupRate(currency, date).then((r) => {
      if (!live) return;
      setResult({ key, day: r?.rate ? r.day : null });
      if (r?.rate) onRate(r.rate);
    });
    return () => { live = false; };
  }, [foreign, currency, date, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const mine = result?.key === key ? result : null;
  const status = !foreign ? "idle" : typed && rate ? "typed" : !mine ? "loading" : mine.day ? "found" : "none";
  const foundFor = mine?.day ?? null;

  const r = parseRate(rate);
  const homeTotal = foreign && r && total != null ? convertMinor(total, currency, home, r) : null;
  const hint = !foreign ? undefined
    : status === "loading" ? "Looking up the day's rate…"
    : status === "found" && foundFor ? `Rate for ${formatDate(foundFor, { year: true })}. Change it to the one your bank used.`
    : status === "none" && !rate ? "We couldn't find a rate for this day. Enter the one you're using."
    : "The rate you're using.";

  return (
    <div className={cx("flex flex-col gap-3", className)}>
      <div className={cx("grid gap-4", foreign && "sm:grid-cols-2")}>
        <Field label="Currency" hint={currencyHint} error={currencyError}>
          <Select aria-label="Currency" value={currency} onChange={(ev) => { setTyped(false); onCurrency(ev.target.value); if (ev.target.value === home) onRate("1"); else onRate(""); }}>
            <option value={home}>{home} · {currencyName(home)} (your books)</option>
            {CURRENCIES.filter((c) => c.code !== home).map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
          </Select>
        </Field>
        {foreign && (
          <Field label={`Exchange rate: 1 ${currency} =`} hint={hint} error={rateError}>
            <span className="flex items-center gap-2">
              <Input inputMode="decimal" aria-label={`${home} for 1 ${currency}`} value={rate} placeholder="0.00"
                onChange={(ev) => { setTyped(true); onRate(ev.target.value.trim()); }} />
              <span className="shrink-0 font-semibold">{home}</span>
            </span>
          </Field>
        )}
      </div>
      {foreign && homeTotal != null && (
        <p className="rounded-2xl bg-bg px-4 py-3 text-sm text-ink2" data-testid="home-total">
          <strong className="text-ink">{formatMoney(total!, currency, { decimals: "always", homeOf: home })}</strong> is{" "}
          <strong className="text-ink">{formatMoney(homeTotal, home, { decimals: "always" })}</strong> in your books.{note ? ` ${note}` : ""}
        </p>
      )}
    </div>
  );
}
