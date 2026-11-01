"use client";

import type { OutSetup } from "@billingease/contracts";
import { addDays, currencyDigits, formatDate, formatMoney } from "@billingease/core";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBill } from "@/app/app/out/actions";
import { Button, Field, Input, Select, cx } from "@/components/ui";
import type { FormState } from "@/lib/form";
import { Alert, FilePicker, MoneyInput, previewMinor, uploadFile } from "./fields";
import { CurrencyRate } from "@/components/fx/CurrencyRate";

type Line = { key: number; description: string; categoryId: string; net: string; vat: string };

/** Enter a bill: who sent it, its number and dates, and one or more lines. */
export function BillForm({ setup, suppliers, supplierName, supplierCurrencies = {} }: {
  setup: OutSetup; suppliers: string[]; supplierName?: string;
  /** Each supplier's usual currency, by name: picking them brings it. */
  supplierCurrencies?: Record<string, string>;
}) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(undefined);
  const [pending, start] = useTransition();
  const [billDate, setBillDate] = useState(setup.today);
  const [dueDate, setDueDate] = useState(addDays(setup.today, setup.country === "uk" ? 14 : 30));
  const [lines, setLines] = useState<Line[]>([{ key: 0, description: "", categoryId: setup.categories[0]?.id ?? "", net: "", vat: "" }]);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>();
  const e = state?.errors ?? {};
  const v = state?.values ?? {};
  const home = setup.currency;
  const [currency, setCurrency] = useState((supplierName && supplierCurrencies[supplierName.toLowerCase()]) || home);
  const [fxRate, setFxRate] = useState(currency === home ? "1" : "");
  const [currencyPicked, setCurrencyPicked] = useState(false);
  const digits = currencyDigits(currency);
  const onSupplier = (name: string) => {
    if (currencyPicked) return;
    const c = supplierCurrencies[name.trim().toLowerCase()] ?? home;
    if (c !== currency) { setCurrency(c); setFxRate(c === home ? "1" : ""); }
  };
  const money = (m: number) => formatMoney(m, currency, { decimals: "always", homeOf: home });
  const net = lines.reduce((a, l) => a + previewMinor(l.net, currency), 0);
  const vat = setup.vatRegistered ? lines.reduce((a, l) => a + previewMinor(l.vat, currency), 0) : 0;
  const set = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const groups = [...new Set(setup.categories.map((c) => c.scope))];

  function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    fd.set("lineCount", String(lines.length));
    start(async () => {
      setFileError(undefined);
      const s = await createBill(undefined, fd);
      setState(s);
      if (!s?.ok || !s.values?.id) return;
      if (file) {
        const err = await uploadFile("bill", s.values.id, file);
        if (err) setFileError(err);
      }
      router.push(`/app/out/bills/${s.values.id}`);
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Alert state={state && !state.ok ? state : undefined} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Supplier" error={e.supplierName}>
          <Input name="supplierName" list="bill-suppliers" defaultValue={v.supplierName ?? supplierName} placeholder="Who sent the bill" autoComplete="off" aria-invalid={!!e.supplierName} onChange={(x) => onSupplier(x.target.value)} />
        </Field>
        <Field label="Bill number" hint="Optional" error={e.reference}>
          <Input name="reference" defaultValue={v.reference} placeholder="From the bill" />
        </Field>
        <Field label="Bill date" error={e.billDate}>
          <Input type="date" name="billDate" value={billDate} onChange={(x) => setBillDate(x.target.value)} />
        </Field>
        <Field label="Due" error={e.dueDate}>
          <Input type="date" name="dueDate" value={dueDate} onChange={(x) => setDueDate(x.target.value)} />
        </Field>
      </div>
      <datalist id="bill-suppliers">{suppliers.map((s) => <option key={s} value={s} />)}</datalist>
      <div className="-mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Due:</span>
        {[0, 7, 14, 30].map((d) => (
          <button key={d} type="button" onClick={() => billDate && setDueDate(addDays(billDate, d))}
            className={cx("min-h-9 rounded-full border px-3 font-semibold", dueDate === (billDate && addDays(billDate, d)) ? "border-going bg-going-tint" : "border-line bg-white")}>
            {d === 0 ? "On receipt" : `In ${d} days`}
          </button>
        ))}
        {dueDate && <span className="text-ink2">· due <strong>{formatDate(dueDate, { year: true })}</strong></span>}
      </div>

      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="fxRate" value={currency === home ? "" : fxRate} />
      <CurrencyRate home={home} currency={currency} rate={fxRate} total={net + vat} date={billDate}
        onCurrency={(c) => { setCurrencyPicked(true); setCurrency(c); }} onRate={setFxRate}
        currencyError={e.currency} rateError={e.fxRate}
        currencyHint={currency === home ? "A bill from abroad? Pick the currency on it." : "As on the bill. Your books record it in " + home + "."}
        note="That's what counts in Going out." />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-base font-bold">What it&apos;s for</legend>
        {lines.map((l, i) => {
          const cat = setup.categories.find((c) => c.id === l.categoryId);
          return (
            <div key={l.key} className="flex flex-col gap-2 rounded-2xl border border-line p-4">
              <div className={cx("grid gap-3", setup.vatRegistered ? "sm:grid-cols-[1.4fr_1fr_0.8fr_0.8fr]" : "sm:grid-cols-[1.6fr_1fr_0.8fr]")}>
                <Field label="Description" error={e[`lines.${i}.description`]}>
                  <Input name={`lines.${i}.description`} value={l.description} onChange={(x) => set(i, { description: x.target.value })} placeholder="What it was" />
                </Field>
                <Field label="Category" error={e[`lines.${i}.categoryId`]}>
                  <Select name={`lines.${i}.categoryId`} value={l.categoryId} onChange={(x) => set(i, { categoryId: x.target.value })}>
                    {groups.length > 1
                      ? groups.map((g) => <optgroup key={g} label={g === "property" ? "Property" : "Business"}>{setup.categories.filter((c) => c.scope === g).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)
                      : setup.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </Field>
                <Field label={setup.vatRegistered ? "Amount before VAT" : "Amount"} error={e[`lines.${i}.net`]}>
                  <MoneyInput currency={currency} name={`lines.${i}.net`} value={l.net} onChange={(x) => set(i, { net: x.target.value })} />
                </Field>
                {setup.vatRegistered && (
                  <Field label="VAT" error={e[`lines.${i}.vat`]}>
                    <MoneyInput currency={currency} name={`lines.${i}.vat`} value={l.vat} onChange={(x) => set(i, { vat: x.target.value })} />
                  </Field>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>{cat?.official}{cat && !cat.allowable ? " · not allowable" : ""}</span>
                <span className="flex gap-3">
                  {setup.vatRegistered && previewMinor(l.net, currency) > 0 && setup.defaultVatBps > 0 && (
                    <button type="button" className="min-h-9 font-semibold text-ink underline underline-offset-4" onClick={() => set(i, { vat: ((Math.round((previewMinor(l.net, currency) * setup.defaultVatBps) / 10000)) / 10 ** digits).toFixed(digits) })}>
                      Add VAT at {setup.defaultVatBps / 100}%
                    </button>
                  )}
                  {lines.length > 1 && <button type="button" className="min-h-9 font-semibold text-late underline underline-offset-4" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}>Remove line</button>}
                </span>
              </div>
            </div>
          );
        })}
        {e.lines && <span className="text-xs font-semibold text-late">{e.lines}</span>}
        <Button type="button" variant="secondary" className="self-start" onClick={() => setLines((ls) => [...ls, { key: Math.max(...ls.map((x) => x.key)) + 1, description: "", categoryId: ls[ls.length - 1]?.categoryId ?? "", net: "", vat: "" }])}>
          + Add a line
        </Button>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-2xl bg-surface p-4 text-[15px]">
          {setup.vatRegistered && <>
            <span className="flex justify-between"><span className="text-ink2">Before VAT</span><span className="tabular">{money(net)}</span></span>
            <span className="flex justify-between"><span className="text-ink2">{setup.country === "lk" ? "Input VAT" : "VAT"}</span><span className="tabular">{money(vat)}</span></span>
          </>}
          <span className="flex justify-between border-t border-line pt-2 font-bold"><span>Bill total</span><span className="font-display text-lg tabular">{money(net + vat)}</span></span>
          <span className="text-xs text-muted">{net + vat > 0 ? `All of it counts in Going out as still to pay until you mark it paid.` : "Add the amounts on the bill to see how it counts."}</span>
        </div>
        <FilePicker file={file} onFile={setFile} error={fileError} hint="A photo or PDF of the bill itself, kept with your books. BillingEase doesn't read it, so type the numbers above." />
      </div>

      <Button disabled={pending} className="self-start">{pending ? "Saving…" : "Save bill"}</Button>
    </form>
  );
}
