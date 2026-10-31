import { CURRENCIES, currencyName } from "@billingease/core";
import { Field, Select } from "@/components/ui";

/** A customer's or supplier's usual currency: blank for the home currency. Posts `currency`. */
export function CurrencyField({ home, value, error, hint, className }: { home: string; value?: string | null; error?: string; hint?: string; className?: string }) {
  return (
    <Field label="Usual currency" hint={hint} error={error} className={className}>
      <Select name="currency" defaultValue={value ?? ""}>
        <option value="">{home} · {currencyName(home)} (your books)</option>
        {CURRENCIES.filter((c) => c.code !== home).map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
      </Select>
    </Field>
  );
}
