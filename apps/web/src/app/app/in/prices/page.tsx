import { comingIn } from "@billingease/contracts";
import { computeInvoice, formatMoney, rulesFor } from "@billingease/core";
import type { Metadata } from "next";
import { AlsoIn, Chip, Empty, HeroCard, Notice, Panel } from "@/components/in/bits";
import { ItemForm } from "@/components/in/forms";
import { Button, ICONS, Icon } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { archiveItem, saveItem } from "../actions";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Products and services" };

export default async function PricesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const { business: b } = await requireBusiness();
  const { items } = await load(comingIn.listItems);
  const rules = rulesFor(b.country);
  const lk = b.country === "lk";
  const sscl = lk && b.ssclRegistered;
  const m = (minor: number) => formatMoney(minor, b.currency);
  const withTax = (i: (typeof items)[number]) => computeInvoice([{ quantityMilli: 1000, unitPrice: i.unitPrice, vatRateId: i.vatRateId, sscl: i.sscl }], { country: b.country, vatRegistered: b.vatRegistered, ssclRegistered: sscl }).total;
  const rate = (id: string | null) => rules.vatRates.find((r) => r.id === (id ?? rules.defaultVatRateId))?.label ?? "";

  return (
    <>
      <AppCrumbs area="in" trail={[{ label: "Coming in", href: "/app/in" }, { label: "Products and services" }]} />
      <Notice error={sp.error} />
      <HeroCard
        title="Products and services"
        intro={`Your prices, saved once. Pick them when you write a quote or an invoice and the price${b.vatRegistered ? (sscl ? ", SSCL and VAT" : " and VAT") : ""} fills itself in.`}
        chips={<Chip label="Items" value={`${items.length}`} />}
        aside={<>
          <p>{b.vatRegistered ? `You're VAT${sscl ? " and SSCL" : ""} registered, so each price shows its VAT rate${sscl ? " and whether SSCL applies" : ""}.` : "You're not VAT registered, so prices are what your customer pays."}</p>
          <a href="#add" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-violet px-5 text-[15px] font-semibold hover:bg-[#a98ffb]"><Icon d={ICONS.plus} size={18} strokeWidth={2.4} />Add a price</a>
        </>}
      />
      {items.length === 0 ? <Empty>No prices yet. Add the things you sell most often.</Empty> : (
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.id} className="rounded-3xl border border-line bg-white">
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 p-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tint"><Icon d={ICONS.card} size={18} /></span>
                  <span className="flex min-w-0 flex-[1_1_180px] flex-col"><strong className="text-[16px]">{i.name}</strong><span className="text-[13px] text-muted">{i.description ?? (i.usedCount ? `On ${i.usedCount} invoice${i.usedCount === 1 ? "" : "s"}` : "Not used yet")}</span></span>
                  {(b.vatRegistered || sscl) && <span className="flex flex-col text-right text-[13px] text-ink2"><span>{[b.vatRegistered ? `VAT ${rate(i.vatRateId)}` : null, sscl && i.sscl ? `SSCL ${rules.ssclBps / 100}%` : null].filter(Boolean).join(" · ")}</span><span className="text-muted">{m(withTax(i))} with tax</span></span>}
                  <span className="flex flex-col text-right"><strong className="tabular text-[16px]">{m(i.unitPrice)}</strong>{i.unit && <span className="text-xs text-muted">per {i.unit}</span>}</span>
                  <span className="text-sm font-semibold underline">Edit</span>
                </summary>
                <div className="flex flex-col gap-3 border-t border-line p-4">
                  <ItemForm action={saveItem.bind(null, i.id)} country={b.country} vatRegistered={b.vatRegistered} ssclRegistered={b.ssclRegistered} item={i} />
                  <form action={archiveItem.bind(null, i.id, true)}><Button variant="ghost" className="text-late">Remove from the price list</Button></form>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
      {sscl && <p className="text-sm text-muted">SSCL is shown as its own line and included in the value VAT is charged on. To confirm with IRD.</p>}
      <Panel id="add" title="Add a price">
        <ItemForm action={saveItem.bind(null, null)} country={b.country} vatRegistered={b.vatRegistered} ssclRegistered={b.ssclRegistered} submit="Add to price list" />
      </Panel>
      <AlsoIn except="/app/in/prices" />
    </>
  );
}
