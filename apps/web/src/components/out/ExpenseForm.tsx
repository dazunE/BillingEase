"use client";

import type { Expense, OutSetup } from "@billingease/contracts";
import { currencyDigits, formatMoney } from "@billingease/core";
import { CurrencyRate } from "@/components/fx/CurrencyRate";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { recordExpense, updateExpense } from "@/app/app/out/actions";
import { Button, Field, Input, cx } from "@/components/ui";
import type { FormState } from "@/lib/form";
import { Alert, CategoryPicker, ChequeFields, Chips, FilePicker, MoneyInput, previewMinor, uploadFile, vatInside } from "./fields";

const PCTS = ["100", "75", "50", "25"];

/** Record an expense (or change one): amount, who, when, how, category, business use, VAT and a photo or PDF. */
export function ExpenseForm({ setup, suppliers, supplierCurrencies = {}, expense, onSaved, autoFocus }: {
  setup: OutSetup; suppliers: string[]; supplierCurrencies?: Record<string, string>; expense?: Expense; onSaved?: (message: string) => void; autoFocus?: boolean;
}) {
  const home = setup.currency;
  // A receipt in another currency: its own amounts are typed, and what left the account is kept.
  const [currency, setCurrency] = useState(expense?.currency ?? home);
  const [fxRate, setFxRate] = useState(expense?.fxRate ?? (currency === home ? "1" : ""));
  const [currencyPicked, setCurrencyPicked] = useState(!!expense);
  const [spentOn, setSpentOn] = useState(expense?.spentOn ?? setup.today);
  const foreign = currency !== home;
  const digits = currencyDigits(currency);
  const dec = (m: number, d = digits) => (m / 10 ** d).toFixed(d);
  const onPayee = (name: string) => {
    if (currencyPicked) return;
    const c = supplierCurrencies[name.trim().toLowerCase()] ?? home;
    if (c !== currency) { setCurrency(c); setFxRate(c === home ? "1" : ""); }
  };
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, start] = useTransition();
  const v = state?.values ?? {};
  const e = state?.errors ?? {};
  const cats = setup.categories;
  const current = expense?.categoryId ? cats.find((c) => c.id === expense.categoryId) : null;
  const [scope, setScope] = useState<"business" | "property">(current?.scope ?? (setup.hasProperty && setup.categories.every((c) => c.scope === "property") ? "property" : "business"));
  const [category, setCategory] = useState(expense ? expense.categoryId ?? "later" : "");
  const [method, setMethod] = useState(expense?.method ?? setup.payMethods[0]);
  const [pct, setPct] = useState(String(expense?.bizPct ?? 100));
  const [gross, setGross] = useState(expense ? dec(expense.originalGross ?? expense.gross) : "");
  const [vat, setVat] = useState(expense && (expense.originalVat ?? expense.vat) ? dec(expense.originalVat ?? expense.vat) : "");
  const [homeGross, setHomeGross] = useState(expense?.currency ? dec(expense.gross, currencyDigits(home)) : "");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>();
  const shown = useMemo(() => cats.filter((c) => !setup.hasProperty || c.scope === scope), [cats, scope, setup.hasProperty]);
  const grossMinor = previewMinor(gross, currency);
  const pctNum = Math.min(100, Math.max(0, Number(pct) || 0));
  const biz = Math.round((grossMinor * pctNum) / 100);
  const vatRate = setup.defaultVatBps;
  const money = (m: number) => formatMoney(m, currency, { decimals: "always", homeOf: home });

  function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    if (!setup.businessUse) fd.set("bizPct", "100");
    start(async () => {
      setFileError(undefined);
      const s = expense ? await updateExpense(expense.id, undefined, fd) : await recordExpense(undefined, fd);
      setState(s);
      if (!s?.ok) return;
      const id = s.values?.id ?? expense?.id;
      if (file && id) {
        const err = await uploadFile("expense", id, file);
        if (err) {
          setFileError(err);
          if (!expense) router.push(`/app/out/expenses/${id}`);
          return;
        }
      }
      setFile(null);
      if (!expense) {
        formRef.current?.reset();
        setGross(""); setVat(""); setHomeGross(""); setCategory(""); setPct("100"); setMethod(setup.payMethods[0]);
        setState(undefined);
        onSaved?.(file ? "Expense recorded with its attachment." : "Expense recorded.");
      }
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Alert state={state && !state.ok ? state : state?.ok && expense ? state : undefined} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1.2fr_1fr]">
        <Field label="Amount paid" error={e.gross}>
          <MoneyInput currency={currency} name="gross" value={gross} onChange={(x) => setGross(x.target.value)} autoFocus={autoFocus} aria-invalid={!!e.gross} />
        </Field>
        <Field label="Paid to" error={e.payee}>
          <Input name="payee" list="out-suppliers" onChange={(x) => onPayee(x.target.value)} defaultValue={v.payee ?? expense?.payee} placeholder={{ uk: "e.g. Royal Mail, LNER", lk: "e.g. Keells Super, Ceypetco", us: "e.g. Staples, Delta" }[setup.country]} autoComplete="off" aria-invalid={!!e.payee} />
        </Field>
        <Field label="What for (optional)" error={e.note}>
          <Input name="note" defaultValue={v.note ?? expense?.note ?? ""} placeholder={{ uk: "e.g. Train to a client in York", lk: "e.g. Fuel for the van", us: "e.g. Flight to a client in Chicago" }[setup.country]} />
        </Field>
        <Field label="When" error={e.spentOn}>
          <Input type="date" name="spentOn" value={spentOn} onChange={(x) => setSpentOn(x.target.value)} max="2100-12-31" />
        </Field>
      </div>
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="homeCurrency" value={home} />
      <input type="hidden" name="fxRate" value={foreign ? fxRate : ""} />
      <div className="flex flex-col gap-3">
        <CurrencyRate home={home} currency={currency} rate={fxRate} total={grossMinor || undefined} date={spentOn}
          onCurrency={(c) => { setCurrencyPicked(true); setCurrency(c); }} onRate={setFxRate}
          currencyError={e.currency} rateError={e.fxRate}
          currencyHint={foreign ? "As on the receipt." : "Paid abroad? Pick the currency on the receipt."} />
        {foreign && (
          <Field label={`What left your account (${home}), if you know it`} error={e.homeGross} className="max-w-sm"
            hint="From your bank or card statement. It's what your books record; leave it empty to use the rate.">
            <MoneyInput currency={home} name="homeGross" value={homeGross} onChange={(x) => setHomeGross(x.target.value)} />
          </Field>
        )}
      </div>
      <datalist id="out-suppliers">{suppliers.map((s) => <option key={s} value={s} />)}</datalist>

      <Chips name="method" legend="Paid with" value={method} onChange={setMethod} error={e.method}
        options={setup.payMethods.map((m) => ({ id: m, label: m }))} />
      {method.toLowerCase() === "cheque" && <ChequeFields errors={e} values={{ chequeNumber: v.chequeNumber ?? expense?.chequeNumber ?? "", chequeBank: v.chequeBank ?? expense?.chequeBank ?? "", chequeDate: v.chequeDate ?? expense?.chequeDate ?? "" }} />}

      {setup.hasProperty && (
        <Chips name="scope" legend="Which part of your income is it for?" value={scope} onChange={(s) => { setScope(s as "business" | "property"); setCategory(""); }}
          options={[{ id: "business", label: "Your business" }, { id: "property", label: "Your property" }]} />
      )}
      <CategoryPicker categories={shown} value={category} onChange={setCategory} allowLater source={setup.categorySource} error={e.categoryId} />

      <div className={cx("grid gap-4", (setup.businessUse || setup.vatRegistered) && "md:grid-cols-2")}>
        {(setup.businessUse || setup.vatRegistered) && (
          <div className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
            {setup.businessUse && (
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold">Business use</span>
                <span className="text-xs text-muted">Part personal, like a phone you also use at home? Only the business share counts.</span>
                <div className="flex flex-wrap items-center gap-2">
                  {PCTS.map((p) => (
                    <button key={p} type="button" onClick={() => setPct(p)} aria-pressed={pct === p}
                      className={cx("min-h-11 rounded-full border px-4 text-sm font-semibold", pct === p ? "border-going bg-going-tint" : "border-line bg-white hover:border-input")}>{p}%</button>
                  ))}
                  <label className="flex items-center gap-1.5 text-sm font-semibold">
                    <span className="sr-only">Business use percentage</span>
                    <span className="w-20"><Input name="bizPct" value={pct} onChange={(x) => setPct(x.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" aria-invalid={!!e.bizPct} /></span>%
                  </label>
                </div>
                {e.bizPct ? <span className="text-xs font-semibold text-late">{e.bizPct}</span> : (
                  <span className="text-sm text-ink2">
                    {pctNum >= 100 || !grossMinor ? "All of it is for the business." : `${money(biz)} is a business cost; ${money(grossMinor - biz)} is personal (money you took out).`}
                  </span>
                )}
              </div>
            )}
            {setup.vatRegistered && (
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold">{setup.country === "lk" ? "Input VAT on the supplier's Tax Invoice" : "VAT on the receipt"}</span>
                <span className="text-xs text-muted">{setup.country === "lk" ? "Only if the supplier is VAT registered and gave you a Tax Invoice. It goes to your VAT return as input tax." : "Only if the receipt shows VAT. You can reclaim it on your VAT return."}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <MoneyInput currency={currency} name="vat" value={vat} onChange={(x) => setVat(x.target.value)} className="w-44" aria-label="VAT amount" aria-invalid={!!e.vat} />
                  {grossMinor > 0 && vatRate > 0 && (
                    <button type="button" className="min-h-11 rounded-full bg-white px-4 text-sm font-semibold hover:bg-ink/[0.04]" onClick={() => setVat(dec(vatInside(grossMinor, vatRate)))}>
                      Work it out at {vatRate / 100}%
                    </button>
                  )}
                </div>
                {e.vat && <span className="text-xs font-semibold text-late">{e.vat}</span>}
              </div>
            )}
          </div>
        )}
        {!expense && (
          <FilePicker file={file} onFile={setFile} error={fileError}
            hint={{ uk: "A photo or PDF, kept with your books. HMRC can ask to see it.", lk: "A photo or PDF of the bill or receipt, kept with your books for your tax practitioner.", us: "A photo or PDF, kept with your books. The IRS can ask to see it." }[setup.country]} />
        )}
      </div>
      {expense && fileError && <p className="text-sm font-semibold text-late">{fileError}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={pending}>{pending ? "Saving…" : expense ? "Save changes" : "Add expense"}</Button>
        <span className="text-[13px] text-muted">{expense ? "The old figures are reversed in your books and the new ones posted." : "It goes into Going out as paid."}</span>
      </div>
    </form>
  );
}
