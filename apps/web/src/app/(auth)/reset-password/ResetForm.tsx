"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { resetPassword } from "../actions";
import { FormError } from "../AuthShell";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormError message={state?.message} />
      <input type="hidden" name="token" value={token} />
      <Field label="New password" hint="At least 10 characters" error={state?.errors?.password}>
        <Input name="password" type="password" autoComplete="new-password" required minLength={10} />
      </Field>
      <Field label="Type it again" error={state?.errors?.confirm}>
        <Input name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <Button disabled={pending}>{pending ? "Saving…" : "Save and sign in"}</Button>
    </form>
  );
}
