"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Icon } from "@/components/ui";
import { AuthTitle } from "@/components/auth/Frame";
import { AuthField, PasswordField } from "@/components/auth/fields";
import { signIn } from "../actions";

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <AuthTitle title="Welcome back." lead="Sign in to see where your three numbers stand today." />
      <input type="hidden" name="next" value={next ?? ""} />
      <AuthField label="Email" name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} error={e.email} required />
      <PasswordField label="Password" name="password" autoComplete="current-password" error={e.password} min={1}
        aside={<Link href="/forgot-password" className="text-[13px] font-semibold underline underline-offset-2">Forgot password?</Link>} />
      {state?.message && (
        <div role="alert" className="flex items-start gap-2.5 rounded-[14px] bg-late-bg px-3.5 py-3 text-sm leading-[1.45] text-late">
          <Icon d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v5M12 16.5v.01" size={18} strokeWidth={2.2} className="mt-px flex-none" />
          <span>
            <strong>{state.message}</strong>
            {Object.keys(e).length === 0 && <> Check caps lock and try again, or <Link href="/forgot-password" className="font-semibold text-late underline">reset it</Link>.</>}
          </span>
        </div>
      )}
      <Button disabled={pending} className="min-h-12">{pending ? "Signing in…" : "Sign in"}</Button>
      <Link href="/sign-up" className="self-center text-sm font-semibold underline underline-offset-2">Create an account</Link>
    </form>
  );
}
