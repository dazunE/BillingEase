"use client";

import { useState } from "react";

const FAQ = [
  {
    q: "Do I need to know accounting?",
    a: "No. You work with three numbers and plain words. Proper double-entry books are kept underneath, and they’re there for your accountant (or for you) whenever you want to look.",
  },
  {
    q: "Is the free plan really free?",
    a: "Yes, with no time limit and no card needed. We make money from Pro subscriptions and from the small fee on payments your customers make online.",
  },
  {
    q: "Is it safe to connect my bank?",
    a: "The connection is read-only, through a trusted bank connection provider. We never see or store your bank password, and we can’t move money out of your account.",
  },
  {
    q: "What doesn’t BillingEase do?",
    a: "It isn’t built for inventory tracking or for businesses billing in several currencies. If those are central to your work, a different tool will serve you better today.",
  },
];

/** One-at-a-time FAQ accordion. */
export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="flex min-w-0 flex-[999_1_520px] flex-col border-t border-line">
      {FAQ.map((f, i) => {
        const on = open === i;
        return (
          <div key={f.q} className="border-b border-line">
            <h3>
              <button
                type="button"
                id={`faq-b${i}`}
                aria-expanded={on}
                aria-controls={`faq-p${i}`}
                onClick={() => setOpen(on ? -1 : i)}
                className="flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left text-lg font-semibold"
              >
                <span>{f.q}</span>
                <span className={`flex size-8 flex-none items-center justify-center rounded-full ${on ? "bg-violet" : "bg-ink/[0.07]"}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                    <path d={on ? "M5 12h14" : "M12 5v14M5 12h14"} />
                  </svg>
                </span>
              </button>
            </h3>
            <p id={`faq-p${i}`} role="region" aria-labelledby={`faq-b${i}`} hidden={!on} className="pb-[22px] pr-12 text-base leading-relaxed text-ink2">
              {f.a}
            </p>
          </div>
        );
      })}
    </div>
  );
}
