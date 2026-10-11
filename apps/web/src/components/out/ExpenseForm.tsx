"use client";

import { useState, useTransition, type FormEvent } from "react";
import { recordExpenseAction, type FormState } from "@/app/app/out/actions";
import { Button, Field, Input, Select, cx } from "@/components/ui";
import { formatMoney, parseMoney } from "@/lib/money";
import type { CategoryOption } from "@/lib/ops-out";

type PayFrom = { id: string; name: string; subtype: string | null };

/** Quick picks shown as chips; the select below has every category. */
const QUICK = ["6030", "6070", "6040", "6060", "6000", "6090"];
const SHORT: Record<string, string> = { "6060": "Software", "6090": "Fuel" };

/**
 * "Record an expense": cash or card already spent. The category is guessed
 * live from what you type, using the same keyword rules as the server.
 */
export function ExpenseForm({ payFrom, categories, rules, today }: { payFrom: PayFrom[]; categories: CategoryOption[]; rules: [string, string][]; today: string }) {
  const defaultFrom = payFrom.find((a) => a.subtype === "card")?.id ?? payFrom[0]?.id ?? "";
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [from, setFrom] = useState(defaultFrom);
  const [manualCat, setManualCat] = useState("");
  const [date, setDate] = useState(today);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<FormState | null>(null);
  const [pending, startTransition] = useTransition();

  const byCode = new Map(categories.map((c) => [c.code, c]));
  const guessCode = description.trim() ? rules.find(([src]) => new RegExp(src, "i").test(description))?.[1] : undefined;
  const guess = guessCode ? byCode.get(guessCode) : undefined;
  const chosenId = manualCat || guess?.id || "";
  const chosen = categories.find((c) => c.id === chosenId);
  const quick = QUICK.map((c) => byCode.get(c)).filter((c): c is CategoryOption => !!c);

  const hint = manualCat
    ? `Category: ${chosen?.name}`
    : guess
      ? `Looks like ${guess.name}. Tap another if we're wrong.`
      : "Category (we'll guess from what you type)";

  function validate() {
    const e: Record<string, string> = {};
    const cents = parseMoney(amount);
    if (!cents || cents <= 0) e.amount = "Add an amount above $0.";
    if (!description.trim()) e.description = "Say what it was for.";
    if (!from) e.paidFromAccountId = "Choose what you paid with.";
    if (!chosenId) e.categoryAccountId = "Choose a category.";
    if (!date) e.spentOn = "Pick the date you paid.";
    else if (date > today) e.spentOn = "That date is in the future. Add it as a bill instead.";
    return e;
  }

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setResult(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    const fd = new FormData(ev.currentTarget);
    startTransition(async () => {
      const r = await recordExpenseAction({ ok: false }, fd);
      setResult(r);
      setErrors(r.errors ?? {});
      if (r.ok) {
        setAmount("");
        setDescription("");
        setManualCat("");
      }
    });
  }

  const clear = (key: string) => {
    if (errors[key]) setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="@container flex flex-col gap-3.5" aria-describedby="exp-sub">
      <div className="grid grid-cols-1 gap-3 @md:grid-cols-[150px_1fr]">
        <Field label="Amount" error={errors.amount}>
          <span className="relative flex">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted" aria-hidden>
              $
            </span>
            <Input
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                clear("amount");
              }}
              aria-invalid={!!errors.amount}
              className="pl-7 tabular"
            />
          </span>
        </Field>
        <Field label="What for" error={errors.description}>
          <Input
            name="description"
            placeholder="e.g. Client lunch, printer ink"
            maxLength={200}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clear("description");
            }}
            aria-invalid={!!errors.description}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 @md:grid-cols-[1fr_170px]">
        <Field label="Paid with" error={errors.paidFromAccountId}>
          <Select name="paidFromAccountId" value={from} onChange={(e) => setFrom(e.target.value)}>
            {payFrom.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" error={errors.spentOn}>
          <Input
            type="date"
            name="spentOn"
            max={today}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              clear("spentOn");
            }}
            aria-invalid={!!errors.spentOn}
          />
        </Field>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold" aria-live="polite">
          {hint}
        </legend>
        <div className="flex flex-wrap gap-2">
          {quick.map((c) => {
            const on = chosenId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setManualCat(manualCat === c.id ? "" : c.id);
                  clear("categoryAccountId");
                }}
                className={cx(
                  "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold",
                  on ? "border-going bg-going-tint" : "border-input bg-white hover:border-ink",
                )}
              >
                {SHORT[c.code] ?? c.name}
              </button>
            );
          })}
        </div>
        <Field label="Or pick any category" error={errors.categoryAccountId} className="mt-1">
          <Select
            name="categoryAccountId"
            value={chosenId}
            onChange={(e) => {
              setManualCat(e.target.value);
              clear("categoryAccountId");
            }}
            aria-invalid={!!errors.categoryAccountId}
          >
            <option value="">Choose a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : parseMoney(amount) ? `Add ${formatMoney(parseMoney(amount)!)} expense` : "Add expense"}
        </Button>
      </div>
      {result?.message && (
        <p role={result.ok ? "status" : "alert"} className={cx("text-sm font-semibold", result.ok ? "text-pos" : "text-late")}>
          {result.message}
        </p>
      )}
    </form>
  );
}
