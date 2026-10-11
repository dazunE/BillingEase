"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, Field, Input, cx } from "@/components/ui";
import { signUp } from "../actions";
import { FormError } from "../AuthShell";

const COUNTRIES = [
  { id: "uk", name: "United Kingdom", line: "Sole traders and landlords. Pounds, MTD quarters, VAT.", flag: "UK" },
  { id: "lk", name: "Sri Lanka", line: "Rupees, Tax Invoices with VAT and SSCL, full payroll.", flag: "LK" },
];

export function SignUpForm({ initialCountry }: { initialCountry?: string }) {
  const [state, action, pending] = useActionState(signUp, undefined);
  const v = state?.values ?? {};
  const [country, setCountry] = useState(v.country ?? initialCountry ?? "");
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormError message={state?.message} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[13px] font-semibold">Where is your business?</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {COUNTRIES.map((c) => (
            <label key={c.id} className={cx("flex cursor-pointer flex-col gap-1 rounded-2xl border p-4 transition-colors", country === c.id ? "border-ink bg-tint" : "border-line bg-white hover:border-input")}>
              <span className="flex items-center gap-2">
                <input type="radio" name="country" value={c.id} checked={country === c.id} onChange={() => setCountry(c.id)} className="accent-[#18161F]" />
                <span className="text-[15px] font-semibold">{c.name}</span>
              </span>
              <span className="text-[13px] leading-snug text-muted">{c.line}</span>
            </label>
          ))}
        </div>
        {state?.errors?.country && <span className="text-xs font-semibold text-late">{state.errors.country}</span>}
        <span className="text-xs text-muted">This decides your currency, tax rules and forms. It can&apos;t be changed later.</span>
      </fieldset>
      <Field label="Your name" error={state?.errors?.name}>
        <Input name="name" autoComplete="name" defaultValue={v.name} required />
      </Field>
      <Field label="Email" error={state?.errors?.email}>
        <Input name="email" type="email" autoComplete="email" defaultValue={v.email} required />
      </Field>
      <Field label="Password" hint="At least 10 characters" error={state?.errors?.password}>
        <Input name="password" type="password" autoComplete="new-password" required minLength={10} />
      </Field>
      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" name="terms" defaultChecked={v.terms === "on"} className="mt-0.5 size-4 accent-[#18161F]" />
        <span>I agree to the <Link href="/legal/terms" className="underline">terms</Link> and <Link href="/legal/privacy" className="underline">privacy notice</Link>.</span>
      </label>
      {state?.errors?.terms && <span className="-mt-3 text-xs font-semibold text-late">{state.errors.terms}</span>}
      <Button disabled={pending}>{pending ? "Creating your account…" : "Create account"}</Button>
      <p className="text-center text-sm text-ink2">Already have an account? <Link href="/sign-in" className="font-semibold underline">Sign in</Link></p>
    </form>
  );
}
