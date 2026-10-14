import Link from "next/link";
import { cx } from "@/components/ui";
import s from "@/components/site/site.module.css";
import { GuideCover, type CoverKey } from "@/components/site/illustrations/resources/GuideCovers";
import { guideHref } from "@/content/site/routes";
import type { GuideCategory, GuideCountry } from "@/content/site/guides";

/** What a guide card needs (no article body), so lists can pass it to client components. */
export type GuideCardData = {
  slug: string;
  title: string;
  dek: string;
  category: GuideCategory;
  country: GuideCountry;
  cover: CoverKey;
  minutes: number;
  date: string;
};

const CAT_TINT: Record<GuideCategory, string> = {
  "Making Tax Digital": "bg-tint",
  Tax: "bg-going-tint",
  Landlords: "bg-pos-bg",
  "VAT and SSCL": "bg-tint",
  Payroll: "bg-going-tint",
  "Getting paid": "bg-pos-bg",
  "Working together": "bg-tint",
};

export function CategoryChip({ category, className }: { category: GuideCategory; className?: string }) {
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-bold leading-none", CAT_TINT[category], className)}>{category}</span>;
}

export function CountryChip({ country }: { country: GuideCountry }) {
  const label = country === "uk" ? "UK" : country === "lk" ? "Sri Lanka" : "UK and Sri Lanka";
  return <span className="inline-flex items-center rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold leading-none text-ink2">{label}</span>;
}

/** A guide in a grid: cover, category, reading time, title, dek. `compact` hides the dek (read-next row). */
export function GuideCard({ g, compact = false }: { g: GuideCardData; compact?: boolean }) {
  return (
    <Link href={guideHref(g.slug)} className={cx(s.lift, "flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white")}>
      <GuideCover cover={g.cover} className="aspect-[400/240] h-auto w-full" />
      <span className="flex flex-1 flex-col gap-3 p-[22px]">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex flex-wrap items-center gap-1.5">
            <CategoryChip category={g.category} />
            <CountryChip country={g.country} />
          </span>
          <span className="text-[13px] text-muted">{g.minutes} min read</span>
        </span>
        <span className="font-display text-[20px] font-bold leading-[1.25] tracking-[-0.02em] text-balance">{g.title}</span>
        {!compact && <span className="line-clamp-3 text-[15px] leading-normal text-ink2">{g.dek}</span>}
      </span>
    </Link>
  );
}
