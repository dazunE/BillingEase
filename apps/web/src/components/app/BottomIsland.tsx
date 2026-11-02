"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/components/ui";

/**
 * The bottom island (prototype AppHeader): one dark pill fixed to the foot of every signed-in
 * screen. On Home it shows the six sections; inside a section it becomes that section's pages,
 * with ← to see the sections again. Badges are live counts passed in from the layout.
 */

type SectionKey = "home" | "in" | "out" | "keep" | "acct" | "biz";
type Page = { href: string; label: string; badge?: number; badgeLabel?: string; match?: string[] };
type Section = { key: SectionKey; label: string; short?: string; href: string; icon: string; on: string; chip: string; badge?: number; badgeLabel?: string };

export type IslandCounts = { lateInvoices: number; billsDueSoon: number; toCheck: number };

const ICON: Record<SectionKey, string> = {
  home: "M4 11 12 4l8 7v9h-5v-6H9v6H4z",
  in: "M12 19V5M5 12l7-7 7 7",
  out: "M12 5v14M5 12l7 7 7-7",
  keep: "M4 20V10M10 20V4M16 20v-7M2 20h20",
  acct: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1",
  biz: "M3 9l2-5h14l2 5M4 9v11h16V9M3 9h18M9 20v-6h6v6",
};

/** Which section a path belongs to. */
function sectionOf(path: string): SectionKey {
  if (path.startsWith("/app/in")) return "in";
  if (path.startsWith("/app/out")) return "out";
  if (path.startsWith("/app/keep") || path.startsWith("/app/statements") || path.startsWith("/app/check")) return "keep";
  if (path.startsWith("/app/ask") || path.startsWith("/app/accountant")) return "acct";
  if (path.startsWith("/app/settings")) return "biz";
  return "home";
}

const startsWith = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + "/");

