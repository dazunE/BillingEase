"use client";

import { useActionState } from "react";
import { lockPeriod } from "@/app/app/keep/actions";
import { Button, Field, Input, cx } from "@/components/ui";

/** Mark a period as sent: an optional reference, a confirmation, then it's locked for good. */
export function LockForm({ from, to, label, button, referenceHint }: { from: string; to: string; label: string; button: string; referenceHint: string }) {
  const [state, action, pending] = useActionState(lockPeriod, undefined);
  const e = state?.errors ?? {};
  if (state?.ok) return <p role="status" className="rounded-2xl bg-pos-bg p-4 text-sm font-semibold text-pos">{state.message}</p>;
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="to" value={to} />
      <Field label="Reference (optional)" hint={referenceHint} error={e.reference}>
        <Input name="reference" maxLength={80} autoComplete="off" defaultValue={state?.values?.reference} />
      </Field>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="confirm" className="mt-0.5 size-5 shrink-0 accent-[#18161F]" />
        <span className="flex flex-col gap-0.5">
          <span className="font-semibold">{label} has been sent</span>
          <span className="text-[13px] text-ink2">Nothing more can be recorded in it afterwards, so the figures stay as sent. A correction goes in a later period.</span>
          {e.confirm && <span className="text-xs font-semibold text-late">{e.confirm}</span>}
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="dark" disabled={pending}>{pending ? "Saving…" : button}</Button>
        {state?.message && <span role="alert" className={cx("text-sm font-semibold text-late")}>{state.message}</span>}
      </div>
    </form>
  );
}
