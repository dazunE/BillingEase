"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { addBillAction, type FormState } from "@/app/app/out/actions";
import { Button, Field, Input, Select, cx } from "@/components/ui";
import { formatMoney, parseMoney } from "@/lib/money";
import type { CategoryOption } from "@/lib/ops-out";

type Values = { vendorName: string; description: string; categoryAccountId: string; amount: string; billDate: string; dueDate: string };

/** "Add a bill": something you'll pay later. It counts as still to pay until it's paid. */
export function BillForm({ vendors, categories, today, defaultDue, suggestions }: { vendors: string[]; categories: CategoryOption[]; today: string; defaultDue: string; suggestions: [string, string][] }) {
  const listId = useId();
  const empty: Values = { vendorName: "", description: "", categoryAccountId: "", amount: "", billDate: today, dueDate: defaultDue };
  const [v, setV] = useState<Values>(empty);
  const [catTouched, setCatTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<FormState | null>(null);
  const [pending, startTransition] = useTransition();

  // Guess the category from the vendor and description until the user picks one.
  const text = `${v.vendorName} ${v.description}`.trim();
  const guessCode = text ? suggestions.find(([src]) => new RegExp(src, "i").test(text))?.[1] : undefined;
  const guessId = categories.find((c) => c.code === guessCode)?.id ?? "";
  const categoryId = catTouched ? v.categoryAccountId : v.categoryAccountId || guessId;

  const set = (k: keyof Values) => (e: { target: { value: string } }) => {
    setV((p) => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== k)));
  };

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setResult(null);
    const e: Record<string, string> = {};
    if (!v.vendorName.trim()) e.vendorName = "Who is the bill from?";
    const cents = parseMoney(v.amount);
    if (!cents || cents <= 0) e.amount = "Add an amount above $0.";
    if (!categoryId) e.categoryAccountId = "Choose a category.";
    if (!v.billDate) e.billDate = "Pick a date.";
    if (!v.dueDate) e.dueDate = "Pick a date.";
    else if (v.billDate && v.dueDate < v.billDate) e.dueDate = "The due date can't be before the bill date.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const fd = new FormData(ev.currentTarget);
    startTransition(async () => {
      const r = await addBillAction({ ok: false }, fd);
      setResult(r);
      setErrors(r.errors ?? {});
      if (r.ok) {
        setV(empty);
        setCatTouched(false);
      }
    });
  }

  const cents = parseMoney(v.amount);

  return (
    <form onSubmit={onSubmit} noValidate className="@container flex flex-col gap-3.5">
      <div className="grid grid-cols-1 gap-3 @md:grid-cols-2">
        <Field label="Who it's from" error={errors.vendorName}>
          <Input name="vendorName" list={listId} autoComplete="off" placeholder="e.g. Local Print Shop" maxLength={120} value={v.vendorName} onChange={set("vendorName")} aria-invalid={!!errors.vendorName} />
          <datalist id={listId}>
            {vendors.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </Field>
        <Field label="What for" error={errors.description}>
          <Input name="description" placeholder="e.g. Brochure print run" maxLength={200} value={v.description} onChange={set("description")} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 @md:grid-cols-[150px_1fr]">
        <Field label="Amount" error={errors.amount}>
          <span className="relative flex">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted" aria-hidden>
              $
            </span>
            <Input name="amount" inputMode="decimal" autoComplete="off" placeholder="0.00" value={v.amount} onChange={set("amount")} aria-invalid={!!errors.amount} className="pl-7 tabular" />
          </span>
        </Field>
        <Field label="Category" error={errors.categoryAccountId} hint={!catTouched && guessId ? "Our guess from the name. Change it if we're wrong." : undefined}>
          <Select
            name="categoryAccountId"
            value={categoryId}
            onChange={(e) => {
              setCatTouched(true);
              set("categoryAccountId")(e);
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
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Bill date" error={errors.billDate}>
          <Input type="date" name="billDate" value={v.billDate} onChange={set("billDate")} aria-invalid={!!errors.billDate} />
        </Field>
        <Field label="Due date" error={errors.dueDate}>
          <Input type="date" name="dueDate" min={v.billDate || undefined} value={v.dueDate} onChange={set("dueDate")} aria-invalid={!!errors.dueDate} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="dark" disabled={pending}>
          {pending ? "Adding…" : cents ? `Add ${formatMoney(cents)} bill` : "Add bill"}
        </Button>
        <span className="text-[13px] text-muted">We&apos;ll remind you before it&apos;s due.</span>
      </div>
      {result?.message && (
        <p role={result.ok ? "status" : "alert"} className={cx("text-sm font-semibold", result.ok ? "text-pos" : "text-late")}>
          {result.message}
        </p>
      )}
    </form>
  );
}
