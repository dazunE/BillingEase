"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, Icon } from "@/components/ui";
import { AuthTitle, FormError } from "@/components/auth/Frame";
import { FieldError } from "@/components/auth/fields";
import { signInCode } from "../../actions";

/** Two-step sign-in, step two: the 6-digit code from the app, or one of the backup codes. */
export function CodeForm() {
  const [state, action, pending] = useActionState(signInCode, undefined);
  const [backup, setBackup] = useState(state?.values?.backup === "1");
  const err = state?.errors?.code;
  const expired = !!state?.errors?._expired;

  if (expired) {
    return (
      <div className="flex flex-col gap-5">
        <AuthTitle title="Sign in again." lead={state?.message} />
        <Link href="/sign-in" className="inline-flex min-h-12 items-center justify-center rounded-full bg-violet px-5 text-sm font-semibold text-ink no-underline">Back to sign in</Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <span className="flex size-14 items-center justify-center rounded-full bg-tint">
        <Icon d="M8.5 2.5h7a2.5 2.5 0 0 1 2.5 2.5v14a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 6 19V5a2.5 2.5 0 0 1 2.5-2.5zM10.5 18.5h3" size={26} />
      </span>
      <AuthTitle
        title={backup ? "Use a backup code." : "Enter your code."}
        lead={backup
          ? "One of the 10 codes you saved when you turned on two-step sign-in. Each works once."
          : "Open your authenticator app and type the code for BillingEase. It changes every 30 seconds."}
      />
      <input type="hidden" name="backup" value={backup ? "1" : ""} />
      {state?.message && !err && <FormError message={state.message} />}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="si-code" className="text-[13px] font-semibold">{backup ? "Backup code" : "6-digit code"}</label>
        <input
          key={backup ? "backup" : "code"}
          id="si-code"
          name="code"
          type="text"
          inputMode={backup ? "text" : "numeric"}
          autoComplete="one-time-code"
          maxLength={backup ? 9 : 7}
          autoFocus
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? "si-code-err" : undefined}
          className={`min-h-14 w-full rounded-[10px] border bg-white px-3.5 text-center font-display text-[26px] font-bold tracking-[0.3em] tabular-nums text-ink focus:outline-2 focus:outline-offset-1 focus:outline-coming ${err ? "border-late" : "border-input"}`}
        />
        {err && <FieldError id="si-code-err">{err}</FieldError>}
      </div>
      <Button disabled={pending} className="min-h-12">{pending ? "Checking…" : "Verify and sign in"}</Button>
      <button type="button" onClick={() => setBackup(!backup)} className="self-center text-sm font-semibold underline underline-offset-2">
        {backup ? "Use my authenticator app" : "Use a backup code"}
      </button>
      <Link href="/sign-in" className="self-center text-sm font-medium text-ink2 underline underline-offset-2">Back to sign in</Link>
    </form>
  );
}
