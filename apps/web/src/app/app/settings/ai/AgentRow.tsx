"use client";

import type { ResponseOf } from "@billingease/contracts";
import type { agents } from "@billingease/contracts";
import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { saveAgent } from "./actions";
import { usd } from "./money";

type Agent = ResponseOf<typeof agents.usage>["agents"][number];

export function AgentRow({ a, defaultBudget, canEdit }: { a: Agent; defaultBudget: number; canEdit: boolean }) {
  const [state, action, pending] = useActionState(saveAgent, undefined);
  return (
    <li className="flex flex-col gap-3 border-b border-divider px-5 py-4 last:border-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-lg font-bold">{a.name}</span>
        <span className="text-sm text-muted">{a.runs} {a.runs === 1 ? "run" : "runs"} · {usd(a.costMicros)} this month · {a.model}</span>
      </div>
      <p className="text-sm text-ink2">{a.description}</p>
      {canEdit ? (
        <form action={action} className="flex flex-wrap items-end gap-3" noValidate>
          <input type="hidden" name="agent" value={a.agent} />
          <label className="flex min-h-11 items-center gap-2 text-[15px] font-semibold">
            <input type="checkbox" name="enabled" defaultChecked={a.enabled} className="size-5 accent-[#18161F]" /> On
          </label>
          <Field label="Monthly cap (US$)" hint={`Blank: ${usd(defaultBudget)}`} error={state?.errors?.budget} className="w-[200px]">
            <Input name="budget" inputMode="decimal" defaultValue={state?.values?.budget ?? (a.monthlyBudgetMicros == null ? "" : String(a.monthlyBudgetMicros / 1_000_000))} />
          </Field>
          <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
          {state?.message && <span role="status" className={state.ok ? "text-sm text-pos" : "text-sm font-semibold text-late"}>{state.message}</span>}
        </form>
      ) : (
        <span className="text-sm text-muted">{a.enabled ? "On" : "Off"} · the owner can change this.</span>
      )}
    </li>
  );
}
