import { comingIn, type QuoteRow } from "@billingease/contracts";
import { formatDate } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AlsoIn, Chip, Empty, HeroCard, QuoteBadge, fmt } from "@/components/in/bits";
import { ButtonLink, ICONS, Icon } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Quotes" };

function QuoteCard({ q, currency }: { q: QuoteRow; currency: "GBP" | "LKR" | "USD" }) {
  const line = q.status === "sent" ? `Expires ${formatDate(q.expiryDate)}` : q.status === "draft" ? "Not sent yet" : q.status === "accepted" ? "Ready to invoice" : q.status === "invoiced" && q.invoiceNumber ? `Became ${q.invoiceNumber}` : q.decidedAt ? formatDate(q.decidedAt.slice(0, 10)) : "";
  return (
    <li>
      <Link href={`/app/in/quotes/${q.id}`} className="flex flex-col gap-1 rounded-[20px] border border-line bg-white p-4 hover:border-input">
        <span className="flex items-baseline justify-between gap-3"><strong className="truncate text-[16px]">{q.customerName}</strong><strong className="tabular">{fmt(q.total, q.currency, currency)}</strong></span>
        <span className="truncate text-sm text-ink2">{[q.summary, q.number].filter(Boolean).join(" · ") || "Draft"}</span>
        <span className="flex flex-wrap items-center gap-2 text-[13px] text-muted"><QuoteBadge q={q} />{line}</span>
      </Link>
    </li>
  );
}

export default async function QuotesPage() {
  const { business: b } = await requireBusiness();
  const { quotes, totals } = await load(comingIn.listQuotes);
  const cur = b.currency;
  const groups = [
    { key: "sent", title: "Waiting for an answer", items: quotes.filter((q) => q.status === "sent") },
    { key: "draft", title: "Drafts", items: quotes.filter((q) => q.status === "draft") },
    { key: "accepted", title: "Accepted", items: quotes.filter((q) => q.status === "accepted" || q.status === "invoiced") },
    { key: "declined", title: "Declined", items: quotes.filter((q) => q.status === "declined") },
  ];
  return (
    <>
      <AppCrumbs area="in" trail={[{ label: "Coming in", href: "/app/in" }, { label: "Quotes" }]} />
      <HeroCard
        title="Quotes"
        intro="A price you send before the work starts. When your customer says yes, mark it accepted and turn it into an invoice in one step. Some apps call these estimates."
        chips={<>
          <Chip label="Waiting" value={fmt(totals.waiting, cur)} />
          <Chip tone="light" label="Drafts" value={fmt(totals.draft, cur)} />
          <Chip tone="pos" label="Ready to invoice" value={fmt(totals.accepted, cur)} />
        </>}
        aside={<>
          <p>Quotes don&apos;t count in Coming in. The moment you invoice an accepted quote, it&apos;s added as money on the way.</p>
          <ButtonLink href="/app/in/quotes/new"><Icon d={ICONS.plus} size={18} strokeWidth={2.4} />New quote</ButtonLink>
        </>}
      />
      {quotes.length === 0 ? <Empty>No quotes yet. <Link href="/app/in/quotes/new" className="font-semibold underline">Write your first one</Link>.</Empty> : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.filter((g) => g.items.length).map((g) => (
            <section key={g.key} className="flex flex-col gap-3" aria-labelledby={`q-${g.key}`}>
              <h2 id={`q-${g.key}`} className="text-[18px] font-bold">{g.title} <span className="text-muted">{g.items.length}</span></h2>
              <ul className="flex flex-col gap-2.5">{g.items.map((q) => <QuoteCard key={q.id} q={q} currency={cur} />)}</ul>
            </section>
          ))}
        </div>
      )}
      <AlsoIn except="/app/in/quotes" />
    </>
  );
}
