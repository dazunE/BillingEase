"use client";

import { SCOPES, type ApiScope } from "@billingease/contracts";
import { useActionState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { CopyField } from "./CopyField";
import { createToken, type TokenState } from "./actions";

export function TokenForm() {
  const [state, action, pending] = useActionState<TokenState, FormData>(createToken, undefined);
  if (state?.token) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-2xl bg-pos-bg p-4">
        <strong className="text-pos">{state.name} is ready</strong>
        <p className="text-sm text-ink">Copy it now: BillingEase keeps only a fingerprint of it, so it can&apos;t be shown again. Treat it like a password.</p>
        <CopyField label="Token" value={state.token} />
        <a href="/app/settings/apps" className="self-start text-sm font-semibold underline underline-offset-4">I&apos;ve copied it</a>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field label="Name" hint="So you know which script or app uses it" error={state?.errors?.name}>
        <Input name="name" maxLength={80} defaultValue={state?.values?.name ?? ""} placeholder="e.g. Monthly report script" />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">It can</legend>
        {(Object.keys(SCOPES) as ApiScope[]).map((s) => (
          <label key={s} className="flex items-start gap-3 rounded-2xl border border-line px-4 py-3">
            <input type="checkbox" name="scopes" value={s} defaultChecked={s === "books:read"} className="mt-1 size-5 shrink-0 accent-[#18161F]" />
            <span className="flex flex-col"><span className="text-[15px] font-semibold">{SCOPES[s].label}</span><span className="text-sm text-ink2">{SCOPES[s].detail}</span></span>
          </label>
        ))}
        {state?.errors?.scopes && <span className="text-sm font-semibold text-late">{state.errors.scopes}</span>}
      </fieldset>
      <Field label="Stops working" className="max-w-[260px]">
        <Select name="expires" defaultValue="90">
          <option value="30">In 30 days</option>
          <option value="90">In 90 days</option>
          <option value="365">In a year</option>
          <option value="never">Never (until revoked)</option>
        </Select>
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="dark" disabled={pending}>{pending ? "Making it…" : "Make a token"}</Button>
        {state?.message && !state.ok && <span role="alert" className="text-sm font-semibold text-late">{state.message}</span>}
      </div>
    </form>
  );
}
