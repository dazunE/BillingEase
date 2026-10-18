"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowIcon } from "@/components/site";
import { cx } from "@/components/ui";
import type { ChangeTag } from "@/content/site/changelog";

export type ChangeItem = {
  id: string;
  date: string;
  dateLabel: string;
  tag: ChangeTag;
  title: string;
  body: string;
  points?: string[];
  link?: { label: string; href: string };
  visual?: ReactNode;
};

const TAG: Record<ChangeTag, { chip: string; dot: string }> = {
  New: { chip: "bg-tint text-[#4B2FC9]", dot: "bg-coming" },
  Improved: { chip: "bg-going-tint text-[#8A3A0C]", dot: "bg-going" },
  Fixed: { chip: "bg-pos-bg text-pos", dot: "bg-pos" },
};

/** The timeline with New / Improved / Fixed filters. */
export function ChangelogList({ items }: { items: ChangeItem[] }) {
  const [tag, setTag] = useState<ChangeTag | "all">("all");
  const shown = items.filter((x) => tag === "all" || x.tag === tag);
  const tags: (ChangeTag | "all")[] = ["all", "New", "Improved", "Fixed"];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
          {tags.map((t) => {
            const n = t === "all" ? items.length : items.filter((x) => x.tag === t).length;
            const on = tag === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => setTag(t)}
                className={cx("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold", on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-input")}
              >
                {t !== "all" && <span aria-hidden className={cx("size-2 rounded-full", TAG[t].dot)} />}
                {t === "all" ? "All" : t}
                <span className={cx("text-[13px]", on ? "text-input" : "text-muted")}>{n}</span>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          Showing {shown.length} of {items.length} updates
        </p>
      </div>

      <ol className="relative flex flex-col gap-5">
        <span aria-hidden className="absolute bottom-6 left-[7px] top-6 w-px bg-input sm:left-[119.5px]" />
        {shown.map((x) => (
          <li key={x.id} className="relative flex flex-col gap-2 pl-8 sm:flex-row sm:gap-0 sm:pl-0">
            <span className="flex items-center gap-3 sm:w-[120px] sm:self-start sm:flex-none sm:justify-end sm:gap-4 sm:pr-0 sm:pt-7">
              <time dateTime={x.date} className="text-sm font-bold text-ink2 sm:order-1">
                {x.dateLabel}
              </time>
              <span aria-hidden className={cx("absolute left-0 top-[5px] size-[15px] rounded-full border-2 border-ink sm:static sm:order-2 sm:-mr-[7.5px]", x.visual ? "bg-coming" : "bg-white")} />
            </span>
            <article className="flex min-w-0 flex-1 flex-col gap-3.5 rounded-3xl border border-line bg-white p-[clamp(20px,3vw,28px)] sm:ml-6">
              <span className={cx("inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[13px] font-bold", TAG[x.tag].chip)}>
                <span aria-hidden className={cx("size-1.5 rounded-full", TAG[x.tag].dot)} />
                {x.tag}
              </span>
              <h3 className={cx("font-display font-bold tracking-[-0.02em] text-balance", x.visual ? "text-[clamp(22px,2.4vw,28px)] leading-[1.15]" : "text-xl leading-snug")}>{x.title}</h3>
              <p className="text-base leading-relaxed text-ink2">{x.body}</p>
              {x.visual}
              {x.points && (
                <ul className="flex flex-wrap gap-2">
                  {x.points.map((p) => (
                    <li key={p} className="inline-flex items-start gap-2 rounded-2xl bg-bg px-3 py-1.5 text-sm font-semibold">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A5AF8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 flex-none">
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              )}
              {x.link && (
                <Link href={x.link.href} className="inline-flex min-h-8 items-center gap-1.5 self-start text-[15px] font-bold underline decoration-[1.5px] underline-offset-4">
                  {x.link.label}
                  <ArrowIcon />
                </Link>
              )}
            </article>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted sm:pl-[144px]">That’s everything since the first prototype in October 2026.</p>
    </div>
  );
}
