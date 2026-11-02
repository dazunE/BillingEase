"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Field, Input, cx } from "@/components/ui";
import { invite } from "./actions";

/** Invite someone by email (owner only). */
export function InviteForm({ practitioner }: { practitioner: string }) {
  const [state, action, pending] = useActionState(invite, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) form.current?.reset(); }, [state]);
  const e = state?.errors ?? {};
  return (
    <form ref={form} action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Field label="Their email" error={e.email}>
          <Input name="email" type="email" autoComplete="off" placeholder="name@example.com" defaultValue={state?.ok ? "" : state?.values?.email} required />
        </Field>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-[13px] font-semibold">As your</legend>
          <div className="flex gap-1 rounded-[22px] bg-surface p-1">
            {[["accountant", practitioner], ["admin", "Office admin"]].map(([id, label], i) => (
              <label key={id} className="flex min-h-10 cursor-pointer items-center rounded-full px-4 text-sm font-semibold has-[:checked]:bg-ink has-[:checked]:text-white has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-coming">
                <input type="radio" name="role" value={id} defaultChecked={i === 0} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={pending}>{pending ? "Sending…" : "Send invitation"}</Button>
        {state?.message && (
          <span role="status" className={cx("text-sm font-semibold", state.ok ? "text-pos" : "text-late")}>{state.message}</span>
        )}
      </div>
    </form>
  );
}
