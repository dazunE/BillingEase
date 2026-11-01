"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { savePassword } from "./actions";

/** Set a first password (after signing up with Google) or change the one you have. */
export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(savePassword, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4" noValidate key={state?.ok ? "done" : "form"}>
      <input type="hidden" name="mode" value={hasPassword ? "change" : "set"} />
      {hasPassword && (
        <Field label="Current password" error={e.current}>
          <Input type="password" name="current" autoComplete="current-password" />
        </Field>
      )}
      <Field label={hasPassword ? "New password" : "Password"} hint="At least 10 characters" error={e.password}>
        <Input type="password" name="password" autoComplete="new-password" />
      </Field>
      <Field label="Type it again" error={e.confirm}>
        <Input type="password" name="confirm" autoComplete="new-password" />
      </Field>
      {state?.message && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "rounded-2xl bg-pos-bg px-4 py-3 text-sm font-semibold text-pos" : "rounded-2xl bg-late-bg px-4 py-3 text-sm font-semibold text-late"}>{state.message}</p>
      )}
      <Button disabled={pending} className="self-start">{pending ? "Saving…" : hasPassword ? "Change password" : "Set password"}</Button>
    </form>
  );
}
