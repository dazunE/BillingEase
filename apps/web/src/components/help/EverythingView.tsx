"use client";

import Link from "next/link";
import { useState } from "react";
import { cx, Icon, ICONS } from "@/components/ui";
import { COMPANY } from "@/content/site/company";

type Need = "vat" | "landlord" | "staff" | "practice";
type Group = "in" | "out" | "keep" | "biz";
export type Feature = { g: Group; name: string; formal: string; text: string; href: string; tags: Need[]; kw: string; need?: Need };
export type Filter = { id: "all" | Need; label: string };

const FILTER_ICON: Record<Filter["id"], string> = {
  all: "M4 6h16M4 12h16M4 18h16",
  vat: "M19 5 5 19M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M16.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3",
  staff: ICONS.people,
  practice: "M4 5h16v11H8l-4 4zM8 9h8M8 12h5",
  landlord: "M4 11 12 4l8 7v9h-5v-6H9v6H4z",
};

/** Where each "set it up" goes. */
const TURN_ON: Record<Need, string> = { vat: "/app/settings/business", landlord: "/app/settings/business", staff: "/app/out/payroll", practice: "/app/accountant" };

/**
 * The moving parts of Everything BillingEase does: search, the "show features for" filter that
 * highlights what matters for a kind of business, and the four columns.
 */
