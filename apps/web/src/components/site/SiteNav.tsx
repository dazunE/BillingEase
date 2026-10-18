"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandMark, cx } from "@/components/ui";
import { money, signUpHref, type SiteCountry } from "@/content/site/country";
import { NAV, ROUTES, routeText, type IconTone, type SiteRoute } from "@/content/site/routes";
import { CountrySwitch } from "./CountrySwitch";
import { useSiteCountry } from "./SiteCountry";
import s from "./site.module.css";

const TONE: Record<IconTone, { bg: string; ink: string }> = {
  violet: { bg: "#EEE8FF", ink: "#18161F" },
  orange: { bg: "#FDE6D6", ink: "#18161F" },
  dark: { bg: "#18161F", ink: "#B9A3FF" },
  grey: { bg: "#EFEDF3", ink: "#18161F" },
};

function isCurrent(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
}

function MenuIcon({ r, size = 40 }: { r: SiteRoute; size?: number }) {
  const t = TONE[r.tone];
  return (
    <span className="flex flex-none items-center justify-center rounded-xl" style={{ width: size, height: size, background: t.bg }}>
      <svg width={size / 2} height={size / 2} viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={r.icon} />
      </svg>
    </span>
  );
}

function Arrow({ size = 14, color = "#18161F" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** The sample numbers in the Product menu's "whole idea" card. Illustrative. */
const STRIP: Record<SiteCountry, [number, number, number]> = { uk: [28400, 9180, 16260], lk: [5280000, 2830000, 2040000] };

const ASIDE: Record<string, { kicker: string; title: (c: SiteCountry) => string; body: (c: SiteCountry) => string; cta: string; href: string; bg: string }> = {
  "Who it’s for": {
    kicker: "ONE PRODUCT, TWO COUNTRIES",
    title: (c) => (c === "uk" ? "Built for the UK tax year and HMRC." : "Built for Sri Lanka’s IRD rules."),
    body: (c) => (c === "uk" ? "Pounds, MTD quarters and HMRC categories. Running a business in Sri Lanka? Switch country." : "Rupees, VAT and SSCL, EPF and ETF. Running a business in the UK? Switch country."),
    cta: "What changes by country",
    href: ROUTES.countries.href,
    bg: "#FDE6D6",
  },
  Resources: {
    kicker: "MOVING OVER?",
    title: () => "Bring your spreadsheet with you.",
    body: () => "Customers, suppliers and opening balances, and what to do on day one.",
    cta: "How switching works",
    href: ROUTES.switch.href,
    bg: "#EEE8FF",
  },
  Company: {
    kicker: "TALK TO A PERSON",
    title: (c) => (c === "uk" ? "Setting up a practice?" : "Setting up your practice?"),
    body: (c) => (c === "uk" ? "Tell us about your clients and we’ll show you the practice workbench." : "Tell us about your clients and we’ll show you how it works with TaxWise.lk."),
    cta: "Contact us",
    href: ROUTES.contact.href,
    bg: "#EFEDF3",
  },
};

/**
 * The marketing site header (prototype SiteNav.dc.html): logo, four dropdown
 * menus and Pricing, the country switch, Sign in and Start free; a full-height
 * menu under 900px. Rendered by the (site) layout; pages don't use it directly.
 */
export function SiteNav({ signedIn = false }: { signedIn?: boolean }) {
  const path = usePathname() || "/";
  const { country } = useSiteCountry();
  const [open, setOpen] = useState<number | null>(null);
  const [mob, setMob] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const header = useRef<HTMLElement>(null);
  const mobBtn = useRef<HTMLButtonElement>(null);
  const mobClose = useRef<HTMLButtonElement>(null);

  const lock = (on: boolean) => {
    document.documentElement.style.overflow = on ? "hidden" : "";
  };
  const closeAll = useCallback(() => {
    lock(false);
    setOpen(null);
    setMob(false);
  }, []);
  const closeMob = useCallback((refocus: boolean) => {
    lock(false);
    setMob(false);
    if (refocus) setTimeout(() => mobBtn.current?.focus(), 0);
  }, []);

  // Close menus on navigation.
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setOpen(null);
    setMob(false);
  }
  useEffect(() => lock(false), [path]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (header.current && !header.current.contains(e.target as Node)) setOpen(null);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mob) return closeMob(true);
      if (open != null) {
        const i = open;
        setOpen(null);
        document.getElementById(`sn-trig-${i}`)?.focus();
      }
    };
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onResize = () => {
      if (mob && window.innerWidth >= 900) closeMob(false);
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onEsc);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [mob, open, closeMob]);

  useEffect(() => {
    if (mob) mobClose.current?.focus();
  }, [mob]);

  const focusPanel = (i: number, last = false) =>
    setTimeout(() => {
      const links = document.querySelectorAll<HTMLAnchorElement>(`#sn-panel-${i} a`);
      (last ? links[links.length - 1] : links[0])?.focus();
    }, 0);

  const onPanelKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const panel = (e.target as HTMLElement).closest("[data-panel]");
    if (!panel) return;
    const links = Array.from(panel.querySelectorAll<HTMLAnchorElement>("a"));
    const at = links.indexOf(e.target as HTMLAnchorElement);
    if (at < 0) return;
    e.preventDefault();
    links[(at + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length]?.focus();
  };

  const onBlur = (e: React.FocusEvent) => {
    const to = e.relatedTarget as Node | null;
    if (open != null && to && header.current && !header.current.contains(to)) setOpen(null);
  };

  const solid = scrolled || open != null;
  const startHref = signUpHref(country);
  const g = open != null ? NAV[open] : null;
  const panelGroup = g && "items" in g ? g : null;
  const isProduct = open === 0;
  const aside = panelGroup && !isProduct ? ASIDE[panelGroup.label] : undefined;
  const cols = panelGroup && (panelGroup.items.length > 4 || aside) ? "grid-cols-2" : "grid-cols-1";
  const width = isProduct ? 820 : aside ? 760 : 420;
  const [inN, outN, keepN] = STRIP[country];

  return (
    <>
      <header
        ref={header}
        onBlur={onBlur}
        onKeyDown={onPanelKey}
        className={cx(s.hd, "sticky top-0 z-50 border-b text-ink backdrop-blur-[10px] backdrop-saturate-[1.4]")}
        style={{
          background: solid ? "rgba(255,255,255,0.92)" : "#F7F6F9",
          borderColor: solid ? "#E2DFE8" : "transparent",
          boxShadow: solid ? "0 6px 24px rgba(24,22,31,0.06)" : "none",
        }}
      >
        <nav aria-label="Main" className="relative mx-auto box-border flex max-w-[1200px] items-center gap-x-[clamp(8px,2vw,24px)] gap-y-3 px-[clamp(16px,4vw,40px)] py-3">
          <Link href="/" aria-label="BillingEase home" className="flex flex-none items-center gap-2.5 rounded-xl">
            <BrandMark size={32} />
            <span className="font-display text-[19px] font-bold tracking-[-0.02em]">BillingEase</span>
          </Link>

          <ul className="ml-[clamp(4px,1.5vw,20px)] flex items-center gap-0.5 max-[899px]:hidden">
            {NAV.map((grp, i) => {
              if ("href" in grp) {
                const cur = isCurrent(path, grp.href);
                return (
                  <li key={grp.label}>
                    <Link href={grp.href} aria-current={cur ? "page" : undefined} className="relative inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3.5 text-[15px] font-semibold hover:bg-ink/[0.06]">
                      {grp.label}
                      {cur && <span aria-hidden className="absolute inset-x-3.5 bottom-[5px] h-0.5 rounded-sm bg-coming" />}
                    </Link>
                  </li>
                );
              }
              const on = open === i;
              const cur = grp.items.some((r) => isCurrent(path, r.href));
              return (
                <li key={grp.label}>
                  <button
                    type="button"
                    id={`sn-trig-${i}`}
                    aria-expanded={on}
                    aria-controls={`sn-panel-${i}`}
                    onClick={() => setOpen(on ? null : i)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setOpen(i);
                        focusPanel(i);
                      }
                      if (e.key === "ArrowUp" && on) {
                        e.preventDefault();
                        focusPanel(i, true);
                      }
                    }}
                    className={cx("relative inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[15px] font-semibold hover:bg-ink/[0.06]", on && "bg-ink/[0.07]")}
                  >
                    {grp.label}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#47444F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cx("transition-transform duration-200", on && "rotate-180")}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                    {cur && (
                      <>
                        <span aria-hidden className="absolute bottom-[5px] left-3.5 right-[34px] h-0.5 rounded-sm bg-coming" />
                        <span className="sr-only">(current section)</span>
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="ml-auto flex items-center gap-1.5">
            <CountrySwitch variant="menu" className="max-[899px]:hidden" />
            {signedIn ? (
              <Link href="/app" className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full bg-ink px-5 text-[15px] font-bold text-white hover:bg-black max-[899px]:min-h-10 max-[899px]:px-4 max-[899px]:text-sm">
                Open BillingEase
              </Link>
            ) : (
              <>
                <Link href={ROUTES.signIn.href} className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3.5 text-[15px] font-semibold hover:bg-ink/[0.06] max-[899px]:hidden">
                  Sign in
                </Link>
                <Link href={startHref} className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full bg-violet px-5 text-[15px] font-bold transition-colors hover:bg-[#a98ffb] max-[899px]:hidden">
                  Start free
                  <Arrow size={16} />
                </Link>
                <Link href={startHref} className="hidden min-h-10 items-center whitespace-nowrap rounded-full bg-violet px-4 text-sm font-bold max-[899px]:inline-flex max-[360px]:hidden">
                  Start free
                </Link>
              </>
            )}
            <button
              ref={mobBtn}
              type="button"
              aria-label="Open menu"
              aria-expanded={mob}
              aria-controls="sn-mobile"
              onClick={() => {
                lock(true);
                setOpen(null);
                setMob(true);
              }}
              className="hidden size-11 flex-none items-center justify-center rounded-full border border-line bg-white max-[899px]:flex"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            </button>
          </div>

          {panelGroup && open != null && (
            <div
              id={`sn-panel-${open}`}
              data-panel
              role="region"
              aria-label={panelGroup.label}
              className={cx(s.panel, "absolute left-1/2 top-[calc(100%-2px)] box-border flex max-w-[calc(100vw-32px)] items-stretch gap-3 rounded-3xl border border-line bg-white p-3 shadow-[0_24px_60px_rgba(24,22,31,0.16)] max-[899px]:hidden")}
              style={{ width }}
            >
              <ul className={cx("grid flex-auto content-start gap-0.5", cols)}>
                {panelGroup.items.map((r) => {
                  const t = routeText(r, country);
                  const cur = isCurrent(path, r.href);
                  return (
                    <li key={r.href}>
                      <Link href={r.href} onClick={closeAll} aria-current={cur ? "page" : undefined} className={cx("flex items-start gap-3.5 rounded-2xl p-3", cur ? "bg-tint" : "hover:bg-bg")}>
                        <MenuIcon r={r} />
                        <span className="flex min-w-0 flex-col gap-0.5 pt-px">
                          <span className="text-[15px] font-bold">{t.label}</span>
                          <span className="text-[13px] leading-[1.4] text-muted">{t.hint}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {isProduct && (
                <Link href={ROUTES.features.href} onClick={closeAll} className={cx(s.feat, "box-border flex flex-[0_0_248px] flex-col gap-3.5 rounded-[18px] bg-ink p-[18px] text-white")}>
                  <span className="text-xs font-bold tracking-[0.04em] text-violet">THE WHOLE IDEA</span>
                  <span className="flex flex-col gap-1.5">
                    {(
                      [
                        ["Coming in", inN, "#7A5AF8", "#FFFFFF", "0s"],
                        ["Going out", outN, "#E0752D", "#FFFFFF", ".3s"],
                        ["Yours to keep", keepN, "#18161F", "#B9A3FF", ".6s"],
                      ] as const
                    ).map(([l, v, dot, bg, d]) => (
                      <span key={l} className={cx(s.strip, "flex items-center justify-between gap-2 rounded-xl px-3 py-[9px] text-[12.5px] font-semibold text-ink")} style={{ background: bg, animationDelay: d }}>
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full" style={{ background: dot }} />
                          {l}
                        </span>
                        <span className="font-display text-sm font-bold">{money(v, country)}</span>
                      </span>
                    ))}
                  </span>
                  <span className="text-[13.5px] leading-[1.45] text-tint">Everything BillingEase does sits behind one of three numbers.</span>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-[13.5px] font-bold">
                    See all features
                    <Arrow color="#FFFFFF" />
                  </span>
                </Link>
              )}
              {aside && (
                <Link href={aside.href} onClick={closeAll} className={cx(s.feat, "box-border flex flex-[0_0_220px] flex-col gap-2.5 rounded-[18px] p-[18px] text-ink")} style={{ background: aside.bg }}>
                  <span className="text-xs font-bold tracking-[0.04em] text-ink2">{aside.kicker}</span>
                  <span className="font-display text-[17px] font-bold leading-[1.25] tracking-[-0.01em]">{aside.title(country)}</span>
                  <span className="text-[13px] leading-[1.45] text-ink2">{aside.body(country)}</span>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-[13.5px] font-bold">
                    {aside.cta}
                    <Arrow />
                  </span>
                </Link>
              )}
            </div>
          )}
        </nav>
      </header>

      {mob && (
        <div id="sn-mobile" role="dialog" aria-modal="true" aria-label="Menu" className={cx(s.mob, "fixed inset-0 z-[90] flex h-dvh flex-col bg-bg text-ink min-[900px]:hidden")}>
          <div className="flex flex-none items-center justify-between gap-3 border-b border-line px-4 py-3">
            <Link href="/" onClick={closeAll} className="flex items-center gap-2.5">
              <BrandMark size={32} />
              <span className="font-display text-[19px] font-bold tracking-[-0.02em]">BillingEase</span>
            </Link>
            <button ref={mobClose} type="button" aria-label="Close menu" onClick={() => closeMob(true)} className="flex size-11 items-center justify-center rounded-full border border-line bg-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="flex flex-auto flex-col gap-[18px] overflow-y-auto px-4 pb-6 pt-2">
            <section className="flex flex-col gap-2 pt-3">
              <h2 className="px-3 text-xs font-bold uppercase tracking-[0.06em] text-muted">Your country</h2>
              <CountrySwitch variant="segmented" className="self-start" />
            </section>
            {NAV.map((grp) => {
              const items = "items" in grp ? grp.items : [grp.route];
              const label = "items" in grp ? grp.label : "Plans";
              return (
                <section key={grp.label} className="flex flex-col gap-0.5">
                  <h2 className="mx-0 mb-1 mt-3 px-3 text-xs font-bold uppercase tracking-[0.06em] text-muted">{label}</h2>
                  {items.map((r) => {
                    const t = routeText(r, country);
                    const cur = isCurrent(path, r.href);
                    return (
                      <Link key={r.href} href={r.href} onClick={closeAll} aria-current={cur ? "page" : undefined} className={cx("flex min-h-14 items-center gap-3 rounded-[14px] px-3 py-1.5", cur ? "bg-tint" : "hover:bg-white")}>
                        <MenuIcon r={r} size={36} />
                        <span className="flex min-w-0 flex-col">
                          <span className="text-base font-bold">{t.label}</span>
                          <span className="text-[13px] text-muted">{t.hint}</span>
                        </span>
                      </Link>
                    );
                  })}
                </section>
              );
            })}
          </div>
          <div className="flex flex-none gap-2.5 border-t border-line bg-white px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
            {signedIn ? (
              <Link href="/app" onClick={closeAll} className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-full bg-ink text-base font-bold text-white">
                Open BillingEase
              </Link>
            ) : (
              <>
                <Link href={ROUTES.signIn.href} onClick={closeAll} className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-full border border-input text-base font-bold">
                  Sign in
                </Link>
                <Link href={startHref} onClick={closeAll} className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-full bg-violet text-base font-bold">
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
