"use client";

import { useActionState } from "react";
import { createCustomerAction, updateCustomerAction, type CustomerState } from "@/app/app/customers/actions";
import { Button, Field, Input, Textarea } from "@/components/ui";

type Values = { name: string; email: string | null; phone: string | null; address: string | null };

/** Add a customer (no `customerId`) or edit one. Only the name is required. */
export function CustomerForm({ customerId, initial, submitLabel }: { customerId?: string; initial?: Values; submitLabel: string }) {
  const fn = customerId ? updateCustomerAction.bind(null, customerId) : createCustomerAction;
  const [state, action, pending] = useActionState<CustomerState, FormData>(fn, undefined);
  const e = state?.errors ?? {};
  // After a failed submit, keep what they typed.
  const v = state?.values ?? { name: initial?.name ?? "", email: initial?.email ?? "", phone: initial?.phone ?? "", address: initial?.address ?? "" };
  return (
    <form action={action} noValidate className="flex flex-col gap-3.5">
      <Field label="Name" error={e.name}>
        <Input name="name" required autoComplete="off" defaultValue={v.name} aria-invalid={!!e.name} placeholder="Business or person" />
      </Field>
      <div className="flex flex-wrap gap-3.5">
        <Field label="Email (optional)" hint="Where invoices and reminders go." error={e.email} className="min-w-0 flex-[1_1_220px]">
          <Input name="email" type="email" autoComplete="off" defaultValue={v.email} aria-invalid={!!e.email} placeholder="name@example.com" />
        </Field>
        <Field label="Phone (optional)" error={e.phone} className="min-w-0 flex-[1_1_160px]">
          <Input name="phone" type="tel" autoComplete="off" defaultValue={v.phone} aria-invalid={!!e.phone} />
        </Field>
      </div>
      <Field label="Address (optional)" hint="Printed on their invoices." error={e.address}>
        <Textarea name="address" rows={3} defaultValue={v.address} aria-invalid={!!e.address} className="min-h-20" />
      </Field>
      {e.form && (
        <p role="alert" className="text-sm font-semibold text-late">
          {e.form}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
