import { goingOut } from "@billingease/contracts";
import { formatMoney } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, Empty, HeroCard } from "@/components/out/bits";
import { SupplierForm } from "@/components/out/SupplierForm";
import { ButtonLink, ICONS, Icon, Input, cx } from "@/components/ui";
import { load } from "@/lib/api";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Suppliers" };

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<{ q?: string; show?: string; name?: string }> }) {
  const { q, show, name } = await searchParams;
  const archived = show === "archived";
  const [setup, data, unlinked, all] = await Promise.all([
    load(goingOut.setup),
    load(goingOut.suppliers, { query: { q, archived: archived ? "true" : undefined } }),
    load(goingOut.expenses, { query: { limit: 300 } }),
    load(goingOut.suppliers),
  ]);
  const fmt = (m: number) => formatMoney(m, setup.currency);
  // People you've paid by name but haven't added as suppliers.
  const known = new Set(all.suppliers.map((s) => s.name.toLowerCase()));
  const loose = [...new Set(unlinked.expenses.filter((e) => !e.supplierId && !known.has(e.payee.toLowerCase())).map((e) => e.payee))].slice(0, 8);
  const vatLabel = { uk: "VAT registration number", lk: "VAT registration number (TIN-VAT)", us: "Sales tax permit" }[setup.country];

  return (
    <>
      <AppCrumbs area="out" trail={[{ label: "Going out", href: "/app/out" }, { label: "Suppliers" }]} />
      <HeroCard label={<>Who you pay <span className="text-xs font-semibold text-muted">Suppliers</span></>} amount={fmt(data.paidThisYear)}
        sub={<span className="text-sm text-ink2">Paid to {data.suppliers.length} supplier{data.suppliers.length === 1 ? "" : "s"} this tax year ({data.taxYear}){data.openBills ? ` · ${fmt(data.owed)} in ${data.openBills} open bill${data.openBills === 1 ? "" : "s"}` : ""}</span>}>
        <p className="text-[15px] leading-relaxed">Everyone the business pays, with their usual category, what you owe them and what you&apos;ve paid this tax year.</p>
        <a href="#add" className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-violet px-5 text-[15px] font-semibold hover:bg-[#a98ffb]"><Icon d={ICONS.plus} size={18} strokeWidth={2.4} />Add a supplier</a>
      </HeroCard>

      {loose.length > 0 && !archived && (
        <section className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-5" aria-labelledby="loose-h">
          <h2 id="loose-h" className="text-[17px] font-bold">You&apos;ve paid these, but they aren&apos;t in your list yet</h2>
          <div className="flex flex-wrap gap-2">
            {loose.map((n) => (
              <Link key={n} href={`/app/out/suppliers?name=${encodeURIComponent(n)}#add`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold hover:border-input">
                <Icon d={ICONS.plus} size={16} />Add {n}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
        <section className="flex flex-col gap-4" aria-labelledby="list-h">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="list-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">{archived ? "Archived" : "Your suppliers"} <span className="text-muted">{data.suppliers.length}</span></h2>
            <nav className="flex gap-2" aria-label="Show">
              {[{ id: "", label: "Current" }, { id: "archived", label: "Archived" }].map((f) => (
                <Link key={f.id} href={f.id ? `/app/out/suppliers?show=${f.id}` : "/app/out/suppliers"} aria-current={(f.id === "archived") === archived ? "page" : undefined}
                  className={cx("flex min-h-10 items-center rounded-full border px-3.5 text-sm font-semibold", (f.id === "archived") === archived ? "border-going bg-going-tint" : "border-line bg-white")}>{f.label}</Link>
              ))}
            </nav>
          </div>
          <form role="search" className="relative">
            {archived && <input type="hidden" name="show" value="archived" />}
            <Icon d={ICONS.search} size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <label htmlFor="sq" className="sr-only">Search suppliers</label>
            <Input id="sq" name="q" type="search" defaultValue={q} placeholder="Search by name" className="rounded-full pl-11" />
          </form>
          <div className="rounded-3xl border border-line bg-white p-[clamp(10px,2vw,16px)]">
            {data.suppliers.length === 0 ? <Empty>{q ? `No supplier matches “${q}”.` : "No suppliers yet. They're added when you enter a bill, or add one here."}</Empty> : (
              <ul className="flex flex-col divide-y divide-divider">
                {data.suppliers.map((s) => (
                  <li key={s.id}>
                    <Link href={`/app/out/suppliers/${s.id}`} className="flex items-center gap-3.5 rounded-xl px-2 py-3 hover:bg-bg">
                      <Avatar name={s.name} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-bold">{s.name}</span>
                        <span className="truncate text-[13px] text-muted">
                          {s.defaultCategoryName ?? "No usual category"}
                          {s.owed > 0 && <strong className="text-due"> · {fmt(s.owed)} open</strong>}
                        </span>
                      </span>
                      <span className="flex flex-col items-end text-right">
                        <span className="font-bold tabular">{fmt(s.paidThisYear)}</span>
                        <span className="text-xs text-muted">paid this tax year</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        <aside className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-3xl bg-going-tint p-5">
            <h2 className="text-[17px] font-bold">How suppliers count in Going out</h2>
            <p className="text-sm text-ink2">Every payment to a supplier is part of Going out. Open bills sit in <strong>still to pay</strong> until you mark them paid, then move to <strong>paid</strong>.</p>
          </div>
          <div className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-5">
            <h2 className="text-[17px] font-bold">Open bills</h2>
            <p className="text-sm text-ink2">{data.openBills ? `${fmt(data.owed)} across ${data.openBills} bill${data.openBills === 1 ? "" : "s"}, counted in Going out as still to pay.` : "No open bills."}</p>
            <ButtonLink href="/app/out/bills/new" variant="secondary" className="self-start">Enter a bill</ButtonLink>
          </div>
        </aside>
      </div>

      <section id="add" className="scroll-mt-4 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]" aria-labelledby="add-h">
        <h2 id="add-h" className="mb-4 font-display text-[22px] font-bold tracking-[-0.02em]">Add a supplier</h2>
        <SupplierForm key={name ?? ""} categories={setup.categories} vatLabel={vatLabel} name={name} />
      </section>
    </>
  );
}
