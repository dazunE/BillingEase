import type { HomeSummary } from "@billingease/contracts";
import Link from "next/link";
import { ICONS, Icon } from "@/components/ui";

const ICON: Record<HomeSummary["needs"][number]["kind"], { d: string; tint: string }> = {
  late: { d: ICONS.clock, tint: "bg-late-bg" },
  draft: { d: ICONS.doc, tint: "bg-tint" },
  bill: { d: ICONS.bill, tint: "bg-going-tint" },
  uncategorised: { d: ICONS.sort, tint: "bg-due-bg" },
  tax_id: { d: ICONS.people, tint: "bg-surface" },
  vat_number: { d: ICONS.people, tint: "bg-surface" },
  vat_threshold: { d: ICONS.bank, tint: "bg-due-bg" },
};

export function NeedsYou({ items }: { items: HomeSummary["needs"] }) {
  return (
    <section aria-labelledby="needs-h" className="flex min-w-0 flex-[999_1_480px] flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="needs-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">Needs you <span className="font-semibold text-muted">{items.length}</span></h2>
        <span className="text-[13px] text-muted">Late invoices, bills and things to finish</span>
      </div>
      {items.length === 0 && (
        <div className="flex flex-col gap-1 rounded-[20px] bg-pos-bg px-5 py-4 text-pos">
          <span className="font-bold">All clear.</span>
          <span className="text-sm">Nothing needs you today. Nothing late, nothing due this week.</span>
        </div>
      )}
      {items.map((t) => (
        <article key={t.id} className="flex flex-wrap items-center gap-x-[18px] gap-y-3.5 rounded-[20px] border border-line bg-white px-5 py-[18px]">
          <span className={`flex size-11 flex-none items-center justify-center rounded-[14px] ${ICON[t.kind].tint}`}><Icon d={ICON[t.kind].d} size={22} /></span>
          <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-[3px]">
            <span className="text-base font-bold">{t.title}</span>
            <span className="text-sm leading-[1.45] text-ink2">{t.body}</span>
          </div>
          <Link href={t.href} className="inline-flex min-h-11 items-center rounded-full bg-violet px-5 text-sm font-semibold text-ink hover:bg-[#a98ffb]">{t.cta}</Link>
        </article>
      ))}
    </section>
  );
}
