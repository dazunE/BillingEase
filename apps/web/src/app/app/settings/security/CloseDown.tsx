"use client";

import { useActionState, useState } from "react";
import { closeBusiness } from "./actions";

/**
 * Close things down: closes the business and the owner's account. Nothing happens by accident:
 * the business name has to be typed first.
 */
export function CloseDown({ name, what, purgeDays }: { name: string; what: string[]; purgeDays: number }) {
  const [state, action, pending] = useActionState(closeBusiness, undefined);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const ready = typed.trim().replace(/\s+/g, " ").toLowerCase() === name.trim().replace(/\s+/g, " ").toLowerCase();

  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-line p-[18px]">
      <strong className="text-base">Close your account</strong>
      <ul className="flex list-disc flex-col gap-1 pl-[18px] text-[13px] leading-relaxed text-ink2">
        {what.map((w) => <li key={w}>{w}</li>)}
      </ul>
      {!open ? (
        <span className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
          <button type="button" onClick={() => { setOpen(true); setTyped(""); }} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#A8200D] bg-white px-5 text-sm font-semibold text-[#A8200D] hover:bg-late-bg">Close my account</button>
          <a href="#export-h" className="text-[13px] font-semibold">Export your data first</a>
        </span>
      ) : (
        <form action={action} className="flex flex-col gap-2.5 rounded-2xl bg-late-bg p-3.5">
          <span className="text-[13px] font-semibold leading-normal text-late">
            Everyone is signed out and loses access now, and nothing in {name} can change. You can still sign in to look and export for {purgeDays} days,
            or reopen it. After that, {name}&apos;s books, invoices, bills, customers and your account are deleted for good.
          </span>
          <label htmlFor="close-confirm" className="text-[13px] font-semibold">Type <strong>{name}</strong> to confirm</label>
          <input id="close-confirm" name="confirm" type="text" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)}
            aria-invalid={state?.error ? true : undefined}
            className="min-h-11 w-full rounded-[10px] border border-input bg-white px-3.5 text-[15px] focus:outline-2 focus:outline-offset-1 focus:outline-coming" />
          {state?.error && <span role="alert" className="text-[13px] font-semibold text-late">{state.error}</span>}
          <span className="flex flex-wrap gap-2">
            <button disabled={!ready || pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#A8200D] px-5 text-sm font-semibold text-white hover:bg-[#8f1b0b] disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted">
              {pending ? "Closing…" : "Close my account"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-ink hover:bg-white/80">Keep it</button>
          </span>
        </form>
      )}
    </div>
  );
}
