import { mileage } from "@billingease/contracts";
import { formatMoney, MILEAGE, showMiles, today } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { removeTrip } from "@/app/app/accountant/actions";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { Panel, range, shortDate } from "@/components/keep/parts";
import { TripForm } from "@/components/practice/Forms";
import { cx, Icon } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Mileage" };

const TRASH = "M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3";
const LOCK = "M6 11h12v10H6zM8 11V7a4 4 0 1 1 8 0v4";

/** Mileage (prototype Mileage): business trips in your own vehicle, claimed at HMRC's flat rate. */
export default async function MileagePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { business: b } = await requireBusiness();
  if (b.country !== "uk") notFound();
  const { q } = await searchParams;
  const r = await load(mileage.list);
  const t = today();
  const pounds = (n: number) => formatMoney(n, "GBP");
  const current = r.quarters.find((x) => x.from <= t && x.to >= t) ?? r.quarters[0];
  const chosen = r.quarters.find((x) => x.id === q);
  const list = chosen ? r.trips.filter((x) => x.on >= chosen.from && x.on <= chosen.to) : r.trips;
  const left = Math.max(0, MILEAGE.car.first - r.totals.carMiles);
  const usedPct = Math.min(100, Math.round((r.totals.carMiles / MILEAGE.car.first) * 100));

  return (
    <>
      <AppCrumbs area="out" trail={[{ label: "Going out", href: "/app/out" }, { label: "Mileage" }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[720px] flex-col gap-2">
          <h1 className="font-display text-[clamp(32px,4.5vw,48px)] font-bold leading-[1.05] tracking-[-0.03em]">Mileage</h1>
          <p className="text-ink2">Business trips in your own vehicle, claimed at HMRC&apos;s flat rate per mile. Each trip goes into Car, van and travel.</p>
        </div>
        <a href="#log" className="inline-flex min-h-11 items-center rounded-full bg-violet px-5 text-[15px] font-semibold hover:bg-[#a98ffb]">Log a trip</a>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-3xl bg-ink p-5 text-white"><span className="text-sm font-semibold">Claimed this tax year</span><span className="font-display text-[30px] font-bold tabular-nums text-violet">{pounds(r.totals.amount)}</span><span className="text-[13px] text-white/75">{showMiles(r.totals.miles)} miles on {r.totals.trips} {r.totals.trips === 1 ? "trip" : "trips"} since {shortDate(r.taxYear.from)}</span></div>
        <div className="flex flex-col gap-1 rounded-3xl border border-line bg-white p-5"><span className="flex items-center gap-2 text-sm font-semibold"><span className="size-2 rounded-full bg-going" />This quarter · {current?.label.split(" ")[0]}</span><span className="font-display text-[30px] font-bold tabular-nums">{pounds(current?.amount ?? 0)}</span><span className="text-[13px] text-muted">{showMiles(current?.miles ?? 0)} miles on {current?.trips ?? 0} {current?.trips === 1 ? "trip" : "trips"}</span></div>
        <div className="flex flex-col gap-2 rounded-3xl border border-line bg-white p-5"><span className="text-sm font-semibold">Rate this year</span><span className="font-display text-[22px] font-bold">{left > 0 ? `${MILEAGE.car.rate1}p a mile` : `${MILEAGE.car.rate2}p a mile`}</span>
          <span className="h-2 overflow-hidden rounded-full bg-surface" aria-hidden><span className="block h-full rounded-full bg-going" style={{ width: `${usedPct}%` }} /></span>
          <span className="text-[13px] text-muted">{left > 0 ? `${showMiles(left)} miles left at ${MILEAGE.car.rate1}p, then ${MILEAGE.car.rate2}p` : `Past 10,000 miles: ${MILEAGE.car.rate2}p for the rest of the year`}</span></div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel id="log-h" title="Trip log"
            aside={<nav aria-label="Quarter" className="flex flex-wrap gap-1 rounded-[22px] bg-surface p-1">
              {[{ id: "", label: "Whole year" }, ...r.quarters.map((x) => ({ id: x.id, label: x.label.split(" ")[0] }))].map((x) => (
                <Link key={x.id} href={x.id ? `/app/out/mileage?q=${x.id}` : "/app/out/mileage"} scroll={false} aria-current={(q ?? "") === x.id ? "page" : undefined} className={cx("flex min-h-9 items-center rounded-full px-3.5 text-sm font-semibold", (q ?? "") === x.id ? "bg-ink text-white" : "text-ink")}>{x.label}</Link>
              ))}
            </nav>}>
            {list.length === 0 ? <p className="text-sm text-muted">No trips {chosen ? `in ${chosen.label}` : "this tax year"} yet.</p> : (
              <ul className="flex flex-col">
                {list.map((x) => (
                  <li key={x.id} className="flex flex-wrap items-center gap-3 border-b border-divider py-3 last:border-0">
                    <span className="w-14 text-[13px] text-muted">{shortDate(x.on)}</span>
                    <span className="flex min-w-0 flex-1 flex-col"><span className="font-semibold">{x.from} to {x.to}</span>{x.purpose && <span className="text-[13px] text-muted">{x.purpose}</span>}</span>
                    <span className="text-sm text-ink2">{showMiles(x.miles)} miles</span>
                    <span className="w-20 text-right font-semibold tabular-nums">{pounds(x.amount)}</span>
                    {x.locked ? <span title="In a period that's been sent" className="flex size-9 items-center justify-center text-muted"><Icon d={LOCK} size={16} /><span className="sr-only">Locked</span></span>
                      : <form action={removeTrip}><input type="hidden" name="id" value={x.id} /><button aria-label={`Remove the trip to ${x.to}`} className="flex size-9 items-center justify-center rounded-full hover:bg-surface"><Icon d={TRASH} size={16} /></button></form>}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-sm"><span className="text-muted">Tax year so far</span><span><strong>{showMiles(r.totals.miles)} miles</strong> · claim <strong>{pounds(r.totals.amount)}</strong></span></div>
          </Panel>
          <Panel id="log" title="Log a trip"><TripForm today={t} /></Panel>
        </div>
        <aside className="flex min-w-0 flex-col gap-4">
          <Panel id="q-h" title="Added to your quarters" sub="Under Car, van and travel (Car, van and travel expenses).">
            <ul className="flex flex-col gap-2">
              {r.quarters.map((x) => (
                <li key={x.id} className="flex flex-col gap-0.5 rounded-2xl bg-bg p-3 text-sm">
                  <span className="font-semibold">{x.label.split(" ")[0]} <span className="font-normal text-muted">{range(x.from, x.to)}</span></span>
                  <span className="text-[13px] text-ink2">{x.trips ? `${showMiles(x.miles)} miles · ${pounds(x.amount)}` : "No trips"}</span>
                </li>
              ))}
            </ul>
            <Link href="/app/keep/quarters" className="text-sm font-semibold underline underline-offset-4">Open your quarters</Link>
          </Panel>
          <Panel id="rate-h" title="How the rate works">
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-ink2 marker:text-going">
              <li>{MILEAGE.car.rate1}p a mile for the first 10,000 business miles in the tax year, then {MILEAGE.car.rate2}p. Motorcycles {MILEAGE.motorcycle}p, bicycles {MILEAGE.bicycle}p.</li>
              <li>The rate covers fuel, insurance, repairs and wear, so don&apos;t add those for this vehicle as expenses.</li>
              <li>Parking and tolls on a business trip can still go in as expenses.</li>
            </ul>
            <p className="text-xs text-muted">Simplified expenses: vehicles. Rates set by HMRC{r.verified ? "" : "; illustrative until checked each April"}.</p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
