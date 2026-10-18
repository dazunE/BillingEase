"use client";

import { useActionState, useState } from "react";
import { Button, Icon, ICONS } from "@/components/ui";
import { AuthTitle, FormError } from "@/components/auth/Frame";
import { FieldError, PasswordField } from "@/components/auth/fields";
import { ResetSteps } from "@/components/auth/ResetSteps";
import { resetPassword } from "../actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  const [pass, setPass] = useState("");
  const [again, setAgain] = useState("");
  const [shown, setShown] = useState(false);
  const e = state?.errors ?? {};
  const rules: [string, boolean][] = [
    ["At least 10 characters", pass.length >= 10],
    ["A number or a symbol", /[\d\W_]/.test(pass)],
  ];
  const mismatch = again.length >= pass.length && again.length > 0 && again !== pass;
  return (
    <>
      <ResetSteps step={3} />
      <form action={action} className="flex flex-col gap-[18px]" noValidate>
        <AuthTitle title="Choose a new password." lead="Use one you don’t use anywhere else." />
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col gap-1.5">
          <PasswordField label="New password" name="password" autoComplete="new-password" meter value={pass} onValue={setPass} shown={shown} onShown={setShown} error={e.password} />
          <ul className="flex flex-col gap-1 text-[13px]">
            {rules.map(([label, ok]) => (
              <li key={label} className={ok ? "flex items-center gap-2 text-pos" : "flex items-center gap-2 text-muted"}>
                <Icon d={ok ? ICONS.check : "M6 12h12"} size={14} strokeWidth={3} />
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rp-again" className="text-[13px] font-semibold">Type it again</label>
          <input id="rp-again" name="confirm" type={shown ? "text" : "password"} autoComplete="new-password" value={again} onChange={(ev) => setAgain(ev.target.value)}
            aria-invalid={mismatch || e.confirm ? true : undefined}
            className={`min-h-11 w-full rounded-[10px] border bg-white px-3.5 text-[15px] focus:outline-2 focus:outline-offset-1 focus:outline-coming ${mismatch || e.confirm ? "border-late" : "border-input"}`} />
          {(e.confirm || mismatch) && <FieldError>{e.confirm ?? "The two passwords don’t match yet."}</FieldError>}
        </div>
        <FormError message={state?.message} />
        <Button disabled={pending} className="min-h-12">{pending ? "Saving…" : "Save and sign in"}</Button>
      </form>
    </>
  );
}
