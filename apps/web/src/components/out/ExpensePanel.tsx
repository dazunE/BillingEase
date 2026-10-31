"use client";

import type { OutSetup } from "@billingease/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { ICONS, Icon } from "@/components/ui";
import { ExpenseForm } from "./ExpenseForm";

/**
 * The "Record an expense" form on Going out. It opens at #expense: from the button here, from
 * the header's New menu, or from a link on another page.
 */
export function ExpensePanel({ setup, suppliers, supplierCurrencies }: { setup: OutSetup; suppliers: string[]; supplierCurrencies?: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);

  const show = useCallback(() => {
    setOpen(true);
    requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  useEffect(() => {
    const check = () => { if (window.location.hash === "#expense") show(); };
    // Links to #expense on this page (Next.js changes the hash without a hashchange event).
    const onClick = (ev: MouseEvent) => {
      const a = (ev.target as HTMLElement | null)?.closest?.("a");
      if (a && a.getAttribute("href")?.endsWith("#expense") && new URL(a.href).pathname === window.location.pathname) {
        ev.preventDefault();
        history.replaceState(null, "", "#expense");
        a.closest("details")?.removeAttribute("open");
        show();
      }
    };
    const id = setTimeout(check, 0);
    window.addEventListener("hashchange", check);
    document.addEventListener("click", onClick, true);
    return () => { clearTimeout(id); window.removeEventListener("hashchange", check); document.removeEventListener("click", onClick, true); };
  }, [show]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const close = () => {
    setOpen(false);
    if (window.location.hash === "#expense") history.replaceState(null, "", window.location.pathname + window.location.search);
  };

  return (
    <>
      <section id="expense" ref={ref} aria-labelledby="expense-h" hidden={!open} className="scroll-mt-4 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="expense-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">Record an expense</h2>
            <p className="text-sm text-ink2">
              {setup.country !== "lk"
                ? `Money you've already paid by bank, card or cash. It goes into Going out as paid, in the ${setup.country === "us" ? "Schedule C line" : "HMRC category"} your accountant files.`
                : "Money you've already paid by bank transfer, cheque or cash. It goes into Going out as paid, in the category your tax practitioner uses for your return."}
            </p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface hover:bg-ink/[0.11]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        {open && <ExpenseForm setup={setup} suppliers={suppliers} supplierCurrencies={supplierCurrencies} autoFocus onSaved={(m) => { setToast(m); close(); }} />}
      </section>
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lg">
          <span className="flex size-6 items-center justify-center rounded-full bg-violet text-ink"><Icon d={ICONS.check} size={14} strokeWidth={3} /></span>
          {toast}
        </div>
      )}
    </>
  );
}
