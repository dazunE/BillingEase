"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { login, type AuthState } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {e.form && (
        <p role="alert" className="rounded-xl bg-late-bg px-4 py-3 text-sm font-semibold text-late">
          {e.form}
        </p>
      )}
      <Field label="Email" error={e.email}>
        <Input name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} required />
      </Field>
      <Field label="Password" error={e.password}>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-sm text-ink2">
        New to BillingEase?{" "}
        <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}
