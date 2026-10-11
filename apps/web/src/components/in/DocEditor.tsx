"use client";

import type { Item } from "@billingease/contracts";
import { addDays, computeInvoice, formatDate, formatMoney, invoiceTitle, parseMoney, rulesFor, type CountryCode, type Currency } from "@billingease/core";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Button, Field, ICONS, Icon, Input, Select, Textarea, cx } from "@/components/ui";
import type { FormState } from "@/lib/form";
import { DocPreview, type PreviewData } from "./DocPreview";

export type EditorBusiness = {
  country: CountryCode; currency: Currency; name: string; vatRegistered: boolean; ssclRegistered: boolean; termsDays: number;
  address: string; email: string | null; phone: string | null; taxId: string | null; vatNumber: string | null; paymentDetails: string | null; invoiceNote: string | null;
};
export type EditorCustomer = { id: string; name: string; email: string | null; address: string | null; taxId: string | null; vatNumber: string | null };
export type LineState = { key: string; itemId: string | null; description: string; qty: string; price: string; discount: string; vatRateId: string | null; sscl: boolean };
export type EditorInitial = {
  id?: string;
  customerId?: string;
  issueDate: string;
  supplyDate?: string | null;
  dueDate?: string | null;
  termsDays: number;
  expiryDate?: string | null;
  notes?: string | null;
  reference?: string | null;
  lines: LineState[];
  name?: string;
  frequency?: "weekly" | "monthly" | "quarterly" | "yearly";
  nextRun?: string;
  endDate?: string | null;
  recurMode?: "draft" | "send";
};

/** The editor's state, sent to the server action as JSON. */
export type EditorPayload = {
  id?: string;
  customerId: string;
  newCustomer: { name: string; email: string; taxId: string; vatNumber: string } | null;
  issueDate: string;
  supplyDate: string;
  dueDate: string;
  expiryDate: string;
  notes: string;
  reference: string;
  termsDays: number;
  lines: LineState[];
  name: string;
  frequency: string;
  nextRun: string;
  endDate: string;
  recurMode: string;
};

let k = 0;
const key = () => `l${Date.now().toString(36)}${k++}`;
const decimal = (minor: number) => (minor / 100).toFixed(2);

export function lineFromItem(i: Item): LineState {
  return { key: key(), itemId: i.id, description: i.name, qty: "1", price: decimal(i.unitPrice), discount: "", vatRateId: i.vatRateId, sscl: i.sscl };
}
export function blankLine(defaultVat: string | null): LineState {
  return { key: key(), itemId: null, description: "", qty: "1", price: "", discount: "", vatRateId: defaultVat, sscl: true };
}
export function lineFromStored(l: { itemId?: string | null; description: string; quantityMilli: number; unitPrice: number; discount?: number; vatRateId?: string | null; sscl?: boolean }): LineState {
  return { key: key(), itemId: l.itemId ?? null, description: l.description, qty: String(l.quantityMilli / 1000), price: decimal(l.unitPrice), discount: l.discount ? decimal(l.discount) : "", vatRateId: l.vatRateId ?? null, sscl: l.sscl !== false };
}

export function qtyMilli(s: string) {
  const n = Number(s.replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n * 1000) : 0;
}

const TERMS = [0, 7, 14, 30, 60];

