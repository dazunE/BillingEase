import { properties, type Business } from "@billingease/contracts";
import { formatMoney, monthLabel, today } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { removePropertyEntry } from "@/app/app/accountant/actions";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { Panel, range, shortDate } from "@/components/keep/parts";
import { PropertyEntryForm, PropertyForm } from "@/components/practice/Forms";
import { cx, Icon } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Properties" };

const HOME = "M4 11 12 4l8 7v9h-5v-6H9v6H4z";
const TRASH = "M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3";
const landlord = (b: Business) => b.country === "uk" && (b.kind === "landlord" || b.kind === "both");

/** Properties (prototype Properties): rent and costs for the homes you let, kept apart from your other work. */
export default async function PropertiesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { business: b } = await requireBusiness();
  if (b.country !== "uk") notFound();
  const { q } = await searchParams;
  const r = await load(properties.list);
  const t = today();
  const gbp = (n: number) => formatMoney(n, "GBP", { decimals: "never" });
  const exact = (n: number) => formatMoney(n, "GBP");
  const quarter = r.quarters.find((x) => x.id === q);
  const entries = quarter ? r.entries.filter((e) => e.on >= quarter.from && e.on <= quarter.to) : r.entries;
  const tile = "flex flex-col gap-1 rounded-3xl border border-line bg-white p-5";
  const relief = Math.round(r.totals.finance * 0.2);

  return (
    <>
      <AppCrumbs area="out" trail={[{ label: "Going out", href: "/app/out" }, { label: "Properties" }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[720px] flex-col gap-2">
          <h1 className="font-display text-[clamp(32px,4.5vw,48px)] font-bold leading-[1.05] tracking-[-0.03em]">Properties</h1>
          <p className="text-ink2">Rent and costs for the homes you let, kept apart from your other work and from your three numbers. Your accountant sees them in your quarterly updates.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <a href="#add-property" className="inline-flex min-h-11 items-center rounded-full bg-ink/[0.07] px-5 text-[15px] font-semibold hover:bg-ink/[0.11]">Add a property</a>
          {r.properties.length > 0 && <a href="#add-entry" className="inline-flex min-h-11 items-center rounded-full bg-violet px-5 text-[15px] font-semibold hover:bg-[#a98ffb]">Add a cost or income</a>}
        </div>
      </div>
      {!landlord(b) && <p className="rounded-2xl bg-info-bg px-4 py-3 text-sm text-info">Your business profile says you&apos;re a sole trader. If you also let property, change it to “Sole trader and landlord” in <Link href="/app/settings/business" className="font-semibold underline">your business profile</Link>.</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={tile}><span className="flex items-center gap-2 text-sm font-semibold"><span className="size-2 rounded-full bg-coming" />Rent received</span><span className="font-display text-[28px] font-bold tabular-nums">{gbp(r.totals.rent)}</span><span className="text-[13px] text-muted">This tax year, {r.taxYear.label}</span></div>
        <div className={tile}><span className="flex items-center gap-2 text-sm font-semibold"><span className="size-2 rounded-full bg-going" />Costs</span><span className="font-display text-[28px] font-bold tabular-nums">{gbp(r.totals.costs)}</span><span className="text-[13px] text-muted">Agent, repairs, insurance and more</span></div>
        <div className={tile}><span className="flex items-center gap-2 text-sm font-semibold"><span className="size-2 rounded-full bg-going-light" />Mortgage interest</span><span className="font-display text-[28px] font-bold tabular-nums">{gbp(r.totals.finance)}</span><span className="text-[13px] text-muted">Kept separate · 20% tax reduction</span></div>
        <div className="flex flex-col gap-1 rounded-3xl bg-ink p-5 text-white"><span className="flex items-center gap-2 text-sm font-semibold"><span className="size-2 rounded-full bg-violet" />Property profit so far</span><span className="font-display text-[28px] font-bold tabular-nums text-violet">{gbp(r.totals.profit)}</span><span className="text-[13px] text-white/75">Before the mortgage interest reduction</span></div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          {r.properties.map((p) => (
            <section key={p.id} aria-label={p.name} className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-tint"><Icon d={HOME} size={20} /></span>
                  <span className="flex flex-col"><span className="font-display text-xl font-bold">{p.name}</span><span className="text-[13px] text-muted">{p.address}</span></span>
                </span>
                <span className="flex flex-wrap gap-1.5 text-xs font-semibold">
                  {p.monthlyRent > 0 && <span className="rounded-full bg-surface px-3 py-1">{gbp(p.monthlyRent)} a month</span>}
                  {p.rentDay && <span className="rounded-full bg-surface px-3 py-1">Due on the {p.rentDay}{p.rentDay % 10 === 1 && p.rentDay !== 11 ? "st" : p.rentDay % 10 === 2 && p.rentDay !== 12 ? "nd" : p.rentDay % 10 === 3 && p.rentDay !== 13 ? "rd" : "th"}</span>}
                  {p.agent && <span className="rounded-full bg-surface px-3 py-1">{p.agent}</span>}
                </span>
              </div>
              <p className="rounded-2xl bg-bg px-4 py-3 text-sm"><strong>You own {p.sharePct}%.</strong> {p.sharePct === 100 ? "All of its rent and costs are yours." : `${p.sharePct}% of its rent and costs are yours; enter the full amounts.`}</p>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">Rent roll · {r.taxYear.label}</h3>
                <span className="text-[13px] text-muted">{p.monthlyRent ? `Expected ${gbp(p.monthlyRent)} a month · ` : ""}received {gbp(p.totals.rent)}</span>
              </div>
              <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {p.rentMonths.map((m) => {
                  const due = m.month <= t.slice(0, 7);
                  const got = m.received > 0;
                  return (
                    <li key={m.month} className={cx("flex flex-col rounded-xl border px-3 py-2 text-xs", got ? "border-pos-bg bg-pos-bg" : due && p.monthlyRent ? "border-due-bg bg-due-bg" : "border-line")}>
                      <span className="text-sm font-bold">{monthLabel(m.month + "-01", false).split(" ")[0]}</span>
                      <span className={got ? "text-pos" : "text-muted"}>{got ? `Received ${gbp(m.received)}` : due && p.monthlyRent ? "Not recorded" : "To come"}</span>
                    </li>
                  );
                })}
              </ol>
              <details className="text-sm"><summary className="cursor-pointer font-semibold underline underline-offset-4">Change the details</summary><div className="pt-4"><PropertyForm property={p} /></div></details>
            </section>
          ))}

          {r.properties.length > 0 && (
            <Panel id="add-entry" title="Add a cost or income">
              <PropertyEntryForm properties={r.properties} categories={r.categories} today={t} />
            </Panel>
          )}

          {r.properties.length > 0 && (
            <Panel id="entries-h" title="Income and costs"
              aside={<nav aria-label="Quarter" className="flex flex-wrap gap-1 rounded-[22px] bg-surface p-1">
                {[{ id: "", label: "Whole year" }, ...r.quarters.map((x) => ({ id: x.id, label: x.label.split(" ")[0] }))].map((x) => (
                  <Link key={x.id} href={x.id ? `/app/out/properties?q=${x.id}` : "/app/out/properties"} scroll={false} aria-current={(q ?? "") === x.id ? "page" : undefined} className={cx("flex min-h-9 items-center rounded-full px-3.5 text-sm font-semibold", (q ?? "") === x.id ? "bg-ink text-white" : "text-ink")}>{x.label}</Link>
                ))}
              </nav>}>
              {entries.length === 0 ? <p className="text-sm text-muted">Nothing recorded {quarter ? `in ${quarter.label}` : "this tax year"} yet.</p> : (
                <ul className="flex flex-col">
                  {entries.map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center gap-3 border-b border-divider py-3 last:border-0">
                      <span className="w-14 text-[13px] text-muted">{shortDate(e.on)}</span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-semibold">{e.payee ? `${e.payee} · ` : ""}{e.description}</span>
                        <span className="text-xs text-muted">{e.kind === "rent" ? "Rent · Rents and other income from property" : `${e.categoryName} · ${e.categoryOfficial}`}</span>
                      </span>
                      {e.categoryId === "p-finance" && <span className="rounded-full bg-tint px-2.5 py-0.5 text-xs font-bold">Kept separate</span>}
                      <span className={cx("font-semibold tabular-nums", e.kind === "rent" ? "text-ink" : "")}>{e.kind === "rent" ? "+" : "−"}{gbp(e.share)}</span>
                      <form action={removePropertyEntry}><input type="hidden" name="id" value={e.id} /><button aria-label={`Remove ${e.description}`} className="flex size-9 items-center justify-center rounded-full hover:bg-surface"><Icon d={TRASH} size={16} /></button></form>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-3 text-sm"><span className="text-muted">Tax year so far, your share</span><span>Income <strong>{gbp(r.totals.rent)}</strong> · Costs <strong>{gbp(r.totals.costs)}</strong> · Mortgage interest <strong>{gbp(r.totals.finance)}</strong></span></div>
            </Panel>
          )}

          <Panel id="add-property" title={r.properties.length ? "Add a property" : "Add the property you let"} sub="Then record its rent as it arrives and its costs as you pay them.">
            <PropertyForm />
          </Panel>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Panel id="q-h" title="In your quarterly updates" sub="Your property summary goes into each quarter next to your other work. Figures are your share.">
            <ul className="flex flex-col gap-2">
              {r.quarters.map((x) => (
                <li key={x.id} className="flex flex-col gap-0.5 rounded-2xl bg-bg p-3 text-sm">
                  <span className="font-semibold">{x.label.split(" ")[0]} <span className="font-normal text-muted">{range(x.from, x.to)}</span></span>
                  <span className="text-[13px] text-ink2">{x.rent || x.costs || x.finance ? `Rent ${gbp(x.rent)} · costs ${gbp(x.costs)} · interest ${gbp(x.finance)}` : "Nothing yet"}</span>
                </li>
              ))}
            </ul>
            <Link href="/app/keep/quarters" className="text-sm font-semibold underline underline-offset-4">Open your quarters</Link>
          </Panel>
          <Panel id="allow-h" title="The £1,000 property allowance">
            <p className="text-sm text-ink2">{r.totals.costs > r.allowance ? `Your costs so far (${gbp(r.totals.costs)}) are more than the £1,000 allowance, so claiming your costs is better.` : `Your costs so far (${gbp(r.totals.costs)}) are under £1,000, so the allowance may be better. Your accountant decides with you.`}</p>
            <p className="text-xs text-muted">You can take the allowance or your costs, not both; using it means no mortgage interest reduction.</p>
          </Panel>
          <section className="flex flex-col gap-2 rounded-3xl bg-ink p-6 text-white">
            <h2 className="font-display text-lg font-bold">Mortgage interest, kept separate</h2>
            <span className="font-display text-[28px] font-bold text-violet">{exact(relief).replace(/\.00$/, "")} off your tax</span>
            <p className="text-sm text-white/85">Mortgage interest of {gbp(r.totals.finance)} this year isn&apos;t taken off your rent. It reduces your Income Tax by 20% of it instead.</p>
            <Link href="/app/keep" className="text-sm font-semibold text-white underline underline-offset-4">See your tax estimate</Link>
          </section>
        </aside>
      </div>
    </>
  );
}
