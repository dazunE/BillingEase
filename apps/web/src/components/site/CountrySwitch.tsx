"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cx } from "@/components/ui";
import { COUNTRY_META, SITE_COUNTRIES, type SiteCountry } from "@/content/site/country";
import { useSiteCountry } from "./SiteCountry";

function Flag({ c, size = 18 }: { c: SiteCountry; size?: number }) {
  // Simple drawn badges rather than flag emoji (consistent everywhere, no OS dependency).
  return (
    <span
      aria-hidden
      className={cx("inline-flex flex-none items-center justify-center rounded-full font-display font-bold leading-none", c === "uk" ? "bg-tint text-ink" : "bg-going-tint text-ink")}
      style={{ width: size + 6, height: size + 6, fontSize: c === "uk" ? 12 : 10 }}
    >
      {COUNTRY_META[c].sym}
    </span>
  );
}

/**
 * The UK / Sri Lanka switch. Sets the `be_site_country` cookie and refreshes,
 * so server components re-render with getSiteCountry().
 *
 * - `variant="menu"`: a compact button with a two-item menu (the header).
 * - `variant="segmented"`: both options side by side (footer, mobile menu, pages).
 * - `tone="dark"` for dark backgrounds; `short` for "UK" / "Sri Lanka" labels.
 */
export function CountrySwitch({
  variant = "segmented",
  tone = "light",
  short = false,
  className,
}: {
  variant?: "menu" | "segmented";
  tone?: "light" | "dark";
  /** Segmented only: "UK" / "Sri Lanka" instead of the full names. */
  short?: boolean;
  className?: string;
}) {
  const { country, setCountry } = useSiteCountry();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        wrap.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (variant === "segmented") {
    return (
      <div role="group" aria-label="Country" className={cx("inline-flex gap-1 rounded-full p-1", tone === "dark" ? "bg-white/10" : "bg-surface", className)}>
        {SITE_COUNTRIES.map((c) => {
          const on = c === country;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => !on && setCountry(c)}
              className={cx(
                "inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full pl-1.5 pr-4 text-sm font-semibold transition-colors",
                on ? (tone === "dark" ? "bg-white text-ink" : "bg-ink text-white") : tone === "dark" ? "text-white hover:bg-white/10" : "text-ink hover:bg-white",
              )}
            >
              <Flag c={c} />
              {short ? COUNTRY_META[c].short : COUNTRY_META[c].name}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={wrap} className={cx("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Country: ${COUNTRY_META[country].name}. Change country`}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full pl-1.5 pr-3 text-[15px] font-semibold hover:bg-ink/[0.06]"
      >
        <Flag c={country} />
        <span>{country === "uk" ? "UK" : "LK"}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#47444F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cx("transition-transform", open && "rotate-180")}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div id={id} className="absolute right-0 top-[calc(100%+6px)] z-[60] w-[248px] rounded-[20px] border border-line bg-white p-2 shadow-[0_24px_60px_rgba(24,22,31,0.16)]">
          <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-[0.06em] text-muted">Your country</p>
          <ul className="flex flex-col gap-0.5">
            {SITE_COUNTRIES.map((c) => {
              const on = c === country;
              return (
                <li key={c}>
                  <button
                    type="button"
                    aria-current={on ? "true" : undefined}
                    onClick={() => {
                      setOpen(false);
                      if (!on) setCountry(c);
                    }}
                    className={cx("flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left", on ? "bg-tint" : "hover:bg-bg")}
                  >
                    <Flag c={c} size={22} />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[15px] font-bold">{COUNTRY_META[c].name}</span>
                      <span className="text-[13px] text-muted">
                        Prices in {COUNTRY_META[c].currency}, {COUNTRY_META[c].yearWord} from {c === "uk" ? "6 April" : "1 April"}
                      </span>
                    </span>
                    {on && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="ml-auto flex-none">
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
