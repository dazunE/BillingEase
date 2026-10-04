"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { saveSettingsAction, type SettingsState } from "./actions";

export function SettingsForm({ initial }: { initial: { name: string; invoicePrefix: string; taxRatePct: string } }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettingsAction, undefined);
  const e = state?.errors ?? {};
  const v = state?.values ?? initial;
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Field label="Business name" hint="Shown on your invoices and emails." error={e.name}>
        <Input name="name" defaultValue={v.name} required maxLength={120} aria-invalid={!!e.name} />
      </Field>
      <div className="flex flex-wrap gap-5">
        <Field label="Invoice number prefix" hint="New invoices look like INV-0012." error={e.invoicePrefix} className="min-w-0 flex-[1_1_200px]">
          <Input name="invoicePrefix" defaultValue={v.invoicePrefix} required maxLength={12} aria-invalid={!!e.invoicePrefix} />
        </Field>
        <Field label="Set aside for tax (% of profit)" hint="25% is a common starting point." error={e.taxRatePct} className="min-w-0 flex-[1_1_200px]">
          <Input name="taxRatePct" type="number" inputMode="numeric" min={0} max={60} step={1} defaultValue={v.taxRatePct} required aria-invalid={!!e.taxRatePct} />
        </Field>
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