export function EverythingView({ features, filters, on, noun, biz, profileLine, keepSub, searchHint, tryWord }: {
  features: Feature[]; filters: Filter[]; on: Record<Need, boolean>; noun: string; biz: { name: string; initials: string; country: string };
  profileLine: string; keepSub: string; searchHint: string; tryWord: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter["id"]>("all");
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matchQ = (f: Feature) => words.every((w) => `${f.name} ${f.formal} ${f.text} ${f.kw}`.toLowerCase().includes(w));
  const filterLabel = filters.find((f) => f.id === filter)?.label ?? "";
  const why: Record<Need, string> = { vat: "Not VAT registered ·", landlord: "Not set up as a landlord ·", staff: "No employees yet ·", practice: `No ${noun} linked ·` };

  const COLS: { g: Group; name: string; sub: string; open: string; href: string; dot: string; rule: string }[] = [
    { g: "in", name: "Coming in", sub: "Money customers pay you.", open: "Open Coming in", href: "/app/in", dot: "rounded-full bg-coming", rule: "border-coming" },
    { g: "out", name: "Going out", sub: "What you spend to run the business.", open: "Open Going out", href: "/app/out", dot: "rounded-full bg-going", rule: "border-going" },
    { g: "keep", name: "Yours to keep", sub: keepSub, open: "Open Yours to keep", href: "/app/keep", dot: "rounded-full border-2 border-violet bg-ink", rule: "border-ink" },
    { g: "biz", name: "Your business", sub: `Settings, your ${noun} and your account. Also in the menu under your initials.`, open: "Business profile", href: "/app/settings/business", dot: "rounded-[3px] border-2 border-ink bg-white", rule: "border-input" },
  ];

  let shown = 0, lit = 0, off = 0;
  const cols = COLS.map((c) => {
    const items = features.filter((f) => f.g === c.g && matchQ(f)).map((f) => {
      const isOff = !!f.need && !on[f.need];
      const hl = filter !== "all" && f.tags.includes(filter);
      shown++; if (hl) lit++; if (isOff) off++;
      return { ...f, isOff, hl };
    });
    return { ...c, items };
  });
  let status = !shown ? `No features match “${query.trim()}”` : words.length ? `${shown} of ${features.length} features match “${query.trim()}”` : `${features.length} features in four places`;
  if (shown && filter !== "all") status += ` · ${lit} highlighted`;
  if (shown && off) status += ` · ${off} not set up yet`;

  return (
    <>
      <section aria-labelledby="ev-h" className="flex flex-col gap-[18px]">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-2">
            <h1 id="ev-h" className="font-display text-[clamp(30px,4vw,44px)] font-bold leading-[1.1] tracking-[-0.03em]">Everything BillingEase does</h1>
            <p className="max-w-[680px] text-base leading-normal text-ink2">You won&apos;t need most of this on day one. Every feature lives behind one of your three numbers, or under Your business. What you see is set by your country and how you work.</p>
          </div>
          <div className="flex min-w-0 flex-[0_1_auto] flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">Showing it for</span>
            <span className="box-border inline-flex min-h-11 max-w-full items-center gap-2.5 rounded-full border border-line bg-white py-0 pl-1.5 pr-3.5 text-[15px] font-semibold">
              <span aria-hidden className="flex size-8 flex-none items-center justify-center rounded-full bg-tint text-xs font-bold">{biz.initials}</span>
              <span className="truncate">{biz.name}</span>
              <span className="flex-none rounded-full bg-surface px-2 text-[11.5px] font-bold leading-[18px]">{biz.country}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(16px,2.4vw,22px)]">
          <label className="flex min-h-[52px] min-w-0 items-center gap-2.5 rounded-full border border-input bg-white pl-[18px] pr-2 focus-within:border-ink">
            <Icon d={ICONS.search} className="shrink-0 text-ink2" />
            <span className="sr-only">Search features</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchHint}
              className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted/80 [&::-webkit-search-cancel-button]:appearance-none" />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface">
                <Icon d="M6 6l12 12M18 6 6 18" size={16} strokeWidth={2.4} />
              </button>
            )}
          </label>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <span className="mr-0.5 text-sm font-semibold text-ink2">Show features for:</span>
            <div role="group" aria-label="Show features for" className="flex flex-wrap gap-1.5">
              {filters.map((f) => {
                const o = filter === f.id;
                return (
                  <button key={f.id} type="button" aria-pressed={o} onClick={() => setFilter(f.id)}
                    className={cx("inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold", o ? "border-ink bg-ink text-white" : "border-input bg-white text-ink hover:bg-bg")}>
                    <Icon d={FILTER_ICON[f.id]} size={16} />{f.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-divider pt-3.5 text-sm text-ink2">
            <span aria-live="polite">{status}</span>
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1"><span>{profileLine}</span><Link href="/app/settings/business" className="font-semibold text-ink underline underline-offset-2">Change what&apos;s shown</Link></span>
          </div>
        </div>
      </section>

      {!shown && (
        <div className="flex flex-col items-center gap-2.5 rounded-3xl border border-line bg-white px-6 py-8 text-center">
          <span className="font-display text-xl font-bold tracking-[-0.02em]">Nothing called “{query.trim()}” yet</span>
          <span className="max-w-[460px] text-[15px] leading-normal text-ink2">Try a plain word like “tax”, “invoice” or “{tryWord}”. If it&apos;s something you need, tell us and we&apos;ll look into it.</span>
          <div className="mt-1.5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => setQuery("")} className="min-h-11 rounded-full bg-violet px-5 text-sm font-semibold text-ink hover:bg-[#a98ffb]">Clear search</button>
            <a href={`mailto:${COMPANY.email.help}?subject=${encodeURIComponent(`Feature request: ${query.trim()}`)}`} className="inline-flex min-h-11 items-center rounded-full bg-ink/[0.07] px-[18px] text-sm font-semibold text-ink no-underline hover:bg-ink/[0.11]">Ask for this feature</a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] items-start gap-x-[18px] gap-y-6">
        {cols.filter((c) => c.items.length > 0).map((c) => (
          <section key={c.g} aria-labelledby={`col-${c.g}`} className="flex min-w-0 flex-col gap-2.5">
            <div className={cx("flex flex-col gap-1 border-b-[3px] px-1 pb-1.5", c.rule)}>
              <div className="flex items-center justify-between gap-2">
                <h2 id={`col-${c.g}`} className="flex items-center gap-[9px] font-display text-[19px] font-bold tracking-[-0.02em]">
                  <span aria-hidden className={cx("box-border size-[11px] flex-none", c.dot)} />{c.name} <span className="font-sans text-sm font-semibold text-muted">{c.items.length}</span>
                </h2>
                <Link href={c.href} aria-label={c.open} className="flex size-8 flex-none items-center justify-center rounded-full bg-ink/[0.07] hover:bg-ink/[0.11]"><Icon d={ICONS.arrowRight} size={16} strokeWidth={2.2} /></Link>
              </div>
              <span className="text-[13px] leading-[1.4] text-ink2">{c.sub}</span>
            </div>
            <ul className="flex flex-col gap-2">
              {c.items.map((it) => (
                <li key={it.name} className={cx("flex flex-col gap-1.5 rounded-[18px] px-3.5 pb-[13px] pt-3.5", it.isOff ? "border border-dashed border-input bg-bg" : it.hl ? "border-2 border-ink bg-tint" : "border border-line bg-white")}>
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <Link href={it.href} className={cx("text-[15px] font-bold leading-[1.3] no-underline hover:underline hover:underline-offset-[3px]", it.isOff ? "text-ink2" : "text-ink")}>{it.name}<span aria-hidden className="ml-1">→</span></Link>
                    {it.formal && <span className={cx("rounded-full px-2 text-[11.5px] font-semibold leading-[18px] text-ink2", it.hl ? "bg-white" : "bg-surface")}>{it.formal}</span>}
                  </span>
                  <span className="text-[13.5px] leading-[1.45] text-ink2">{it.text}</span>
                  {it.hl && (
                    <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-ink px-[9px] py-0.5 text-[11.5px] font-semibold text-white"><span className="size-1.5 rounded-full bg-violet" />For {filterLabel.toLowerCase()}</span>
                  )}
                  {it.isOff && it.need && (
                    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12.5px] text-ink2">
                      <Icon d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM6 6l12 12" size={14} className="text-muted" />
                      <span>{why[it.need]}</span>
                      <Link href={TURN_ON[it.need]} aria-label={`Set up ${it.name}`} className="font-bold text-ink underline underline-offset-2">set it up</Link>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-sm text-ink2">
        <span>Looking for an answer rather than a feature?</span>
        <Link href="/app/ask" className="font-semibold text-ink underline underline-offset-2">Ask</Link>
        <Link href="/app/keep/reports" className="font-semibold text-ink underline underline-offset-2">All reports</Link>
        <Link href="/app/help" className="font-semibold text-ink underline underline-offset-2">Help</Link>
        <Link href="/app/notifications" className="font-semibold text-ink underline underline-offset-2">Notifications</Link>
      </div>
    </>
  );
}
