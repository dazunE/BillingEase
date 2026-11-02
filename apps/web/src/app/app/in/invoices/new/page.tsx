import { comingIn, type Billing } from "@billingease/contracts";
import { invoiceTitle, today } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { editorBusiness, editorCustomers } from "@/components/in/data";
import { DocEditor } from "@/components/in/DocEditor";
import { ICONS, Icon } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { saveInvoice } from "../../actions";

export const metadata: Metadata = { title: "New invoice" };

const CLOCK = "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2";
const TAG = "M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01";
const REPEAT = "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3";

const TYPES: { id: Billing | "recurring"; title: string; line: string; example: string; icon: string }[] = [
  { id: "time_materials", title: "Time and materials", line: "Hours worked at a rate, plus materials at cost or with a markup.", example: "e.g. 12 hours at £45, and the parts you bought", icon: CLOCK },
  { id: "fixed", title: "Fixed price", line: "One agreed price for a piece of work, with what it covers.", example: "e.g. Website redesign, £2,400", icon: TAG },
  { id: "recurring", title: "Recurring", line: "The same invoice every week, month, quarter or year.", example: "e.g. A monthly retainer", icon: REPEAT },
  { id: "items", title: "Items", line: "Products and services, each with a quantity and price.", example: "e.g. 3 × logo concepts", icon: ICONS.doc },
];

const LEAD: Record<Billing, string> = {
  items: "Several lines, products and services, a discount",
  time_materials: "Time with dates, hours and rates, and materials with any markup, each with its subtotal",
  fixed: "One agreed price and what it covers, without quantities",
};

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ customer?: string; type?: string }> }) {
  const sp = await searchParams;
  const { business: b } = await requireBusiness();
  const title = invoiceTitle(b.country, b.vatRegistered, b.titleStyle);
  const crumbs = <AppCrumbs area="in" trail={[{ label: "Coming in", href: "/app/in" }, { label: "All invoices", href: "/app/in/invoices" }, { label: "New invoice" }]} />;
  const billing = (["items", "time_materials", "fixed"] as const).find((x) => x === sp.type);

  // First: what kind of invoice.
  if (!billing) {
    const keep = sp.customer ? `&customer=${encodeURIComponent(sp.customer)}` : "";
    return (
      <>
        {crumbs}
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.03em]">What kind of {title}?</h1>
          <p className="max-w-[640px] text-ink2">Pick how you&apos;re charging. Every kind gets its number when you send it, and shows {b.vatRegistered ? "VAT" : "its total"} the same way.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {TYPES.map((t) => (
            <li key={t.id}>
              <Link href={t.id === "recurring" ? "/app/in/repeating/new" : `/app/in/invoices/new?type=${t.id}${keep}`}
                className="flex h-full min-h-[132px] items-start gap-4 rounded-3xl border-2 border-line bg-white p-5 no-underline hover:border-ink focus-visible:border-ink">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-tint"><Icon d={t.icon} size={20} /></span>
                <span className="flex flex-col gap-1">
                  <span className="text-[18px] font-bold">{t.title}</span>
                  <span className="text-[15px] text-ink2">{t.line}</span>
                  <span className="text-[13px] text-muted">{t.example}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </>
    );
  }

  const [customers, items, summary] = await Promise.all([
    load(comingIn.listCustomers),
    load(comingIn.listItems),
    load(comingIn.summary),
  ]);
  const now = today();
  const kind = billing === "fixed" ? "Fixed price" : billing === "time_materials" ? "Time and materials" : null;
  return (
    <>
      {crumbs}
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-bold text-ink2"><span className="size-2 rounded-full bg-coming" aria-hidden />{summary.numbers.invoice} · Not saved yet</span>
        <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.03em]">New {title}{kind ? <span className="text-ink2"> · {kind}</span> : null}</h1>
        <p className="max-w-[640px] text-ink2">
          {LEAD[billing]}, {b.vatRegistered ? "VAT per line" : "notes"}{b.country === "lk" && b.ssclRegistered ? " and SSCL" : ""}. It gets its number when you send it.{" "}
          <Link href={`/app/in/invoices/new${sp.customer ? `?customer=${encodeURIComponent(sp.customer)}` : ""}`} className="font-semibold underline underline-offset-4">Change the kind</Link>
        </p>
      </div>
      <DocEditor
        mode="invoice"
        billing={billing}
        business={editorBusiness(b)}
        customers={editorCustomers(customers.customers)}
        items={items.items}
        number={summary.numbers.invoice}
        today={now}
        initial={{ customerId: customers.customers.some((c) => c.id === sp.customer) ? sp.customer : undefined, issueDate: now, termsDays: b.termsDays, lines: [] }}
        action={saveInvoice}
        cancelHref="/app/in/invoices"
      />
    </>
  );
}