export function BottomIsland({ country, vatRegistered, ssclRegistered = false, landlord = false, counts }: { country: "uk" | "lk" | "us"; vatRegistered: boolean; ssclRegistered?: boolean; landlord?: boolean; counts: IslandCounts }) {
  const path = usePathname() ?? "/app";
  const current = sectionOf(path);
  // ← shows the sections on this page only: the next page shows its own section again.
  const [allOn, setAllOn] = useState<string | null>(null);
  const showAll = allOn === path;
  const rowRef = useRef<HTMLDivElement>(null);
  const lk = country === "lk";


  const sections: Section[] = [
    { key: "home", label: "Home", href: "/app", icon: ICON.home, on: "bg-white text-ink", chip: "bg-[#2C2935] text-white" },
    { key: "in", label: "Coming in", href: "/app/in", icon: ICON.in, on: "bg-violet text-ink", chip: "bg-violet text-ink", badge: counts.lateInvoices, badgeLabel: `${counts.lateInvoices} late invoices` },
    { key: "out", label: "Going out", href: "/app/out", icon: ICON.out, on: "bg-going text-ink", chip: "bg-going text-ink", badge: counts.billsDueSoon, badgeLabel: `${counts.billsDueSoon} to pay within a week` },
    { key: "keep", label: "Yours to keep", short: "To keep", href: "/app/keep", icon: ICON.keep, on: "bg-white text-ink", chip: "bg-[#2C2935] text-violet", badge: counts.toCheck, badgeLabel: `${counts.toCheck} waiting for you to check` },
    { key: "acct", label: lk ? "Practitioner" : "Accountant", short: lk ? "Tax help" : "Accountant", href: "/app/accountant", icon: ICON.acct, on: "bg-white text-ink", chip: "bg-[#2C2935] text-white" },
    { key: "biz", label: "Business", href: "/app/settings/business", icon: ICON.biz, on: "bg-white text-ink", chip: "bg-[#2C2935] text-white" },
  ];

  const pages: Record<SectionKey, Page[]> = {
    home: [],
    in: [
      { href: "/app/in/invoices", label: lk && vatRegistered ? "Tax invoices" : "Invoices", badge: counts.lateInvoices, badgeLabel: `${counts.lateInvoices} late` },
      { href: "/app/in/quotes", label: "Quotes" },
      { href: "/app/in/repeating", label: "Repeating" },
      { href: "/app/in/customers", label: "Customers" },
      { href: "/app/in/prices", label: "Products and services" },
    ],
    out: [
      { href: "/app/out/bills", label: "Bills" },
      { href: "/app/out/monthly", label: "Every month" },
      { href: "/app/out/suppliers", label: "Suppliers" },
      { href: "/app/out/payroll", label: country === "uk" ? "Payroll records" : "Payroll" },
      ...(country === "uk" ? [{ href: "/app/out/mileage", label: "Mileage" }] : []),
      ...(country === "uk" && landlord ? [{ href: "/app/out/properties", label: "Properties" }] : []),
    ],
    keep: [
      ...(country === "uk" ? [{ href: "/app/keep/quarters", label: "Quarters" }] : []),
      ...(country === "lk" && (vatRegistered || ssclRegistered) ? [{ href: "/app/keep/tax-periods", label: "VAT and SSCL" }] : country === "uk" && vatRegistered ? [{ href: "/app/keep/tax-periods", label: "VAT summary" }] : []),
      { href: "/app/keep/reports", label: "Reports" },
      { href: "/app/keep/year-end", label: "Tax and year-end" },
      { href: "/app/statements", label: "Bank check" },
      { href: "/app/keep/categories", label: "Categories" },
      { href: "/app/check", label: "For you to check", badge: counts.toCheck, badgeLabel: `${counts.toCheck} waiting` },
    ],
    acct: [
      { href: "/app/accountant", label: lk ? "Your practitioner" : "Your accountant" },
      { href: "/app/accountant/view", label: "What they see" },
      { href: "/app/ask", label: "Ask" },
    ],
    biz: [
      { href: "/app/settings/business", label: "Profile" },
      { href: "/app/settings/branding", label: "Invoice branding" },
      { href: "/app/settings/people", label: "People and access" },
      { href: "/app/settings/security", label: "Security and data", match: ["/app/settings/sign-in"] },
      { href: "/app/settings/ai", label: "AI and agents" },
      { href: "/app/settings/apps", label: "Apps and API" },
    ],
  };

  const top = current === "home" || showAll;
  const sec = sections.find((s) => s.key === current)!;
  const onOverview = path === sec.href;
  const items = pages[current];

  // On a narrow screen the row scrolls sideways: bring the lit page into view.
  useEffect(() => {
    const row = rowRef.current;
    const lit = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (row && lit && row.scrollWidth > row.clientWidth) row.scrollLeft = Math.max(0, lit.offsetLeft - (row.clientWidth - lit.offsetWidth) / 2);
  }, [path, top]);

  const off = "text-[#D9D6E0] hover:bg-[#2C2935] hover:text-white";
  const item = "inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold no-underline transition-colors max-sm:px-3 max-sm:text-[13px]";
  const badge = (n: number | undefined, label: string | undefined, lit: boolean, tone: string) =>
    n ? (
      <span aria-label={label} className={cx("inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11.5px] font-bold tabular-nums", lit ? "bg-ink text-white" : tone)}>
        {n > 99 ? "99+" : n}
      </span>
    ) : null;

  return (
    <nav
      aria-label={top ? "Sections" : `${sec.label} pages`}
      className={cx("fixed bottom-[max(16px,env(safe-area-inset-bottom))] left-1/2 z-40 box-border w-max max-w-[calc(100%-24px)] -translate-x-1/2 rounded-full border border-[#2C2935] bg-ink font-sans shadow-[0_18px_44px_rgba(24,22,31,0.30),0_2px_6px_rgba(24,22,31,0.18)]", top && "max-sm:w-[calc(100%-24px)]")}
    >
      {top ? (
        <div key=")top" ref={rowRef} className="be-island-row flex items-center gap-1 overflow-x-auto rounded-full p-1.5 max-sm:gap-0">
          {sections.map((s) => {
            const lit = s.key === current;
            return (
              <Link
                key={s.key}
                href={s.href}
                aria-current={lit ? "page" : undefined}
                className={cx(item, lit ? s.on : off, "max-sm:relative max-sm:min-w-0 max-sm:flex-1 max-sm:basis-0 max-sm:flex-col max-sm:justify-center max-sm:gap-0.5 max-sm:whitespace-normal max-sm:px-0.5 max-sm:py-1.5 max-sm:text-center max-sm:text-[10px] max-sm:leading-[1.15]")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0"><path d={s.icon} /></svg>
                <span className="max-sm:hidden">{s.label}</span>
                <span className="sm:hidden">{s.short ?? s.label}</span>
                {s.badge ? <span className="max-sm:absolute max-sm:right-1.5 max-sm:top-0.5">{badge(s.badge, s.badgeLabel, lit, s.key === "out" ? "bg-going text-ink" : "bg-violet text-ink")}</span> : null}
              </Link>
            );
          })}
        </div>
      ) : (
        <div key={current} ref={rowRef} className="be-island-row flex items-center gap-1 overflow-x-auto rounded-full p-1.5">
          <button type="button" onClick={() => setAllOn(path)} aria-label="Show all sections" title="All sections" className="sticky left-0 z-10 inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#2C2935] text-white hover:bg-[#3A3644]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          </button>
          <Link href={sec.href} aria-current={onOverview ? "page" : undefined} className={cx(item, sec.chip, "font-display font-bold", onOverview && "shadow-[0_0_0_2px_#FFFFFF]")}>
            <span aria-hidden className={cx("size-2 shrink-0 rounded-full", current === "in" || current === "out" ? "bg-ink" : current === "keep" ? "bg-violet" : "bg-white")} />
            {sec.label}
          </Link>
          <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-[#3A3644]" />
          {items.map((p) => {
            // The most specific page that matches is the lit one (/app/accountant/view isn't also /app/accountant).
            const matches = (x: Page) => startsWith(path, x.href) || (x.match ?? []).some((m) => startsWith(path, m));
            const best = items.filter(matches).sort((a, c) => c.href.length - a.href.length)[0];
            const lit = best === p;
            return (
              <Link key={p.href} href={p.href} aria-current={lit ? "page" : undefined} className={cx(item, lit ? "bg-white text-ink" : off)}>
                <span>{p.label}</span>
                {badge(p.badge, p.badgeLabel, lit, "bg-[#3A3644] text-white")}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
