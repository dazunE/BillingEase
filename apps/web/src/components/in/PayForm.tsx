"use client";

import { useActionState, useState } from "react";
import { payOnlineAction, type PayState } from "@/app/i/[token]/actions";
import { ICONS, Icon, cx, inputClass } from "@/components/ui";

function F({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="text-[13px] font-semibold">{label}</span>
      {children}
      {error && <span className="text-xs font-semibold text-late">{error}</span>}
    </label>
  );
}

/** Customer checkout: card or bank, through the (sandbox) payments provider. */
export function PayForm({ token, amount, allowCard, allowBank }: { token: string; amount: string; allowCard: boolean; allowBank: boolean }) {
  const [state, action, pending] = useActionState<PayState, FormData>(payOnlineAction.bind(null, token), undefined);
  const [method, setMethod] = useState<"card" | "bank">(state?.method ?? (allowCard ? "card" : "bank"));
  const e = state?.errors ?? {};
  const v = state?.values ?? {};
  const both = allowCard && allowBank;

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="method" value={method} />
      {both && (
        <div role="tablist" aria-label="How to pay" className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1">
          {(["card", "bank"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={method === m}
              onClick={() => setMethod(m)}
              className={cx("inline-flex min-h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold", method === m ? "bg-ink text-white" : "text-ink")}
            >
              <Icon d={m === "card" ? ICONS.card : ICONS.bank} size={16} />
              {m === "card" ? "Card" : "Pay by bank"}
            </button>
          ))}
        </div>
      )}

      {method === "card" ? (
        <div className="flex flex-col gap-3">
          <F label="Name on card" error={e.name}>
            <input name="name" autoComplete="cc-name" defaultValue={v.name} aria-invalid={!!e.name} className={inputClass} />
          </F>
          <F label="Card number" error={e.cardNumber}>
            <input name="cardNumber" inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" aria-invalid={!!e.cardNumber} className={cx(inputClass, "tabular")} />
          </F>
          <div className="flex gap-3">
            <F label="Expiry" error={e.expiry} className="flex-1">
              <input name="expiry" inputMode="numeric" defaultValue={v.expiry} autoComplete="cc-exp" placeholder="MM/YY" aria-invalid={!!e.expiry} className={cx(inputClass, "tabular")} />
            </F>
            <F label="CVC" error={e.cvc} className="flex-1">
              <input name="cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" aria-invalid={!!e.cvc} className={cx(inputClass, "tabular")} />
            </F>
          </div>
          <p className="rounded-xl bg-bg px-3.5 py-2.5 text-xs leading-relaxed text-ink2">
            Test card: <strong className="tabular">4242 4242 4242 4242</strong>, any future date, any CVC. <span className="tabular">4000 0000 0000 0002</span> is declined.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <F label="Account holder" error={e.name}>
            <input name="name" autoComplete="name" defaultValue={v.name} aria-invalid={!!e.name} className={inputClass} />
          </F>
          <div className="flex flex-wrap gap-3">
            <F label="Routing number" error={e.routing} className="flex-[1_1_140px]">
              <input name="routing" inputMode="numeric" defaultValue={v.routing} placeholder="9 digits" aria-invalid={!!e.routing} className={cx(inputClass, "tabular")} />
            </F>
            <F label="Account number" error={e.account} className="flex-[1_1_160px]">
              <input name="account" inputMode="numeric" aria-invalid={!!e.account} className={cx(inputClass, "tabular")} />
            </F>
          </div>
          <p className="rounded-xl bg-bg px-3.5 py-2.5 text-xs leading-relaxed text-ink2">
            Test mode: any 9-digit routing number (like <span className="tabular">110000000</span>) and any account number work.
          </p>
        </div>
      )}

      {e.form && (
        <p role="alert" className="rounded-[14px] bg-late-bg px-4 py-3 text-sm font-semibold text-late">
          {e.form}
        </p>
      )}

      <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-semibold text-white hover:bg-black disabled:opacity-60">
        {pending ? "Paying…" : `Pay ${amount}`}
      </button>
    </form>
  );
}