export function DocEditor({ mode, business: b, customers, items, number, initial, action, cancelHref, today }: {
  mode: "invoice" | "quote" | "repeating";
  business: EditorBusiness;
  customers: EditorCustomer[];
  items: Item[];
  number: string;
  initial: EditorInitial;
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  cancelHref: string;
  today: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const rules = rulesFor(b.country);
  const lk = b.country === "lk";
  const sscl = lk && b.ssclRegistered;
  const e = state?.errors ?? {};
  const [customerId, setCustomerId] = useState(initial.customerId ?? (customers.length ? "" : "__new"));
  const [nc, setNc] = useState({ name: "", email: "", taxId: "", vatNumber: "" });
  const [issueDate, setIssueDate] = useState(initial.issueDate);
  const [supplyDate, setSupplyDate] = useState(initial.supplyDate ?? "");
  const initialTerms = initial.dueDate ? (TERMS.find((t) => addDays(initial.issueDate, t) === initial.dueDate) ?? -1) : initial.termsDays;
  const [terms, setTerms] = useState<number>(TERMS.includes(initialTerms) ? initialTerms : -1);
  const [customDue, setCustomDue] = useState(initial.dueDate ?? addDays(initial.issueDate, initial.termsDays));
  const [expiryDate, setExpiryDate] = useState(initial.expiryDate ?? addDays(initial.issueDate, 30));
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [reference, setReference] = useState(initial.reference ?? "");
  const [lines, setLines] = useState<LineState[]>(initial.lines.length ? initial.lines : [blankLine(b.vatRegistered ? rules.defaultVatRateId : null)]);
  const [name, setName] = useState(initial.name ?? "");
  const [frequency, setFrequency] = useState(initial.frequency ?? "monthly");
  const [nextRun, setNextRun] = useState(initial.nextRun ?? today);
  const [endDate, setEndDate] = useState(initial.endDate ?? "");
  const [recurMode, setRecurMode] = useState(initial.recurMode ?? "draft");
  const id = state?.values?.id ?? initial.id;

  const dueDate = terms >= 0 ? addDays(mode === "repeating" ? nextRun : issueDate, terms) : customDue;
  const termsDays = terms >= 0 ? terms : Math.max(0, Math.round((Date.parse(customDue) - Date.parse(mode === "repeating" ? nextRun : issueDate)) / 86400000)) || 0;
  const customer = customers.find((c) => c.id === customerId) ?? null;
  const fmt = (minor: number) => formatMoney(minor, b.currency, { decimals: "always" });

  // Live totals, worked out the same way the API stores them.
  const calc = useMemo(() => {
    const parsed = lines.map((l) => {
      const quantityMilli = qtyMilli(l.qty);
      const unitPrice = parseMoney(l.price) ?? 0;
      const gross = Math.round((quantityMilli * unitPrice) / 1000);
      const discount = Math.min(parseMoney(l.discount) ?? 0, gross);
      return { quantityMilli: quantityMilli || 1000, unitPrice, discount, vatRateId: l.vatRateId, sscl: l.sscl };
    });
    try {
      return { parsed, totals: computeInvoice(parsed, { country: b.country, vatRegistered: b.vatRegistered, ssclRegistered: sscl }) };
    } catch {
      return { parsed, totals: computeInvoice(parsed.map((p) => ({ ...p, vatRateId: null })), { country: b.country, vatRegistered: b.vatRegistered, ssclRegistered: sscl }) };
    }
  }, [lines, b.country, b.vatRegistered, sscl]);
  const t = calc.totals;

  const update = (i: number, patch: Partial<LineState>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const remove = (i: number) => setLines((ls) => ls.filter((_, j) => j !== i));

  const payload: EditorPayload = {
    id, customerId, newCustomer: customerId === "__new" ? nc : null, issueDate, supplyDate, dueDate, expiryDate, notes, reference, termsDays, lines,
    name, frequency, nextRun, endDate, recurMode,
  };

  const title = mode === "quote" ? "Quote" : invoiceTitle(b.country, b.vatRegistered);
  const buyer = customer ?? (customerId === "__new" && nc.name ? { name: nc.name, email: nc.email || null, address: null, taxId: nc.taxId || null, vatNumber: nc.vatNumber || null } : null);
  const preview: PreviewData = {
    kind: mode === "quote" ? "quote" : "invoice", country: b.country, currency: b.currency, title, number: mode === "repeating" ? null : number, status: "draft",
    seller: { name: b.name, address: b.address, email: b.email, phone: b.phone, taxId: lk ? b.taxId : null, vatNumber: b.vatRegistered ? b.vatNumber : null },
    buyer,
    dates: mode === "quote"
      ? [["Quote date", formatDate(issueDate, { year: true })], ["Valid until", formatDate(expiryDate, { year: true })]]
      : [
          ["Invoice date", formatDate(mode === "repeating" ? nextRun : issueDate, { year: true })],
          ...(lk ? [["Date of delivery", formatDate(supplyDate || (mode === "repeating" ? nextRun : issueDate), { year: true })] as [string, string]] : supplyDate && supplyDate !== issueDate ? [["Date of supply", formatDate(supplyDate, { year: true })] as [string, string]] : []),
          ["Due date", formatDate(dueDate, { year: true })],
        ],
    vatRegistered: b.vatRegistered,
    lines: lines.map((l, i) => ({ description: l.description, quantityMilli: calc.parsed[i].quantityMilli, unitPrice: calc.parsed[i].unitPrice, discount: calc.parsed[i].discount, vatRateId: t.lines[i]?.vatRateId ?? null, net: t.lines[i]?.net ?? 0, vat: t.lines[i]?.vat ?? 0, sscl: t.lines[i]?.sscl ?? 0 })),
    net: t.net, vat: t.vat, sscl: t.sscl, total: t.total, paid: 0, credited: 0,
    paymentDetails: b.paymentDetails, note: mode === "quote" ? null : b.invoiceNote, notes: notes || null,
    modeOfPayment: rules.receiveMethods.join(", "),
  };

  const explain = b.vatRegistered
    ? lk
      ? `You're VAT${sscl ? " and SSCL" : ""} registered, so this is a Tax Invoice: your TIN and VAT registration number, the purchaser's,${sscl ? ` SSCL ${rules.ssclBps / 100}% on its own line, then VAT on the value plus SSCL.` : " and VAT."}`
      : "You're VAT registered, so this is a VAT invoice: your VAT number, the VAT rate and VAT on each line, and a VAT summary."
    : lk
      ? sscl ? "You're SSCL registered but not VAT registered: SSCL shows as its own line, with no VAT." : "You're not VAT registered, so no VAT or SSCL is added."
      : "You're not VAT registered, so no VAT is added. Change it in your business profile if you register.";

  return (
    <form action={formAction} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      <div className="flex min-w-0 flex-col gap-5">
        {state?.message && <p role="alert" className="rounded-xl bg-late-bg px-4 py-3 text-sm font-semibold text-late">{state.message}</p>}

        <Section title={mode === "repeating" ? "Who and how often" : "Who and when"}>
          {mode === "repeating" && (
            <Field label="Name" hint="For you, e.g. Social media retainer" error={e.name}>
              <Input value={name} onChange={(ev) => setName(ev.target.value)} />
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer" error={e.customerId}>
              <Select value={customerId} onChange={(ev) => setCustomerId(ev.target.value)}>
                <option value="">Choose a customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="__new">+ Add a new customer</option>
              </Select>
            </Field>
            {mode === "quote" ? (
              <Field label="Valid until" error={e.expiryDate}>
                <Input type="date" value={expiryDate} onChange={(ev) => setExpiryDate(ev.target.value)} />
              </Field>
            ) : (
              <Field label="Payment terms" hint={`Due ${formatDate(dueDate, { year: true })}`} error={e.dueDate ?? e.termsDays}>
                <Select value={terms} onChange={(ev) => setTerms(Number(ev.target.value))}>
                  {TERMS.map((d) => <option key={d} value={d}>{d === 0 ? "On receipt" : `Within ${d} days`}{d === b.termsDays ? " (your usual)" : ""}</option>)}
                  {mode !== "repeating" && <option value={-1}>Pick a date</option>}
                </Select>
              </Field>
            )}
          </div>
          {customerId === "__new" && (
            <div className="grid gap-3 rounded-2xl bg-bg p-4 sm:grid-cols-2">
              <Field label="New customer's name" error={e["newCustomer.name"] ?? e.name}>
                <Input value={nc.name} onChange={(ev) => setNc({ ...nc, name: ev.target.value })} autoComplete="organization" />
              </Field>
              <Field label="Email for invoices" hint="To email it with the PDF" error={e["newCustomer.email"]}>
                <Input type="email" value={nc.email} onChange={(ev) => setNc({ ...nc, email: ev.target.value })} />
              </Field>
              {lk && (
                <Field label="Their TIN" hint="Optional" error={e["newCustomer.taxId"]}>
                  <Input value={nc.taxId} onChange={(ev) => setNc({ ...nc, taxId: ev.target.value })} inputMode="numeric" />
                </Field>
              )}
              <Field label={lk ? "Their VAT registration number" : "Their VAT number"} hint="Optional" error={e["newCustomer.vatNumber"]}>
                <Input value={nc.vatNumber} onChange={(ev) => setNc({ ...nc, vatNumber: ev.target.value })} />
              </Field>
            </div>
          )}
          {customer && !customer.email && mode !== "repeating" && (
            <p className="text-sm text-ink2">{customer.name} has no email address, so you can save it and mark it sent, or <Link className="font-semibold underline" href={`/app/in/customers/${customer.id}#details`}>add their email</Link>.</p>
          )}
          {e.email && <p className="text-sm font-semibold text-late">{e.email}</p>}
          {mode === "repeating" ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="How often" error={e.frequency}>
                <Select value={frequency} onChange={(ev) => setFrequency(ev.target.value as typeof frequency)}>
                  <option value="weekly">Every week</option>
                  <option value="monthly">Every month</option>
                  <option value="quarterly">Every 3 months</option>
                  <option value="yearly">Every year</option>
                </Select>
              </Field>
              <Field label="Next invoice on" error={e.nextRun}>
                <Input type="date" value={nextRun} onChange={(ev) => setNextRun(ev.target.value)} />
              </Field>
              <Field label="Stop after" hint="Optional" error={e.endDate}>
                <Input type="date" value={endDate} onChange={(ev) => setEndDate(ev.target.value)} />
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={mode === "quote" ? "Quote date" : "Invoice date"} error={e.issueDate}>
                <Input type="date" value={issueDate} onChange={(ev) => setIssueDate(ev.target.value)} />
              </Field>
              {mode === "invoice" && (
                <Field label={lk ? "Date of delivery" : "Date of supply"} hint={lk ? "Printed on the Tax Invoice" : "If different from the invoice date"} error={e.supplyDate}>
                  <Input type="date" value={supplyDate} onChange={(ev) => setSupplyDate(ev.target.value)} />
                </Field>
              )}
              {mode === "invoice" && terms < 0 && (
                <Field label="Due date" error={e.dueDate}>
                  <Input type="date" value={customDue} onChange={(ev) => setCustomDue(ev.target.value)} />
                </Field>
              )}
            </div>
          )}
          <p className="flex gap-2.5 rounded-2xl bg-bg px-4 py-3 text-sm text-ink2"><Icon d={ICONS.doc} size={18} className="mt-0.5 shrink-0" />{explain}</p>
        </Section>

        <Section title="What you're billing for">
          {e.lines && <p className="text-sm font-semibold text-late">{e.lines}</p>}
          <ul className="flex flex-col gap-3">
            {lines.map((l, i) => {
              const tl = t.lines[i];
              const err = (f: string) => e[`lines.${i}.${f}`];
              return (
                <li key={l.key} className="flex flex-col gap-3 rounded-2xl bg-bg p-3.5">
                  <div className="flex items-start gap-2">
                    <Field label={`Line ${i + 1}`} error={err("description")} className="flex-1">
                      <Input value={l.description} onChange={(ev) => update(i, { description: ev.target.value })} placeholder="What it's for" />
                    </Field>
                    <button type="button" onClick={() => remove(i)} aria-label={`Remove line ${i + 1}`} className="mt-7 flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-ink2 hover:text-late">
                      <Icon d="M6 6l12 12M18 6 6 18" size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Field label={`Quantity${items.find((x) => x.id === l.itemId)?.unit ? ` (${items.find((x) => x.id === l.itemId)!.unit})` : ""}`} error={err("quantityMilli")}>
                      <Input inputMode="decimal" value={l.qty} onChange={(ev) => update(i, { qty: ev.target.value })} />
                    </Field>
                    <Field label={`Price (${b.currency === "GBP" ? "£" : "Rs"})`} error={err("unitPrice")}>
                      <Input inputMode="decimal" value={l.price} onChange={(ev) => update(i, { price: ev.target.value })} placeholder="0.00" />
                    </Field>
                    <Field label="Discount" hint="Optional" error={err("discount")}>
                      <Input inputMode="decimal" value={l.discount} onChange={(ev) => update(i, { discount: ev.target.value })} placeholder="0.00" />
                    </Field>
                    {b.vatRegistered && (
                      <Field label="VAT rate" error={err("vatRateId")}>
                        <Select value={l.vatRateId ?? rules.defaultVatRateId} onChange={(ev) => update(i, { vatRateId: ev.target.value })}>
                          {rules.vatRates.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </Select>
                      </Field>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {sscl ? (
                      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
                        <input type="checkbox" checked={l.sscl} onChange={(ev) => update(i, { sscl: ev.target.checked })} className="size-5 accent-[#18161F]" />
                        SSCL applies <span className="font-normal text-muted">({rules.ssclBps / 100}%)</span>
                      </label>
                    ) : <span />}
                    <span className="tabular text-right text-sm">
                      {(tl?.sscl ?? 0) > 0 && <span className="text-muted">SSCL {fmt(tl!.sscl)} · </span>}
                      {(tl?.vat ?? 0) > 0 && <span className="text-muted">VAT {fmt(tl!.vat)} · </span>}
                      <strong className="text-[15px]">{fmt(tl?.net ?? 0)}</strong>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            {items.length > 0 && (
              <Select aria-label="Add from products and services" value="" className="w-auto min-w-[240px] flex-1 sm:flex-none"
                onChange={(ev) => { const it = items.find((x) => x.id === ev.target.value); if (it) setLines((ls) => [...ls.filter((x) => x.description || x.price), lineFromItem(it)]); }}>
                <option value="">+ Add from products and services</option>
                {items.map((it) => <option key={it.id} value={it.id}>{it.name} · {formatMoney(it.unitPrice, b.currency)}{it.unit ? ` per ${it.unit}` : ""}</option>)}
              </Select>
            )}
            <button type="button" onClick={() => setLines((ls) => [...ls, blankLine(b.vatRegistered ? rules.defaultVatRateId : null)])} className="flex min-h-11 items-center gap-1.5 font-semibold underline underline-offset-4">
              <Icon d={ICONS.plus} size={16} /> Type your own line
            </button>
          </div>
          <dl className="ml-auto flex w-full max-w-[340px] flex-col gap-1 border-t border-line pt-3 text-[15px]">
            {(t.vat > 0 || t.sscl > 0) && <div className="flex justify-between text-ink2"><dt>{lk ? "Value of supply" : "Total excluding VAT"}</dt><dd className="tabular">{fmt(t.net)}</dd></div>}
            {t.sscl > 0 && <div className="flex justify-between text-ink2"><dt>SSCL</dt><dd className="tabular">{fmt(t.sscl)}</dd></div>}
            {b.vatRegistered && <div className="flex justify-between text-ink2"><dt>VAT</dt><dd className="tabular">{fmt(t.vat)}</dd></div>}
            <div className="flex justify-between font-bold"><dt>Total</dt><dd className="tabular" data-testid="editor-total">{fmt(t.total)}</dd></div>
          </dl>
        </Section>

        <Section title="Notes">
          <Field label={mode === "quote" ? "Note on the quote" : "Note on the invoice"} hint="Printed for your customer" error={e.notes}>
            <Textarea value={notes} onChange={(ev) => setNotes(ev.target.value)} />
          </Field>
          {mode !== "quote" && (
            <Field label="Their reference or PO number" hint="Optional" error={e.reference}>
              <Input value={reference} onChange={(ev) => setReference(ev.target.value)} />
            </Field>
          )}
          {mode === "repeating" && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-[13px] font-semibold">Each time it runs</legend>
              {[
                { id: "draft", label: "Make a draft for me to check", line: "You get a notification, check it and send it" },
                { id: "send", label: "Send it on the day", line: "Issued and emailed with the PDF" },
              ].map((o) => (
                <label key={o.id} className={cx("flex cursor-pointer flex-col gap-0.5 rounded-2xl border p-3.5", recurMode === o.id ? "border-ink bg-tint" : "border-line bg-white")}>
                  <span className="flex items-center gap-2 text-[15px] font-semibold">
                    <input type="radio" name="recurModeRadio" checked={recurMode === o.id} onChange={() => setRecurMode(o.id as "draft" | "send")} className="accent-[#18161F]" />{o.label}
                  </span>
                  <span className="pl-6 text-[13px] text-muted">{o.line}</span>
                </label>
              ))}
            </fieldset>
          )}
          {mode !== "quote" && (
            <p className="text-sm text-ink2">How to pay is printed from your business profile{b.paymentDetails ? `: “${b.paymentDetails}”` : ". Add your bank details there."} <Link href="/app/settings/business" className="font-semibold underline">Change it</Link></p>
          )}
        </Section>

        <div className="flex flex-wrap items-center gap-3">
          {mode === "repeating" ? (
            <Button disabled={pending} name="intent" value="save">{pending ? "Saving…" : "Save repeating invoice"}</Button>
          ) : (
            <>
              <Button disabled={pending} name="intent" value="send"><Icon d={ICONS.send} size={18} />{mode === "quote" ? "Save and send" : `Save and send · ${fmt(t.total)}`}</Button>
              <Button disabled={pending} variant="secondary" name="intent" value="mark">Save and mark sent</Button>
              <Button disabled={pending} variant="secondary" name="intent" value="draft">Save draft</Button>
            </>
          )}
          <Link href={cancelHref} className="flex min-h-11 items-center font-semibold underline underline-offset-4">Cancel</Link>
        </div>
        {mode === "invoice" && <p className="text-sm text-muted">Sending emails it with the PDF and adds {fmt(t.total)} to Coming in as money on the way. Drafts don&apos;t count.</p>}
      </div>

      <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-6">
        <div className="rounded-3xl bg-surface p-3">
          <DocPreview d={preview} compact />
          <p className="pt-2 text-center text-xs text-muted">Live preview · this is the PDF your customer gets</p>
        </div>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(16px,3vw,28px)]">
      <h2 className="text-[20px] font-bold">{title}</h2>
      {children}
    </section>
  );
}
