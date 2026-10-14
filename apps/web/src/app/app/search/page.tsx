import { home, type SearchResult } from "@billingease/contracts";
import { formatDate, formatMoney } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { ICONS, Icon, Input } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Search" };

const TYPES: Record<SearchResult["type"], { label: string; icon: string; tint: string }> = {
  invoice: { label: "Invoices", icon: ICONS.doc, tint: "bg-tint" },
  customer: { label: "Customers", icon: ICONS.people, tint: "bg-tint" },
  supplier: { label: "Suppliers", icon: ICONS.people, tint: "bg-going-tint" },
  bill: { label: "Bills", icon: ICONS.clock, tint: "bg-going-tint" },
  expense: { label: "Expenses", icon: ICONS.bill, tint: "bg-going-tint" },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { business } = await requireBusiness();
  const q = ((await searchParams).q ?? "").slice(0, 100);
  const { results } = q.trim() ? await load(home.search, { query: { q } }) : { results: [] as SearchResult[] };
  const groups = (Object.keys(TYPES) as SearchResult["type"][]).map((t) => ({ t, items: results.filter((r) => r.type === t) })).filter((g) => g.items.length);
  return (
    <>
    <AppCrumbs trail={[{ label: "Search" }]} />
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold tracking-[-0.03em]">Search</h1>
        <form action="/app/search" role="search" className="flex gap-2">
          <label className="sr-only" htmlFor="search-page-q">Search customers, invoices, suppliers, expenses and bills</label>
          <Input id="search-page-q" name="q" type="search" defaultValue={q} placeholder="A customer, an invoice number, a supplier…" />
          <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-violet px-5 text-[15px] font-semibold"><Icon d={ICONS.search} size={18} />Search</button>
        </form>
      </div>
      {!q.trim() ? (
        <p className="text-ink2">Search customers, invoice numbers, suppliers, expenses and bills.</p>
      ) : results.length === 0 ? (
        <div className="flex flex-col gap-1 rounded-3xl border border-dashed border-input p-6">
          <span className="font-display text-lg font-bold">Nothing matches &ldquo;{q}&rdquo;</span>
          <span className="text-sm text-ink2">Try part of a name, or an invoice number like {business.invoicePrefix}0001.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-5" data-testid="search-results">
          <p className="text-sm text-muted">{results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;{results.length === 20 ? " (the first 20)" : ""}</p>
          {groups.map((g) => (
            <section key={g.t} aria-labelledby={`g-${g.t}`} className="flex flex-col gap-2">
              <h2 id={`g-${g.t}`} className="font-display text-lg font-bold tracking-[-0.02em]">{TYPES[g.t].label}</h2>
              <ul className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white">
                {g.items.map((r) => (
                  <li key={r.id} className="border-b border-divider last:border-0">
                    <Link href={r.href} className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-bg">
                      <span className={`flex size-9 flex-none items-center justify-center rounded-xl ${TYPES[r.type].tint}`}><Icon d={TYPES[r.type].icon} size={18} /></span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-semibold">{r.title}</span>
                        <span className="truncate text-[13px] text-muted">{r.subtitle}{r.date ? ` · ${formatDate(r.date, { year: true })}` : ""}</span>
                      </span>
                      {r.amount != null && r.type !== "expense" && <span className="tabular flex-none text-sm font-semibold">{formatMoney(r.amount, business.currency)}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
