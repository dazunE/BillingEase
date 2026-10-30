"use client";

import type { MonthlyCost, OutSetup } from "@billingease/contracts";
import { useActionState, useState } from "react";
import { recordMonthly, saveMonthly } from "@/app/app/out/actions";
import { Button, Field, Input, Select } from "@/components/ui";
import { Alert, ChequeFields, MoneyInput } from "./fields";

const ord = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

/** Set up (or change) a cost you pay every month. */
export function MonthlyForm({ setup, suppliers, cost, onCancel }: { setup: OutSetup; suppliers: { id: string; name: string }[]; cost?: MonthlyCost; onCancel?: () => void }) {
  const [state, action, pending] = useActionState(saveMonthly, undefined);
  const e = state?.errors ?? {};
  const v = state?.values ?? {};
  const [method, setMethod] = useState(v.method ?? cost?.method ?? setup.payMethods[0]);
  const groups = [...new Set(setup.categories.map((c) => c.scope))];
  const amt = (m?: number) => (m ? (m / 100).toFixed(2) : "");
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {cost && <input type="hidden" name="id" value={cost.id} />}
      <Alert state={state} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="What is it" error={e.name}>
          <Input name="name" defaultValue={v.name ?? cost?.name} placeholder={setup.country === "lk" ? "e.g. Studio cleaning" : "e.g. Desk at the co-working"} />
        </Field>
        <Field label="Amount each month" error={e.amount}>
          <MoneyInput currency={setup.currency} name="amount" defaultValue={v.amount ?? amt(cost?.amount)} />
        </Field>
        <Field label="Day of the month" error={e.dayOfMonth}>
          <Select name="dayOfMonth" defaultValue={v.dayOfMonth ?? String(cost?.dayOfMonth ?? 1)}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{ord(d)}</option>)}
          </Select>
        </Field>
        <Field label="Category" error={e.categoryId}>
          <Select name="categoryId" defaultValue={v.categoryId ?? cost?.categoryId ?? setup.categories.find((c) => c.id === "other")?.id}>
            {groups.length > 1
              ? groups.map((g) => <optgroup key={g} label={g === "property" ? "Property" : "Business"}>{setup.categories.filter((c) => c.scope === g).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)
              : setup.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Paid with" error={e.method}>
          <Select name="method" value={method} onChange={(x) => setMethod(x.target.value)}>
            {setup.payMethods.map((m) => <option key={m}>{m}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Supplier" hint="Optional: their page then shows every payment" error={e.supplierId}>
          <Select name="supplierId" defaultValue={v.supplierId ?? cost?.supplierId ?? ""}>
            <option value="">None</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        {setup.vatRegistered && (
          <Field label={setup.country === "lk" ? "Input VAT each month (from their Tax Invoice)" : "VAT each month"} error={e.vat}>
            <MoneyInput currency={setup.currency} name="vat" defaultValue={v.vat ?? amt(cost?.vat)} />
          </Field>
        )}
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button disabled={pending}>{pending ? "Saving…" : cost ? "Save" : "Set it up"}</Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}

/** Record this month's payment of an every-month cost, on the day it was paid. */
export function RecordMonthly({ cost, currency, today, methods }: { cost: MonthlyCost; currency: "GBP" | "LKR" | "USD"; today: string; methods: string[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(recordMonthly, undefined);
  const [method, setMethod] = useState(cost.method);
  const e = state?.errors ?? {};
  if (!open) return <Button type="button" variant="secondary" className="min-h-11 px-4" onClick={() => setOpen(true)}>Record</Button>;
  return (
    <form action={action} noValidate className="flex w-full flex-col gap-3 rounded-2xl bg-surface p-4">
      <input type="hidden" name="id" value={cost.id} />
      <Alert state={state && !state.ok ? state : undefined} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Paid on" error={e.spentOn}>
          <Input type="date" name="spentOn" defaultValue={cost.dueOn < today ? cost.dueOn : today} />
        </Field>
        <Field label="Amount" error={e.gross}>
          <MoneyInput currency={currency} name="gross" defaultValue={(cost.amount / 100).toFixed(2)} />
        </Field>
        <Field label="Paid with" error={e.method}>
          <Select name="method" value={method} onChange={(x) => setMethod(x.target.value)}>
            {methods.map((m) => <option key={m}>{m}</option>)}
          </Select>
        </Field>
      </div>
      {method.toLowerCase() === "cheque" && <ChequeFields errors={e} values={{}} />}
      <div className="flex flex-wrap gap-2.5">
        <Button disabled={pending}>{pending ? "Saving…" : "Record as paid"}</Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

/** Edit in place. */
export function EditMonthly({ setup, suppliers, cost }: { setup: OutSetup; suppliers: { id: string; name: string }[]; cost: MonthlyCost }) {
  const [open, setOpen] = useState(false);
  if (!open) return <Button type="button" variant="ghost" onClick={() => setOpen(true)}>Edit</Button>;
  return <div className="w-full rounded-2xl bg-surface p-4"><MonthlyForm setup={setup} suppliers={suppliers} cost={cost} onCancel={() => setOpen(false)} /></div>;
}

