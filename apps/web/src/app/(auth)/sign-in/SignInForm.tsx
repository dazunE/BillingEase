"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { signIn } from "../actions";
import { FormError } from "../AuthShell";

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormError message={state?.message} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" error={state?.errors?.email}>
        <Input name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} required />
      </Field>
      <Field label="Password" error={state?.errors?.password}>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Link href="/forgot-password" className="-mt-2 self-start text-sm font-semibold underline">Forgot your password?</Link>
      <Button disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
      <p className="text-center text-sm text-ink2">New to BillingEase? <Link href="/sign-up" className="font-semibold underline">Create an account</Link></p>
    </form>
  );
}
