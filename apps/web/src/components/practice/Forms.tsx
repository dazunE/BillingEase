"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addPropertyEntry, askFor, logTrip, saveProperty, sendMessage } from "@/app/app/accountant/actions";
import { Button, Field, Input, Select, Textarea, cx } from "@/components/ui";
import type { FormState } from "@/lib/form";

function useReset(state: FormState) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return ref;
}

function Status({ state }: { state: FormState }) {
  if (!state?.message) return null;
  return <span role={state.ok ? "status" : "alert"} className={cx("text-sm font-semibold", state.ok ? "text-pos" : "text-late")}>{state.message}</span>;
}

export function PropertyForm({ property, onDone }: { property?: { id: string; name: string; address: string | null; sharePct: number; monthlyRent: number; rentDay: number | null; agent: string | null }; onDone?: () => void }) {
  const [state, action, pending] = useActionState(saveProperty, undefined);
  const ref = useReset(property ? undefined : state);
  const e = state?.errors ?? {};
  useEffect(() => { if (state?.ok) onDone?.(); }, [state, onDone]);
  return (
    <form ref={ref} action={action} className="flex flex-col gap-4">
      {property && <input type="hidden" name="id" value={property.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" hint="How you'd say it, like Flat 2, 18 Ash Grove" error={e.name}><Input name="name" defaultValue={property?.name} required /></Field>
        <Field label="Address"><Input name="address" defaultValue={property?.address ?? ""} /></Field>
        <Field label="Rent a month (£)"><Input name="monthlyRent" inputMode="decimal" defaultValue={property ? (property.monthlyRent / 100).toFixed(2) : ""} /></Field>
        <Field label="Rent due on day" hint="Of each month"><Input name="rentDay" type="number" min={1} max={31} defaultValue={property?.rentDay ?? ""} /></Field>
        <Field label="Letting agent"><Input name="agent" defaultValue={property?.agent ?? ""} /></Field>
        <Field label="Your share (%)" hint="Owned jointly? Your share of rent and costs" error={e.sharePct}><Input name="sharePct" type="number" min={1} max={100} defaultValue={property?.sharePct ?? 100} /></Field>
      </div>
      <div className="flex flex-wrap items-center gap-3"><Button disabled={pending}>{pending ? "Saving…" : property ? "Save" : "Add the property"}</Button><Status state={state} /></div>
    </form>
  );
}

export function PropertyEntryForm({ properties, categories, today }: { properties: { id: string; name: string }[]; categories: { id: string; name: string; official: string }[]; today: string }) {
  const [state, action, pending] = useActionState(addPropertyEntry, undefined);
  const ref = useReset(state);
  const [kind, setKind] = useState<"rent" | "cost">("rent");
  const e = state?.errors ?? {};
  return (
    <form ref={ref} action={action} className="flex flex-col gap-4">
      <fieldset className="flex gap-1 self-start rounded-[22px] bg-surface p-1">
        <legend className="sr-only">Rent or a cost</legend>
        {(["rent", "cost"] as const).map((k) => (
          <label key={k} className={cx("flex min-h-10 cursor-pointer items-center rounded-full px-4 text-sm font-semibold", kind === k ? "bg-ink text-white" : "text-ink")}>
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />{k === "rent" ? "Rent received" : "A cost"}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        {properties.length > 1 ? (
          <Field label="Property"><Select name="propertyId">{properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        ) : <input type="hidden" name="propertyId" value={properties[0]?.id ?? ""} />}
        <Field label="Date" error={e.on}><Input type="date" name="on" defaultValue={today} max={today} required /></Field>
        <Field label="What for" error={e.description}><Input name="description" placeholder={kind === "rent" ? "Rent for October" : "Boiler repair"} required /></Field>
        {kind === "cost" && <Field label="Paid to"><Input name="payee" /></Field>}
        {kind === "cost" && (
          <Field label="Category" error={e.categoryId}>
            <Select name="categoryId" defaultValue="">
              <option value="" disabled>Pick one</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Amount (£)" hint="The full amount; your share is worked out" error={e.amount}><Input name="amount" inputMode="decimal" required /></Field>
      </div>
      <div className="flex flex-wrap items-center gap-3"><Button disabled={pending}>{pending ? "Saving…" : kind === "rent" ? "Record rent" : "Record the cost"}</Button><Status state={state} /></div>
    </form>
  );
}

export function TripForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(logTrip, undefined);
  const ref = useReset(state);
  const e = state?.errors ?? {};
  return (
    <form ref={ref} action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" error={e.on}><Input type="date" name="on" defaultValue={today} max={today} required /></Field>
        <Field label="Purpose" hint="Who you saw or why"><Input name="purpose" /></Field>
        <Field label="From" error={e.from}><Input name="from" required /></Field>
        <Field label="To" error={e.to}><Input name="to" required /></Field>
        <Field label="Miles" hint="One way" error={e.miles}><Input name="miles" inputMode="decimal" placeholder="25" required /></Field>
        <Field label="Vehicle"><Select name="vehicle" defaultValue="car"><option value="car">Car or van</option><option value="motorcycle">Motorcycle</option><option value="bicycle">Bicycle</option></Select></Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="returnTrip" defaultChecked className="size-5 accent-[#18161F]" />There and back (doubles the miles)</label>
      <div className="flex flex-wrap items-center gap-3"><Button disabled={pending}>{pending ? "Saving…" : "Log the trip"}</Button><Status state={state} /></div>
    </form>
  );
}

export function MessageForm({ to }: { to: string }) {
  const [state, action, pending] = useActionState(sendMessage, undefined);
  const ref = useReset(state);
  return (
    <form ref={ref} action={action} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1.5"><span className="text-[13px] font-semibold">Message {to}</span><Textarea name="body" rows={3} placeholder="Write a message" required /></label>
      <div className="flex items-center gap-3"><Button disabled={pending} className="self-start">{pending ? "Sending…" : "Send"}</Button><Status state={state} /></div>
    </form>
  );
}

export function RequestForm() {
  const [state, action, pending] = useActionState(askFor, undefined);
  const ref = useReset(state);
  const e = state?.errors ?? {};
  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <Field label="What do you need?" error={e.title}><Input name="title" placeholder="Upload the September statement" required /></Field>
      <Field label="Details"><Textarea name="body" rows={2} /></Field>
      <div className="flex items-center gap-3"><Button disabled={pending} className="self-start">{pending ? "Sending…" : "Send the request"}</Button><Status state={state} /></div>
    </form>
  );
}
