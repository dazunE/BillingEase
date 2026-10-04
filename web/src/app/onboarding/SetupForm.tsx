"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { createBusiness, type SetupState } from "./actions";

const KINDS = [
  ["freelancer", "Freelancer or consultant"],
  ["agency", "Agency or studio"],
  ["retail", "Shop or retail"],
  ["trades", "Contractor or trades"],
  ["food", "Café or restaurant"],
  ["nonprofit", "Nonprofit"],
  ["other", "Something else"],
] as const;

export function SetupForm() {
  const [state, action, pending] = useActionState<SetupState, FormData>(createBusiness, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <Field label="Business name" error={e.name}>
        <Input name="name" placeholder="Northwind Studio" required autoFocus />
      </Field>
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-[13px] font-semibold">What kind of business is it?</legend>
        <div className="flex flex-wrap gap-2">
          {KINDS.map(([value, label]) => (
            <label key={value} className="cursor-pointer">
              <input type="radio" name="kind" value={value} className="peer sr-only" defaultChecked={value === "agency"} />
              <span className="inline-flex min-h-11 items-center rounded-full border border-input bg-white px-4 text-sm font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-coming">
                {label}
              </span>
            </label>
          ))}
        </div>
        {e.kind && <span className="text-xs font-semibold text-late">{e.kind}</span>}
      </fieldset>
      <label className="flex items-start gap-3 rounded-2xl bg-tint p-4">
        <input type="checkbox" name="sample" defaultChecked className="mt-1 size-4 accent-ink" />
        <span className="flex flex-col gap-1">
          <span className="text-[15px] font-semibold">Start with a sample month</span>
          <span className="text-sm text-ink2">
            Fills your books with a realistic month (customers, invoices, bills and a sandbox bank) so you can try everything. Leave it off to start empty.
          </span>
        </span>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Setting up your books…" : "Show me my three numbers"}
      </Button>
    </form>
  );
}
