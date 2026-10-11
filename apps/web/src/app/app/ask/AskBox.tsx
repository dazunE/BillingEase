"use client";

import { useActionState, useRef } from "react";
import { Button, cx } from "@/components/ui";
import { askQuestion } from "./actions";

/** The question box and the suggested questions. A suggestion fills the box and asks it. */
export function AskBox({ threadId, suggestions, placeholder, disabled }: { threadId?: string; suggestions: string[]; placeholder: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(askQuestion, undefined);
  const form = useRef<HTMLFormElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const err = state?.errors?.question;
  return (
    <div className="flex flex-col gap-5">
      <form ref={form} action={action} noValidate className="flex flex-col gap-2 rounded-3xl border border-line bg-white p-4 sm:p-5">
        {threadId && <input type="hidden" name="threadId" value={threadId} />}
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">{threadId ? "Ask a follow-up" : "Your question"}</span>
          <textarea
            ref={box} name="question" rows={3} defaultValue={state?.values?.question} placeholder={placeholder} disabled={disabled || pending}
            aria-invalid={!!err} aria-describedby={err ? "q-err" : undefined}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.current?.requestSubmit(); } }}
            className={cx("min-h-24 w-full rounded-[10px] border bg-white px-3.5 py-2.5 text-[15px] focus:border-ink focus:outline-none disabled:bg-bg", err ? "border-late" : "border-input")}
          />
        </label>
        {err && <span id="q-err" className="text-xs font-semibold text-late">{err}</span>}
        {state?.message && !err && <p role="alert" className="rounded-xl bg-late-bg px-4 py-3 text-sm font-semibold text-late">{state.message}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted">Press Enter to ask · Shift and Enter for a new line</span>
          <Button disabled={disabled || pending}>{pending ? "Looking through your books…" : "Ask"}</Button>
        </div>
      </form>
      {!threadId && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-muted">People often ask</span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((q) => (
              <button key={q} type="button" disabled={disabled || pending}
                onClick={() => { if (box.current) box.current.value = q; form.current?.requestSubmit(); }}
                className="min-h-11 rounded-full border border-line bg-white px-4 text-left text-sm font-semibold hover:border-ink disabled:cursor-not-allowed disabled:opacity-60">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
