"use client";

import type { Business } from "@billingease/contracts";
import { useActionState, useState } from "react";
import { Button, Field, Input, Select, Textarea, cx } from "@/components/ui";
import { saveProfile } from "./actions";

export type CountryText = {
  name: string;
  taxIdLabel: string;
  taxIdLong: string;
  taxIdHint: string;
  vatIdLabel: string;
  vatInvoiceTitle: string;
  vatHint: string;
  townLabel: string;
  regionLabel: string;
  postcodeLabel: string;
  facts: string;
};

const ACCENTS = [
  { value: "#7A5AF8", name: "Violet" },
  { value: "#18161F", name: "Graphite" },
  { value: "#1F5E91", name: "Blue" },
  { value: "#2F7D5B", name: "Green" },
  { value: "#C2410C", name: "Orange" },
  { value: "#A8200D", name: "Red" },
];

function Seg({ name, legend, hint, value, onChange, options }: { name: string; legend: string; hint?: string; value: string; onChange: (v: string) => void; options: { id: string; label: string }[] }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-[13px] font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-1 self-start rounded-[22px] bg-surface p-1">
        {options.map((o) => (
          <label key={o.id} className={cx("flex min-h-10 cursor-pointer items-center rounded-full px-4 text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-coming", value === o.id ? "bg-ink text-white" : "text-ink")}>
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </fieldset>
  );
}

function Section({ id, title, sub, children }: { id: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="font-display text-xl font-bold tracking-[-0.02em]">{title}</h2>
        <span className="text-[13px] text-muted">{sub}</span>
      </div>
      {children}
    </section>
  );
}

export function ProfileForm({ b, text, canEdit }: { b: Business; text: CountryText; canEdit: boolean }) {
  const [state, action, pending] = useActionState(saveProfile, undefined);
  const v = state?.values;
  const e = state?.errors ?? {};
  const uk = b.country === "uk";
  const us = b.country === "us";
  const val = (k: keyof Business) => (v ? v[k] ?? "" : (b[k] as string | null) ?? "");
  const [kind, setKind] = useState<string>(v?.kind ?? b.kind);
  const [vat, setVat] = useState(v ? v.vatRegistered === "on" : b.vatRegistered);
  const [sscl, setSscl] = useState(v ? v.ssclRegistered === "on" : b.ssclRegistered);
  const [basis, setBasis] = useState<string>(v?.basis ?? b.basis);
  const [quarters, setQuarters] = useState<string>(v?.quarterType ?? b.quarterType);
  const [accent, setAccent] = useState<string>(v?.accent ?? b.accent);
  const [prefix, setPrefix] = useState<string>(v?.invoicePrefix ?? b.invoicePrefix);

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="country" value={b.country} />
      {state?.message && (
        <p role={state.ok ? "status" : "alert"} className={cx("rounded-xl px-4 py-3 text-sm font-semibold", state.ok ? "bg-pos-bg text-pos" : "bg-late-bg text-late")}>{state.message}</p>
      )}
      <fieldset disabled={!canEdit || pending} className="flex flex-col gap-6">
        <Section id="who-h" title="Who you are" sub="Shown at the top of every invoice and quote you send.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name" hint="What customers know you as" error={e.name}><Input name="name" defaultValue={val("name")} /></Field>
            <Field label="Legal name" hint={uk ? "If different, for example your own name as a sole trader" : us ? "As registered with the state, for example Harbor Lane LLC" : "As registered, if different"} error={e.legalName}><Input name="legalName" defaultValue={val("legalName")} /></Field>
            <Field label="Owner" error={e.ownerName}><Input name="ownerName" defaultValue={val("ownerName")} /></Field>
            <Field label="Email" hint="Customers reply here" error={e.email}><Input name="email" type="email" defaultValue={val("email")} /></Field>
            <Field label="Phone" error={e.phone}><Input name="phone" type="tel" defaultValue={val("phone")} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Address" error={e.addressLine1}><Input name="addressLine1" defaultValue={val("addressLine1")} autoComplete="address-line1" /></Field>
            <Field label="Address line 2 (optional)" error={e.addressLine2}><Input name="addressLine2" defaultValue={val("addressLine2")} autoComplete="address-line2" /></Field>
            <Field label={text.townLabel} error={e.town}><Input name="town" defaultValue={val("town")} /></Field>
            <Field label={`${text.regionLabel} (optional)`} error={e.region}><Input name="region" defaultValue={val("region")} /></Field>
            <Field label={text.postcodeLabel} error={e.postcode}><Input name="postcode" defaultValue={val("postcode")} /></Field>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface px-4 py-3">
            <span className="flex flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-bold">Country: {text.name}<span className="rounded-full bg-ink px-2 py-0.5 text-[11px] text-white">Fixed</span></span>
              <span className="text-xs text-muted">Set at sign-up; a business in another country is a new account. {text.facts}</span>
            </span>
          </div>
        </Section>

        <Section id="tax-h" title="Tax and registration" sub={uk ? "How HMRC knows you. Your accountant can check these." : us ? "How the IRS knows you. Your accountant can check these." : "How the Inland Revenue Department knows you. Your tax practitioner can check these."}>
          <Seg name="kind" legend="What kind of business is it?" value={kind} onChange={setKind} options={uk
            ? [{ id: "sole_trader", label: "Sole trader" }, { id: "landlord", label: "Landlord" }, { id: "both", label: "Both" }]
            : us
            ? [{ id: "sole_proprietor", label: "Single-member LLC" }, { id: "partnership", label: "Multi-member LLC" }]
            : [{ id: "sole_proprietor", label: "Sole proprietor" }, { id: "partnership", label: "Partnership" }]} />
          {e.kind && <span className="text-xs font-semibold text-late">{e.kind}</span>}
          <Field label={`${text.taxIdLabel} · ${text.taxIdLong}`} hint={text.taxIdHint} error={e.taxId} className="sm:max-w-sm">
            <Input name="taxId" defaultValue={val("taxId")} inputMode="numeric" />
          </Field>
          {uk && (
            <Seg name="basis" legend="How you count income · accounting basis" value={basis} onChange={setBasis}
              hint={basis === "cash" ? "Cash basis: income and costs count when money moves. The usual for sole traders." : "Accruals basis: they count when you invoice or are billed."}
              options={[{ id: "cash", label: "When money moves" }, { id: "accrual", label: "When invoiced or billed" }]} />
          )}
          {!us && <Seg name="vatRegistered" legend="Registered for VAT?" hint={text.vatHint} value={vat ? "on" : "off"} onChange={(x) => setVat(x === "on")} options={[{ id: "on", label: "Yes" }, { id: "off", label: "No" }]} />}
          {vat && (
            <Field label={text.vatIdLabel} hint={`Printed on every ${text.vatInvoiceTitle}.`} error={e.vatNumber} className="sm:max-w-sm">
              <Input name="vatNumber" defaultValue={val("vatNumber")} />
            </Field>
          )}
          {b.country === "lk" && (
            <Seg name="ssclRegistered" legend="Registered for SSCL?" hint="The Social Security Contribution Levy shows as its own line on Tax Invoices."
              value={sscl ? "on" : "off"} onChange={(x) => setSscl(x === "on")} options={[{ id: "on", label: "Yes" }, { id: "off", label: "No" }]} />
          )}
          {uk && (
            <Seg name="quarterType" legend="Your quarters · MTD update periods" value={quarters} onChange={setQuarters}
              hint="Most people use standard. Your accountant can tell you."
              options={[{ id: "standard", label: "6 Apr – 5 Jul, …" }, { id: "calendar", label: "Apr – Jun, …" }]} />
          )}
        </Section>

        <Section id="inv-h" title="Invoices" sub="Defaults for every new invoice and quote. You can still change them on each one.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Invoice numbers start with" hint={`Next one: ${prefix}${String(1).padStart(4, "0")}`} error={e.invoicePrefix}>
              <Input name="invoicePrefix" value={prefix} onChange={(ev) => setPrefix(ev.target.value)} />
            </Field>
            <Field label="Payment terms" error={e.termsDays}>
              <Select name="termsDays" defaultValue={String(v?.termsDays ?? b.termsDays)}>
                {[0, 7, 14, 30, 45, 60].concat([0, 7, 14, 30, 45, 60].includes(b.termsDays) ? [] : [b.termsDays]).map((d) => (
                  <option key={d} value={d}>{d === 0 ? "Due on receipt" : `${d} days`}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Payment details printed on invoices" hint={uk ? "Account name, sort code and account number" : us ? "Bank, account name, routing and account number" : "Bank, branch, account name and number"} error={e.paymentDetails}>
            <Textarea name="paymentDetails" defaultValue={val("paymentDetails")} rows={3} />
          </Field>
          <Field label="Note on every invoice (optional)" hint="For example: thank you for your business" error={e.invoiceNote}>
            <Textarea name="invoiceNote" defaultValue={val("invoiceNote")} rows={2} />
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-[13px] font-semibold">Accent colour</legend>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <label key={a.value} title={a.name} className={cx("flex size-11 cursor-pointer items-center justify-center rounded-full border-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-coming", accent.toUpperCase() === a.value ? "border-ink" : "border-transparent")}>
                  <input type="radio" name="accent" value={a.value} checked={accent.toUpperCase() === a.value} onChange={() => setAccent(a.value)} className="sr-only" aria-label={a.name} />
                  <span className="size-8 rounded-full" style={{ background: a.value }} />
                </label>
              ))}
              {!ACCENTS.some((a) => a.value === accent.toUpperCase()) && <input type="hidden" name="accent" value={accent} />}
            </div>
            <span className="text-xs text-muted">Used on invoices, quotes and emails. The app keeps its own colours.</span>
          </fieldset>
        </Section>
      </fieldset>
      {canEdit
        ? <Button disabled={pending} className="self-start">{pending ? "Saving…" : "Save changes"}</Button>
        : <p className="text-sm text-muted">Only the owner can change these details.</p>}
    </form>
  );
}
