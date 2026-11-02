"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, cx, Icon, ICONS, Textarea } from "@/components/ui";
import { importCustomers } from "./actions";

/** Bring your customers in: a CSV file, or rows pasted in. */
export function ImportForm() {
  const [state, action, pending] = useActionState(importCustomers, undefined);
  const [paste, setPaste] = useState(false);
  const [name, setName] = useState<string | null>(null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex cursor-pointer flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-input p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-coming">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface"><Icon d={ICONS.doc} size={20} /></span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{name ?? "Choose a CSV file"}</span>
          <span className="text-[13px] text-muted">The first row names the columns, like <strong className="text-ink">name,email</strong>. Phone, address, contact, TIN and VAT number are read too; other columns are ignored.</span>
        </span>
        <span className="inline-flex min-h-11 items-center rounded-full bg-violet px-5 text-[15px] font-semibold">Choose file</span>
        <input type="file" name="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={(e) => setName(e.target.files?.[0]?.name ?? null)} />
      </label>
      {paste ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Or paste the rows</span>
          <Textarea name="rows" rows={5} placeholder={"name,email\nKirkstall Brewing Co,accounts@kirkstall.example"} className="font-mono text-sm" />
        </label>
      ) : (
        <button type="button" onClick={() => setPaste(true)} className="self-start text-sm font-semibold underline underline-offset-4">Or paste the rows instead</button>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={pending}>{pending ? "Importing…" : "Import customers"}</Button>
        {state?.message && <span role="status" className={cx("text-sm font-semibold", state.ok ? "text-pos" : "text-late")}>{state.message}</span>}
        {state?.ok && <Link href="/app/in/customers" className="text-sm font-semibold underline underline-offset-4">See your customers</Link>}
      </div>
      {!!state?.skipped?.length && (
        <ul className="flex flex-col gap-1 rounded-2xl bg-bg p-3 text-[13px] text-ink2">
          {state.skipped.map((s) => <li key={s.line}>Line {s.line}: {s.why}</li>)}
        </ul>
      )}
      <p className="text-[13px] text-muted">Imported customers don&apos;t change your three numbers. Money only moves when you bill them.</p>
    </form>
  );
}
