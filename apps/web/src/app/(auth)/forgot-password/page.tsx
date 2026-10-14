"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { forgotPassword } from "../actions";
import { AuthShell, FormError, FormNote } from "../AuthShell";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPassword, undefined);
  return (
    <AuthShell title="Forgot your password?" lead="We'll email you a link to choose a new one.">
      <form action={action} className="flex flex-col gap-5" noValidate>
        {state?.ok ? <FormNote message={state.message} /> : <FormError message={state?.message} />}
        <Field label="Email" error={state?.errors?.email}>
          <Input name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} required />
        </Field>
        <Button disabled={pending}>{pending ? "Sending…" : "Send the link"}</Button>
        <Link href="/sign-in" className="text-center text-sm font-semibold underline">Back to sign in</Link>
      </form>
    </AuthShell>
  );
}
