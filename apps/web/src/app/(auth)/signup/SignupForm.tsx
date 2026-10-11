"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { signup, type AuthState } from "../actions";

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signup, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field label="Your name" error={e.name}>
        <Input name="name" autoComplete="name" defaultValue={state?.values?.name} aria-invalid={!!e.name} required />
      </Field>
      <Field label="Work email" error={e.email}>
        <Input name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} aria-invalid={!!e.email} required />
      </Field>
      <Field label="Password" hint="At least 12 characters." error={e.password}>
        <Input name="password" type="password" autoComplete="new-password" minLength={12} aria-invalid={!!e.password} required />
      </Field>
      <label className="flex items-start gap-2.5 text-sm text-ink2">
        <input type="checkbox" name="terms" className="mt-0.5 size-4 accent-ink" />
        <span>
          I agree to the terms of service and privacy policy.
          {e.terms && <span className="mt-1 block text-xs font-semibold text-late">{e.terms}</span>}
        </span>
      </label>
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Creating your account…" : "Create account"}
      </Button>
      <p className="text-sm text-ink2">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
