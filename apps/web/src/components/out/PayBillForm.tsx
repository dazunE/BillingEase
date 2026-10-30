"use client";

import { formatMoney } from "@billingease/core";
import { useActionState, useState } from "react";
import { payBill } from "@/app/app/out/actions";
import { Button, Field, Input } from "@/components/ui";
import { Alert, ChequeFields, Chips, MoneyInput } from "./fields";

/** Mark a bill paid in full, or in part, with how it was paid. */
export function PayBillForm({ billId, left, currency, methods, today, supplier }: { billId: string; left: number; currency: "GBP" | "LKR" | "USD"; methods: string[]; today: string; supplier: string }) {
  const [mode, setMode] = useState<"none" | "full" | "part">("none");
  const [state, action, pending] = useActionState(payBill.bind(null, billId), undefined);
  const [method, setMethod] = useState(methods[0]);
  const [amount, setAmount] = useState((left / 100).toFixed(2));
  const e = state?.errors ?? {};
  const v = state?.values ?? {};
  const money = (m: number) => formatMoney(m, currency, { decimals: "always" });
  const [lastOk, setLastOk] = useState(state);
  if (state !== lastOk) {
    setLastOk(state);
    if (state?.ok) setMode("none");
  }

  return (
    <div className="flex flex-col gap-3">
      {state?.ok && <Alert state={state} />}
      <div className="flex flex-wrap gap-2.5">
        <Button type="button" onClick={() => { setMode("full"); setAmount((left / 100).toFixed(2)); }} aria-expanded={mode === "full"}>Mark paid in full · {money(left)}</Button>
        <Button type="button" variant="secondary" onClick={() => { setMode("part"); setAmount(""); }} aria-expanded={mode === "part"}>Mark part paid</Button>
      </div>
      <p className="text-[13px] text-muted">Pay {supplier} the usual way first. BillingEase doesn&apos;t send money.</p>
      {mode !== "none" && (
        <form action={action} noValidate className="flex flex-col gap-4 rounded-2xl bg-surface p-[18px]">
          <h3 className="text-base font-bold">{mode === "full" ? "Mark it paid" : "Mark part of it paid"}</h3>
          {state && !state.ok && <Alert state={state} />}
          {mode === "part" && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="min-h-11 rounded-full border border-line bg-white px-4 text-sm font-semibold" onClick={() => setAmount((Math.round(left / 2) / 100).toFixed(2))}>Half · {money(Math.round(left / 2))}</button>
              <button type="button" className="min-h-11 rounded-full border border-line bg-white px-4 text-sm font-semibold" onClick={() => setAmount((left / 100).toFixed(2))}>All of it · {money(left)}</button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Amount paid" error={e.amount}>
              <MoneyInput currency={currency} name="amount" value={amount} onChange={(x) => setAmount(x.target.value)} readOnly={mode === "full"} aria-invalid={!!e.amount} />
            </Field>
            <Field label="Paid on" error={e.paidOn}>
              <Input type="date" name="paidOn" defaultValue={v.paidOn ?? today} />
            </Field>
          </div>
          <Chips name="method" legend="Paid with" value={method} onChange={setMethod} error={e.method} options={methods.map((m) => ({ id: m, label: m }))} />
          {method.toLowerCase() === "cheque" && <ChequeFields errors={e} values={v} />}
          <Field label="Reference" hint="Optional, e.g. the bank reference" error={e.reference}>
            <Input name="reference" defaultValue={v.reference} />
          </Field>
          <div className="flex flex-wrap gap-2.5">
            <Button disabled={pending}>{pending ? "Saving…" : "Mark paid"}</Button>
            <Button type="button" variant="secondary" onClick={() => setMode("none")}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}
