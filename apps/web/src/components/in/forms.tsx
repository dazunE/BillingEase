"use client";

import type { Customer, Item, Line } from "@billingease/contracts";
import { formatMoney, rulesFor, type CountryCode, type Currency } from "@billingease/core";
import { useActionState, useState } from "react";
import { Button, Field, Input, Select, Textarea, cx } from "@/components/ui";
import type { FormState } from "@/lib/form";

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

function Alert({ state }: { state: FormState }) {
  if (!state?.message) return null;
  return <p role={state.ok ? "status" : "alert"} className={cx("rounded-xl px-4 py-3 text-sm font-semibold", state.ok ? "bg-pos-bg text-pos" : "bg-late-bg text-late")}>{state.message}</p>;
}

const decimal = (minor: number) => (minor / 100).toFixed(2);

/** Record money received: amount, date, how, and cheque details when it's a cheque. */
export function PaymentForm({ action, country, currency, open, today }: { action: Action; country: CountryCode; currency: Currency; open: number; today: string }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const rules = rulesFor(country);
  const v = state?.values ?? {};
  const e = state?.errors ?? {};
  const [method, setMethod] = useState(v.method ?? rules.receiveMethods[0]);
  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <Alert state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={`Amount (${currency === "GBP" ? "£" : "Rs"})`} hint={`${formatMoney(open, currency, { decimals: "always" })} left to pay`} error={e.amount}>
          <Input name="amount" inputMode="decimal" defaultValue={v.amount ?? decimal(open)} />
        </Field>
        <Field label="Received on" error={e.receivedOn}>
          <Input name="receivedOn" type="date" defaultValue={v.receivedOn ?? today} max={today} />
        </Field>
        <Field label="How they paid" error={e.method}>
          <Select name="method" value={method} onChange={(ev) => setMethod(ev.target.value)}>
            {rules.receiveMethods.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Reference" hint="Optional, e.g. what's on your bank statement" error={e.reference}>
          <Input name="reference" defaultValue={v.reference} />
        </Field>
      </div>
      {method === "Cheque" && (
        <div className="grid gap-3 rounded-2xl bg-bg p-3.5 sm:grid-cols-3">
          <Field label="Cheque number" hint={country === "lk" ? undefined : "Optional"} error={e.chequeNumber}>
            <Input name="chequeNumber" inputMode="numeric" defaultValue={v.chequeNumber} />
          </Field>
          <Field label="Cheque date" hint="As written on it" error={e.chequeDate}>
            <Input name="chequeDate" type="date" defaultValue={v.chequeDate} />
          </Field>
          <Field label="Bank" error={e.chequeBank}>
            <Input name="chequeBank" defaultValue={v.chequeBank} />
          </Field>
        </div>
      )}
      <Button disabled={pending} className="self-start">{pending ? "Recording…" : "Record payment"}</Button>
    </form>
  );
}

