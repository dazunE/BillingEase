"use client";

import { useActionState, useState } from "react";
import { Button, Field, Input, cx } from "@/components/ui";
import { createBusiness } from "./actions";

type Opt = { id: string; label: string; line?: string };

function Choice({ name, options, value, onChange, legend, hint }: { name: string; options: Opt[]; value: string; onChange: (v: string) => void; legend: string; hint?: string }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-[13px] font-semibold">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o.id} className={cx("flex cursor-pointer flex-col gap-0.5 rounded-2xl border p-3.5", value === o.id ? "border-ink bg-tint" : "border-line bg-white hover:border-input")}>
            <span className="flex items-center gap-2 text-[15px] font-semibold">
              <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="accent-[#18161F]" />
              {o.label}
            </span>
            {o.line && <span className="pl-6 text-[13px] leading-snug text-muted">{o.line}</span>}
          </label>
        ))}
      </div>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </fieldset>
  );
}

function YesNo({ name, legend, value, onChange, hint }: { name: string; legend: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <Choice name={name} legend={legend} hint={hint} value={value ? "on" : "off"} onChange={(v) => onChange(v === "on")}
      options={[{ id: "on", label: "Yes" }, { id: "off", label: "No" }]} />
  );
}

export function SetupForm({ country, ownerName }: { country: "uk" | "lk"; ownerName: string }) {
  const [state, action, pending] = useActionState(createBusiness, undefined);
  const v = state?.values ?? {};
  const e = state?.errors ?? {};
  const uk = country === "uk";
  const [kind, setKind] = useState(v.kind ?? (uk ? "sole_trader" : "sole_proprietor"));
  const [vat, setVat] = useState(v.vatRegistered === "on");
  const [sscl, setSscl] = useState(v.ssclRegistered === "on");
  const [basis, setBasis] = useState(v.basis ?? (uk ? "cash" : "accrual"));
  const [quarters, setQuarters] = useState(v.quarterType ?? "standard");

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      {state?.message && <p role="alert" className="rounded-xl bg-late-bg px-4 py-3 text-sm font-semibold text-late">{state.message}</p>}
      <input type="hidden" name="country" value={country} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" hint="As it should appear on invoices" error={e.name}>
          <Input name="name" defaultValue={v.name} required />
        </Field>
        <Field label={uk ? "Your name" : "Owner's name"} error={e.ownerName}>
          <Input name="ownerName" defaultValue={v.ownerName ?? ownerName} required />
        </Field>
      </div>

      {uk ? (
        <Choice name="kind" legend="What do you do?" value={kind} onChange={setKind} options={[
          { id: "sole_trader", label: "Sole trader", line: "You work for yourself" },
          { id: "landlord", label: "Landlord", line: "You let property" },
          { id: "both", label: "Both", line: "Self-employed and you let property" },
        ]} />
      ) : (
        <Choice name="kind" legend="How is the business set up?" value={kind} onChange={setKind} options={[
          { id: "sole_proprietor", label: "Sole proprietor", line: "You own it on your own" },
          { id: "partnership", label: "Partnership", line: "Two or more partners" },
        ]} />
      )}

      <Field label={uk ? "Unique Taxpayer Reference (UTR)" : "Taxpayer Identification Number (TIN)"} hint={uk ? "10 digits, on letters from HMRC. You can add it later." : "From the Inland Revenue Department. You can add it later."} error={e.taxId}>
        <Input name="taxId" defaultValue={v.taxId} inputMode="numeric" />
      </Field>

      <YesNo name="vatRegistered" legend="Are you registered for VAT?" value={vat} onChange={setVat}
        hint={uk ? "You must register once your turnover passes £90,000 in 12 months." : "You must register once your turnover passes the VAT threshold."} />
      {vat && (
        <Field label={uk ? "VAT number" : "VAT registration number"} error={e.vatNumber}>
          <Input name="vatNumber" defaultValue={v.vatNumber} required />
        </Field>
      )}

      {!uk && (
        <YesNo name="ssclRegistered" legend="Are you registered for SSCL?" value={sscl} onChange={setSscl}
          hint="The Social Security Contribution Levy (2.5%) shows as its own line on Tax Invoices." />
      )}

      {uk && (
        <>
          <Choice name="quarterType" legend="Which quarters do you use for Making Tax Digital?" value={quarters} onChange={setQuarters} options={[
            { id: "standard", label: "Standard", line: "6 April to 5 July, and so on" },
            { id: "calendar", label: "Calendar", line: "April to June, and so on" },
          ]} hint="Most people use standard. Your accountant can tell you." />
          <Choice name="basis" legend="How do you count income and costs?" value={basis} onChange={setBasis} options={[
            { id: "cash", label: "When money moves", line: "Cash basis: the usual for sole traders" },
            { id: "accrual", label: "When you invoice or are billed", line: "Accruals basis" },
          ]} />
        </>
      )}
      {!uk && <input type="hidden" name="basis" value="accrual" />}

      <Button disabled={pending} className="self-start">{pending ? "Setting up…" : "Set up my books"}</Button>
    </form>
  );
}
