"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, ButtonLink, ICONS } from "@/components/ui";
import { AuthTitle, FormError, StateBadge } from "@/components/auth/Frame";
import { AuthField } from "@/components/auth/fields";
import { ResetSteps } from "@/components/auth/ResetSteps";
import { forgotPassword } from "../actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPassword, undefined);
  // "Use a different email" goes back to the form until the next answer comes back.
  const [editingFor, setEditingFor] = useState<typeof state | null>(null);
  const email = state?.values?.email ?? "";
  const sent = state?.ok && editingFor !== state;

  if (sent) {
    return (
      <>
        <ResetSteps step={2} />
        <form action={action} className="flex flex-col gap-5">
          <StateBadge tone="violet" d={ICONS.mail} />
          <AuthTitle
            title="Check your inbox."
            lead={<>If there’s an account for <strong className="text-ink [overflow-wrap:anywhere]">{email}</strong>, a link to choose a new password is on its way. It works for one hour. Not there? Look in spam, or send it again.</>}
          />
          <input type="hidden" name="email" value={email} />
          <p role="status" className="sr-only">{state?.message}</p>
          <Button variant="outline" disabled={pending} className="min-h-12">{pending ? "Sending…" : "Send the link again"}</Button>
          <button type="button" onClick={() => setEditingFor(state)} className="min-h-9 self-center text-sm font-semibold underline underline-offset-[3px]">Use a different email</button>
        </form>
      </>
    );
  }

  return (
    <>
      <ResetSteps step={1} />
      <form action={action} className="flex flex-col gap-5" noValidate>
        <AuthTitle title="Forgot your password?" lead="It happens. Tell us the email you sign in with and we’ll send a link to choose a new one." />
        <AuthField label="Email" name="email" type="email" autoComplete="email" defaultValue={email} error={state?.errors?.email} required />
        {!state?.ok && <FormError message={state?.message} />}
        <Button disabled={pending} className="min-h-12">{pending ? "Sending…" : "Send reset link"}</Button>
        <ButtonLink href="/sign-in" variant="secondary" className="min-h-12">Back to sign in</ButtonLink>
      </form>
    </>
  );
}

export function SignInLink() {
  return <>Remembered it? <Link href="/sign-in" className="font-semibold text-ink underline underline-offset-2">Sign in</Link></>;
}
