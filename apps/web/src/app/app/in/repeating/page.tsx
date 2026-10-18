import { comingIn } from "@billingease/contracts";
import { formatDate } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AlsoIn, Empty, FREQ, HeroCard, fmt } from "@/components/in/bits";
import { Badge, Button, ButtonLink, ICONS, Icon, SectionTitle } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { pauseRecurring, runRecurring } from "../actions";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Repeating invoices and credit notes" };

export default async function RepeatingPage() {
  const { business: b } = await requireBusiness();
  const [{ recurring, monthly }, credits] = await Promise.all([load(comingIn.listRecurring), load(comingIn.listInvoices, { query: { kind: "credit_note", status: "all" } })]);
  const cur = b.currency;
  const active = recurring.filter((r) => r.active).length;
  return (
    <>
      <AppCrumbs area="in" trail={[{ label: "Coming in", href: "/app/in" }, { label: "Repeating and credit notes" }]} />
      <HeroCard
        title="Repeating invoices"
        intro="Retainers and regular work that bill on the same day each time. By default each run makes a draft for you to check and send; you can choose to have it sent on the day instead."
        aside={<div className="flex flex-col gap-1"><span className="text-sm font-bold text-ink">Billed a month, roughly</span><span className="tabular font-display text-[34px] font-bold text-ink">{fmt(monthly, cur)}</span><span className="text-sm">{active} of {recurring.length} active · paused ones don&apos;t count</span></div>}
      />
      <section className="flex flex-col gap-4" aria-labelledby="rep-h">
        <SectionTitle id="rep-h" aside={<ButtonLink href="/app/in/repeating/new" variant="secondary"><Icon d={ICONS.plus} size={18} />New repeating invoice</ButtonLink>}>Repeats on its own <span className="text-muted">{recurring.length}</span></SectionTitle>
        {recurring.length === 0 ? <Empty>No repeating invoices yet. <Link href="/app/in/repeating/new" className="font-semibold underline">Set one up</Link> for a retainer or a monthly job.</Empty> : (
          <ul className="flex flex-col gap-3">
            {recurring.map((r) => (
              <li key={r.id} className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(16px,2.5vw,24px)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-2"><Link href={`/app/in/repeating/${r.id}`} className="text-[18px] font-bold hover:underline">{r.customerName}</Link><Badge tone={r.active ? "pos" : "due"}>{r.active ? "Active" : "Paused"}</Badge></span>
                    <span className="text-[15px] text-ink2">{r.name} · {FREQ[r.frequency]}</span>
                    <span className="text-sm text-muted">{r.mode === "send" ? "Sent on the day with the PDF" : "Makes a draft for you to check"} · {r.invoiceCount} sent so far</span>
                  </div>
                  <div className="flex flex-col items-end"><strong className="tabular text-[20px]">{fmt(r.total, cur)}</strong>{(r.vat > 0 || r.sscl > 0) && <span className="text-sm text-muted">{fmt(r.net, cur)} before tax</span>}</div>
                </div>
                {r.upcoming.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-bg p-3 text-sm">
                    <span className="font-bold">Next runs</span>
                    {r.upcoming.map((d, i) => <span key={d} className={i === 0 ? "rounded-full border-2 border-coming bg-white px-3 py-1 font-bold" : "rounded-full border border-line bg-white px-3 py-1"}>{i === 0 ? "Next: " : ""}{formatDate(d, { year: d.slice(0, 4) !== r.nextRun.slice(0, 4) })}</span>)}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {r.active && <form action={runRecurring.bind(null, r.id)}><Button>{r.mode === "send" ? "Send the next one now" : "Make the next one now"}</Button></form>}
                  <form action={pauseRecurring.bind(null, r.id, !r.active)}><Button variant={r.active ? "secondary" : "primary"}>{r.active ? "Pause" : "Resume"}</Button></form>
                  <ButtonLink href={`/app/in/repeating/${r.id}`} variant="secondary">Edit</ButtonLink>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="credit-notes" className="flex scroll-mt-6 flex-col gap-4" aria-labelledby="cn-h">
        <SectionTitle id="cn-h">Credit notes to customers</SectionTitle>
        <p className="-mt-2 text-[15px] text-ink2">Taking money off an invoice lowers Coming in. Open the invoice and choose Credit note to give one; paying back a paid invoice is recorded in Going out.</p>
        {credits.invoices.length === 0 ? <Empty>No credit notes yet.</Empty> : (
          <ul className="flex flex-col rounded-3xl border border-line bg-white p-2">
            {credits.invoices.map((c) => (
              <li key={c.id}>
                <Link href={`/app/in/invoices/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl px-3 py-3 hover:bg-bg">
                  <span className="flex min-w-0 flex-1 flex-col"><strong>{c.customerName}</strong><span className="text-sm text-muted">{c.number} · {formatDate(c.issueDate)}{c.summary ? ` · ${c.summary}` : ""}</span></span>
                  <Badge tone="pos">Applied</Badge>
                  <strong className="tabular">−{fmt(c.total, cur)}</strong>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <AlsoIn except="/app/in/repeating" />
    </>
  );
}
