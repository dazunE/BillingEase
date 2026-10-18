"use client";

import { useId, useMemo, useState } from "react";
import { cx } from "@/components/ui";
import type { SiteCountry } from "@/content/site/country";
import type { GuideCategory } from "@/content/site/guides";
import { GuideCard, type GuideCardData } from "./GuideCard";

type Scope = SiteCountry | "all";

const SCOPES: { id: Scope; label: string }[] = [
  { id: "uk", label: "UK" },
  { id: "lk", label: "Sri Lanka" },
  { id: "all", label: "Both countries" },
];

/**
 * "Browse every guide": search, a country switch (starts on the visitor's
 * country, with the other one a click away) and category chips.
 */
export function GuideBrowser({ guides, country, categories }: { guides: GuideCardData[]; country: SiteCountry; categories: GuideCategory[] }) {
  const [scope, setScope] = useState<Scope>(country);
  const [cat, setCat] = useState<GuideCategory | "all">("all");
  const [q, setQ] = useState("");
  const searchId = useId();

  const inScope = useMemo(() => guides.filter((g) => scope === "all" || g.country === "both" || g.country === scope), [guides, scope]);
  const cats = categories.map((c) => ({ c, n: inScope.filter((g) => g.category === c).length })).filter((x) => x.n > 0);
  const activeCat = cat !== "all" && cats.some((x) => x.c === cat) ? cat : "all";
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = inScope.filter(
    (g) => (activeCat === "all" || g.category === activeCat) && words.every((w) => `${g.title} ${g.dek} ${g.category}`.toLowerCase().includes(w)),
  );
  const other: SiteCountry = country === "uk" ? "lk" : "uk";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div className="flex flex-col gap-3">
          <h2 id="browse-h" className="font-display text-[clamp(28px,3.4vw,44px)] font-bold leading-[1.08] tracking-[-0.03em]">
            Browse every guide
          </h2>
          <div role="radiogroup" aria-label="Guides for" className="flex max-w-full flex-wrap gap-1 self-start rounded-full bg-surface p-1">
            {SCOPES.map((sc) => (
              <button
                key={sc.id}
                type="button"
                role="radio"
                aria-checked={scope === sc.id}
                onClick={() => setScope(sc.id)}
                className={cx("min-h-11 whitespace-nowrap rounded-full px-4 text-[15px] font-semibold transition-colors", scope === sc.id ? "bg-ink text-white" : "text-ink hover:bg-white/70")}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>
        <label htmlFor={searchId} className="relative flex w-full max-w-[360px] items-center">
          <span className="sr-only">Search guides</span>
          <svg className="pointer-events-none absolute left-[18px]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id={searchId}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={country === "uk" ? "Search guides, e.g. VAT" : "Search guides, e.g. EPF"}
            className="min-h-[52px] w-full rounded-full border border-input bg-white pl-12 pr-5 text-base outline-none focus:border-ink"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Topics">
        {[{ c: "all" as const, n: inScope.length }, ...cats].map(({ c, n }) => (
          <button
            key={c}
            type="button"
            aria-pressed={activeCat === c}
            onClick={() => setCat(c)}
            className={cx(
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold transition-colors",
              activeCat === c ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-input",
            )}
          >
            {c === "all" ? "All" : c}
            <span className={cx("text-[13px]", activeCat === c ? "text-input" : "text-muted")}>{n}</span>
          </button>
        ))}
      </div>

      <p className="text-[15px] text-muted" aria-live="polite">
        {shown.length === 1 ? "1 guide" : `${shown.length} guides`}
        {scope !== "all" && (
          <>
            {" "}
            for {scope === "uk" ? "the UK" : "Sri Lanka"}.{" "}
            <button type="button" onClick={() => setScope(scope === other ? country : other)} className="min-h-8 font-semibold text-ink underline underline-offset-[3px]">
              See {scope === "uk" ? "Sri Lanka" : "UK"} guides
            </button>
          </>
        )}
      </p>

      {shown.length > 0 ? (
        <ul className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))" }}>
          {shown.map((g) => (
            <li key={g.slug} className="flex min-w-0">
              <div className="flex-1">
                <GuideCard g={g} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-3xl border border-line bg-white p-7">
          <p className="text-lg font-semibold">No guide matches “{q}” yet.</p>
          <button type="button" onClick={() => { setQ(""); setCat("all"); setScope("all"); }} className="min-h-11 rounded-full bg-ink/[0.07] px-5 text-[15px] font-semibold hover:bg-ink/[0.11]">
            Show every guide
          </button>
        </div>
      )}
    </div>
  );
}
