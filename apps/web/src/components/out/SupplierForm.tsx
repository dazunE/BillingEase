"use client";

import type { OutCategory, Supplier } from "@billingease/contracts";
import { useActionState } from "react";
import { saveSupplier } from "@/app/app/out/actions";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { Alert } from "./fields";

/** Add a supplier, or change their details. */
export function SupplierForm({ supplier, categories, vatLabel, name }: { supplier?: Supplier; categories: OutCategory[]; vatLabel: string; name?: string }) {
  const [state, action, pending] = useActionState(saveSupplier, undefined);
  const e = state?.errors ?? {};
  const v = state?.values ?? {};
  const val = (k: keyof Supplier) => v[k] ?? (supplier?.[k] as string | null | undefined) ?? "";
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {supplier && <input type="hidden" name="id" value={supplier.id} />}
      <Alert state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" error={e.name}><Input name="name" defaultValue={v.name ?? supplier?.name ?? name} /></Field>
        <Field label="Usually goes to" hint="Optional" error={e.defaultCategoryId}>
          <Select name="defaultCategoryId" defaultValue={val("defaultCategoryId")}>
            <option value="">No usual category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.scope === "property" ? " (property)" : ""}</option>)}
          </Select>
        </Field>
        <Field label="Contact" hint="Optional" error={e.contactName}><Input name="contactName" defaultValue={val("contactName")} /></Field>
        <Field label="Email" hint="Optional" error={e.email}><Input name="email" type="email" defaultValue={val("email")} /></Field>
        <Field label="Phone" hint="Optional" error={e.phone}><Input name="phone" type="tel" defaultValue={val("phone")} /></Field>
        <Field label={vatLabel} hint={vatLabel === "Sales tax permit" ? "Optional" : "Optional: if they're VAT registered"} error={e.vatNumber}><Input name="vatNumber" defaultValue={val("vatNumber")} /></Field>
      </div>
      <Field label="Address" hint="Optional" error={e.address}><Textarea name="address" defaultValue={val("address")} className="min-h-16" /></Field>
      <Field label="Notes" hint="Optional, e.g. their terms" error={e.notes}><Textarea name="notes" defaultValue={val("notes")} className="min-h-16" /></Field>
      <Button disabled={pending} className="self-start">{pending ? "Saving…" : supplier ? "Save" : "Add supplier"}</Button>
    </form>
  );
}