/** A credit note: the whole invoice, or some lines, some of the quantity or a lower price. */
export function CreditNoteForm({ action, lines, currency, open, hasEmail, today, issueDate }: { action: Action; lines: Line[]; currency: Currency; open: number; hasEmail: boolean; today: string; issueDate: string }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const v = state?.values ?? {};
  const e = state?.errors ?? {};
  const [scope, setScope] = useState(v.scope ?? "part");
  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <Alert state={state} />
      <p className="text-sm text-ink2">A credit note takes money off what {`they`} owe, up to the {formatMoney(open, currency, { decimals: "always" })} still to pay. Paying back money for a paid invoice goes in Going out.</p>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">What to credit</legend>
        {[{ id: "part", label: "Some lines" }, { id: "full", label: "The whole invoice" }].map((o) => (
          <label key={o.id} className={cx("flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold", scope === o.id ? "border-ink bg-tint" : "border-line")}>
            <input type="radio" name="scope" value={o.id} checked={scope === o.id} onChange={() => setScope(o.id)} className="accent-[#18161F]" />{o.label}
          </label>
        ))}
      </fieldset>
      {e.scope && <p className="text-sm font-semibold text-late">{e.scope}</p>}
      {scope === "part" && (
        <ul className="flex flex-col gap-2">
          {lines.map((l) => (
            <li key={l.id} className="flex flex-col gap-2 rounded-2xl bg-bg p-3">
              <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] font-semibold">
                <input type="checkbox" name={`pick_${l.id}`} defaultChecked={v[`pick_${l.id}`] === "on"} className="size-5 accent-[#18161F]" />
                {l.description} <span className="font-normal text-muted">· {formatMoney(l.total, currency, { decimals: "always" })}</span>
              </label>
              <div className="grid grid-cols-2 gap-3 pl-7">
                <Field label="Quantity" error={e[`qty_${l.id}`]}>
                  <Input name={`qty_${l.id}`} inputMode="decimal" defaultValue={v[`qty_${l.id}`] ?? String(l.quantityMilli / 1000)} />
                </Field>
                <Field label="Price" hint="Lower it to credit part" error={e[`price_${l.id}`]}>
                  <Input name={`price_${l.id}`} inputMode="decimal" defaultValue={v[`price_${l.id}`] ?? decimal(l.unitPrice)} />
                </Field>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Reason" hint="Printed on the credit note" error={e.reason}>
          <Input name="reason" defaultValue={v.reason} placeholder="e.g. Two menu pages dropped" />
        </Field>
        <Field label="Date" error={e.issueDate}>
          <Input name="issueDate" type="date" defaultValue={v.issueDate ?? (today < issueDate ? issueDate : today)} />
        </Field>
      </div>
      {hasEmail && (
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" name="email" defaultChecked className="size-5 accent-[#18161F]" />Email it to them with the PDF
        </label>
      )}
      <Button disabled={pending} className="self-start">{pending ? "Issuing…" : "Issue credit note"}</Button>
    </form>
  );
}

/** Email a reminder, or (Sri Lanka) open WhatsApp with the message. */
export function ReminderForm({ action, whatsapp, hasEmail, defaultMessage, compact = false }: { action: Action; whatsapp: boolean; hasEmail: boolean; defaultMessage: string; compact?: boolean }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const wa = state?.values?.whatsappUrl;
  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      <Alert state={state} />
      {!compact && (
        <Field label="Message" hint="Leave it as it is, or make it personal">
          <Textarea name="message" defaultValue={state?.values?.message ?? defaultMessage} className="min-h-40" />
        </Field>
      )}
      <div className="flex flex-wrap items-center gap-2.5">
        {hasEmail && <Button disabled={pending} name="channel" value="email" variant={compact ? "secondary" : "primary"}>{pending ? "Sending…" : "Email a reminder"}</Button>}
        {whatsapp && !wa && <Button disabled={pending} name="channel" value="whatsapp" variant="secondary">WhatsApp reminder</Button>}
        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-[#dff5e3] px-5 text-[15px] font-semibold text-[#1b5e2c]">Open WhatsApp</a>}
        {!hasEmail && !whatsapp && <span className="text-sm text-muted">Add an email address for this customer to send reminders.</span>}
      </div>
    </form>
  );
}

export function CustomerForm({ action, country, customer, submit = "Save", invoiceAfter = false }: { action: Action; country: CountryCode; customer?: Customer; submit?: string; invoiceAfter?: boolean }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const rules = rulesFor(country);
  const v = state?.values ?? {};
  const e = state?.errors ?? {};
  const val = (k: keyof Customer) => v[k] ?? (customer?.[k] as string | null | undefined) ?? "";
  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <Alert state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Customer name" hint="A business or a person" error={e.name}><Input name="name" defaultValue={val("name")} autoComplete="organization" /></Field>
        <Field label="Contact" hint="Optional" error={e.contactName}><Input name="contactName" defaultValue={val("contactName")} autoComplete="name" /></Field>
        <Field label="Email for invoices" error={e.email}><Input name="email" type="email" defaultValue={val("email")} autoComplete="email" /></Field>
        <Field label="Phone" hint={country === "lk" ? "For WhatsApp reminders" : "Optional"} error={e.phone}><Input name="phone" type="tel" defaultValue={val("phone")} autoComplete="tel" /></Field>
        <Field label="Address" hint="Printed on invoices" error={e.address} className="sm:col-span-2"><Textarea name="address" defaultValue={val("address")} className="min-h-20" /></Field>
        {country === "lk" && (
          <Field label={`${rules.wording.taxIdLabel}`} hint="Taxpayer Identification Number, printed on Tax Invoices" error={e.taxId}><Input name="taxId" defaultValue={val("taxId")} inputMode="numeric" /></Field>
        )}
        <Field label={country === "lk" ? "VAT registration number" : "VAT number"} hint={country === "lk" ? "If they're VAT registered" : "Optional, if they're VAT registered"} error={e.vatNumber}><Input name="vatNumber" defaultValue={val("vatNumber")} /></Field>
        <Field label="Notes" hint="Only your team sees these" error={e.notes} className="sm:col-span-2"><Textarea name="notes" defaultValue={val("notes")} className="min-h-20" /></Field>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button disabled={pending}>{pending ? "Saving…" : submit}</Button>
        {invoiceAfter && <Button disabled={pending} variant="secondary" name="then" value="invoice">Add and bill them</Button>}
      </div>
    </form>
  );
}

export function ItemForm({ action, country, vatRegistered, ssclRegistered, item, submit = "Save" }: { action: Action; country: CountryCode; vatRegistered: boolean; ssclRegistered: boolean; item?: Item; submit?: string }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const rules = rulesFor(country);
  const v = state?.values ?? {};
  const e = state?.errors ?? {};
  const key = state?.ok && !item ? state.message : "form";
  return (
    <form key={key} action={formAction} noValidate className="flex flex-col gap-4">
      <Alert state={state} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name" error={e.name} className="lg:col-span-2"><Input name="name" defaultValue={v.name ?? item?.name} /></Field>
        <Field label={`Price (${country === "uk" ? "£" : "Rs"})`} hint="Before tax" error={e.unitPrice}><Input name="unitPrice" inputMode="decimal" defaultValue={v.unitPrice ?? (item ? decimal(item.unitPrice) : "")} /></Field>
        <Field label="Per" hint="e.g. hour, day, sign" error={e.unit}><Input name="unit" defaultValue={v.unit ?? item?.unit ?? ""} /></Field>
        <Field label="Description" hint="Optional" error={e.description} className="sm:col-span-2"><Input name="description" defaultValue={v.description ?? item?.description ?? ""} /></Field>
        {vatRegistered && (
          <Field label="VAT rate" error={e.vatRateId}>
            <Select name="vatRateId" defaultValue={v.vatRateId ?? item?.vatRateId ?? rules.defaultVatRateId}>
              {rules.vatRates.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </Select>
          </Field>
        )}
        {country === "lk" && ssclRegistered && (
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 self-end text-sm font-semibold">
            <input type="checkbox" name="sscl" defaultChecked={v.sscl ? v.sscl === "on" : (item?.sscl ?? true)} className="size-5 accent-[#18161F]" />SSCL applies ({rules.ssclBps / 100}%)
          </label>
        )}
      </div>
      <Button disabled={pending} className="self-start">{pending ? "Saving…" : submit}</Button>
    </form>
  );
}
