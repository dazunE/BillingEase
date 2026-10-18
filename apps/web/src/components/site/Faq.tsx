"use client";

import { useId, useState, type ReactNode } from "react";
import { cx } from "@/components/ui";

/**
 * FAQ as an accessible disclosure list: each question is a button with
 * aria-expanded/aria-controls inside an h3; one answer open at a time.
 * `defaultOpen` is the index open on load (-1 for none).
 */
export function Faq({ items, defaultOpen = 0, className }: { items: { q: string; a: ReactNode }[]; defaultOpen?: number; className?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  const base = useId();
  return (
    <div className={cx("flex min-w-0 flex-col border-t border-line", className)}>
      {items.map((f, i) => {
        const on = open === i;
        const b = `${base}-b${i}`;
        const p = `${base}-p${i}`;
        return (
          <div key={f.q} className="border-b border-line">
            <h3>
              <button
                type="button"
                id={b}
                aria-expanded={on}
                aria-controls={p}
                onClick={() => setOpen(on ? -1 : i)}
                className="flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left text-lg font-semibold"
              >
                <span>{f.q}</span>
                <span aria-hidden className={cx("flex size-8 flex-none items-center justify-center rounded-full transition-colors", on ? "bg-violet" : "bg-ink/[0.07]")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.6" strokeLinecap="round">
                    <path d={on ? "M5 12h14" : "M12 5v14M5 12h14"} />
                  </svg>
                </span>
              </button>
            </h3>
            <div id={p} role="region" aria-labelledby={b} hidden={!on} className="pb-[22px] pr-12 text-base leading-relaxed text-ink2 max-[640px]:pr-0">
              {f.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
