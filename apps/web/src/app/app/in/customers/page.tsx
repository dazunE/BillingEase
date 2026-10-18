import { comingIn } from "@billingease/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { AlsoIn, Avatar, Chip, Empty, HeroCard, Notice, Tabs, fmt } from "@/components/in/bits";
import { DONE } from "@/components/in/data";
import { CustomerForm } from "@/components/in/forms";
import { Badge, Button, ICONS, Icon, Input } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { saveCustomer } from "../actions";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Customers" };

type Search = { show?: string; q?: string; done?: string; error?: string };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const { business: b } = await requireBusiness();
  const show = ["owe", "late", "tax", "archived"].includes(sp.show ?? "") ? sp.show! : "all";
  const [{ customers: live }, { customers: archived }] = await Promise.all([
    load(comingIn.listCustomers, { query: { q: sp.q || undefined } }),
    load(comingIn.listCustomers, { query: { q: sp.q || undefined, archived: "true" } }),
  ]);
  const cur = b.currency;
  const lk = b.country === "lk";
  const list = show === "archived" ? archived : live.filter((c) => show === "owe" ? c.owed > 0 : show === "late" ? c.late > 0 : show === "tax" ? !!(c.taxId || c.vatNumber) : true);
  const owed = live.reduce((a, c) => a + c.owed, 0);
  const late = live.reduce((a, c) => a + c.late, 0);
  const paid = live.reduce((a, c) => a + c.paid, 0);
  const href = (s: string) => `/app/in/customers?show=${s}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`;

  return (
    <>
      <AppCrumbs area="in" trail={[{ label: "Coming in", href: "/app/in" }, { label: "Customers" }]} />
      <Notice done={sp.done} error={sp.error} messages={DONE} />
      <HeroCard
        title="Customers"
        intro="Who you work for, what they owe you and what they've paid. Pick one to see everything you've sent them."
        chips={<><Chip label="Owe you" value={fmt(owed, cur)} /><Chip tone="late" label="Late" value={fmt(late, cur)} /><Chip tone="pos" label="Paid so far" value={fmt(paid, cur)} /></>}
        aside={<>
          <p>What customers owe on invoices you sent this period is the money on the way in Coming in. Late invoices from earlier are shown on each customer.</p>
          <a href="#new" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-violet px-5 text-[15px] font-semibold hover:bg-[#a98ffb]"><Icon d={ICONS.plus} size={18} strokeWidth={2.4} />Add a customer</a>
        </>}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs current={show} tabs={[
          { key: "all", label: "Everyone", count: live.length, href: href("all") },
          { key: "owe", label: "Owe you", count: live.filter((c) => c.owed > 0).length, href: href("owe") },
          { key: "late", label: "Late", count: live.filter((c) => c.late > 0).length, href: href("late") },
          { key: "tax", label: lk ? "Have a TIN or VAT no." : "Have a VAT number", count: live.filter((c) => c.taxId || c.vatNumber).length, href: href("tax") },
          ...(archived.length ? [{ key: "archived", label: "Archived", count: archived.length, href: href("archived") }] : []),
        ]} />
        <form method="get" action="/app/in/customers" className="flex w-full gap-2 sm:w-auto">
          <input type="hidden" name="show" value={show} />
          <label className="sr-only" htmlFor="cq">Search customers</label>
          <Input id="cq" name="q" defaultValue={sp.q} placeholder="Name, contact or email" className="sm:w-[260px]" />
          <Button variant="secondary" aria-label="Search"><Icon d={ICONS.search} size={18} /></Button>
        </form>
      </div>
      {list.length === 0 ? <Empty>{sp.q ? "No customers match." : show === "all" ? "No customers yet. Add your first one below." : "No one here."}</Empty> : (
        <ul className="flex flex-col rounded-3xl border border-line bg-white p-2">
          {list.map((c) => (
            <li key={c.id}>
              <Link href={`/app/in/customers/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl px-3 py-3 hover:bg-bg sm:flex-nowrap">
                <Avatar name={c.name} />
                <span className="flex min-w-0 flex-[1_1_200px] flex-col">
                  <span className="truncate text-[16px] font-bold">{c.name}</span>
                  <span className="truncate text-[13px] text-muted">{[c.contactName, c.email, c.vatNumber ? "VAT registered" : null].filter(Boolean).join(" · ") || "No contact details yet"}</span>
                </span>
                {c.late > 0 && <Badge tone="late">{fmt(c.late, cur)} late</Badge>}
                <span className="ml-auto flex gap-6 text-right">
                  <span className="flex flex-col"><span className="text-xs text-muted">Owes you</span><strong className="tabular">{fmt(c.owed, cur)}</strong></span>
                  <span className="flex flex-col"><span className="text-xs text-muted">Paid so far</span><strong className="tabular">{fmt(c.paid, cur)}</strong></span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <section id="new" className="flex scroll-mt-6 flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)] target:border-coming target:ring-4 target:ring-tint">
        <h2 className="font-display text-[22px] font-bold">Add a customer</h2>
        <p className="-mt-2 text-[15px] text-ink2">Name and email is enough to send an invoice.{lk ? " Add their TIN and VAT registration number if they need a Tax Invoice." : ""}</p>
        <CustomerForm action={saveCustomer.bind(null, null)} country={b.country} submit="Add customer" invoiceAfter />
      </section>
      <AlsoIn except="/app/in/customers" />
    </>
  );
}
