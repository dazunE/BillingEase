import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Card, ICONS, Icon, type Tone } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { formatDate, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { searchBusiness } from "@/lib/ops-keep";

export const metadata: Metadata = { title: "Search" };

function invoiceBadge(status: string, dueDate: string, t: string): { tone: Tone; label: string } {
  if (status === "paid") return { tone: "pos", label: "Paid" };
  if (status === "void") return { tone: "neutral", label: "Void" };
  if (status === "draft") return { tone: "neutral", label: "Draft" };
  return dueDate < t ? { tone: "late", label: "Late" } : { tone: "info", label: "Sent" };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? (sp.q[0] ?? "") : (sp.q ?? "");
  const { business, db } = await requireBusiness();
  const t = today();
  const r = await searchBusiness(db, business.id, raw);

  return (
    <>
      <Link href="/app" className="inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-semibold">
        <Icon d={ICONS.arrowLeft} size={16} />
        Home
      </Link>
      <section className="flex flex-col gap-4">
        <h1 className="font-display text-[clamp(28px,3.4vw,40px)] font-bold leading-tight tracking-[-0.03em]">
          {r.q ? (
            <>
              Results for <span className="rounded-lg bg-tint px-2">{r.q}</span>
            </>
          ) : (
            "Find anything"
          )}
        </h1>
        <form action="/app/search" role="search" className="flex max-w-[620px] flex-wrap gap-2">
          <label htmlFor="search-q" className="sr-only">
            Search customers, vendors, invoices and bank transactions
          </label>
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={r.q}
            placeholder="A customer, invoice number, vendor or bank description"
            className="min-h-11 min-w-0 flex-[1_1_260px] rounded-full border border-input bg-white px-4 text-[15px] focus:border-ink focus:outline-none"
          />
          <button className="inline-flex min-h-11 items-center rounded-full bg-violet px-5 text-[15px] font-semibold hover:bg-[#a98ffb]">Search</button>
        </form>
        {r.q && (
          <p className="text-sm text-ink2" role="status">
            {r.total === 0 ? "Nothing matched. Try part of a name, an invoice number like INV-0003, or a word from a bank description." : `${r.total} result${r.total === 1 ? "" : "s"}`}
          </p>
        )}
      </section>

      {r.total > 0 && (
        <div className="grid gap-5 min-[900px]:grid-cols-2">
          {r.customers.length > 0 && (
            <Group title="Customers" count={r.customers.length}>
              {r.customers.map((c) => (
                <Row key={c.id} href={`/app/invoices?q=${encodeURIComponent(c.name)}`} title={c.name} sub={c.email ?? "No email"} aside="Invoices" />
              ))}
            </Group>
          )}
          {r.invoices.length > 0 && (
            <Group title="Invoices" count={r.invoices.length}>
              {r.invoices.map((i) => {
                const b = invoiceBadge(i.status, i.dueDate, t);
                return (
                  <Row
                    key={i.id}
                    href={`/app/invoices/${i.id}`}
                    title={`${i.number} · ${i.customerName}`}
                    sub={`${formatMoney(i.totalCents)} · due ${formatDate(i.dueDate, { month: "short", day: "numeric", year: "numeric" })}`}
                    aside={<Badge tone={b.tone}>{b.label}</Badge>}
                  />
                );
              })}
            </Group>
          )}
          {r.vendors.length > 0 && (
            <Group title="Vendors" count={r.vendors.length}>
              {r.vendors.map((v) => (
                <Row key={v.id} href="/app/vendors" title={v.name} sub={v.email ?? "Someone you pay"} />
              ))}
            </Group>
          )}
          {r.transactions.length > 0 && (
            <Group title="Bank transactions" count={r.transactions.length}>
              {r.transactions.map((x) => (
                <Row
                  key={x.id}
                  href={`/app/transactions?q=${encodeURIComponent(x.description)}`}
                  title={x.description}
                  sub={`${formatDate(x.postedOn, { month: "short", day: "numeric", year: "numeric" })} · ${x.institution} ••${x.mask}`}
                  aside={<span className="font-bold tabular">{x.amountCents > 0 ? "+" : "−"}{formatMoney(Math.abs(x.amountCents))}</span>}
                />
              ))}
            </Group>
          )}
        </div>
      )}
    </>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <Card className="flex min-w-0 flex-col gap-2 p-5">
      <h2 className="font-display text-lg font-bold tracking-[-0.02em]">
        {title} <span className="text-muted">{count}</span>
      </h2>
      <ul className="flex flex-col">{children}</ul>
    </Card>
  );
}

function Row({ href, title, sub, aside }: { href: string; title: string; sub: string; aside?: ReactNode }) {
  return (
    <li className="border-b border-divider last:border-0">
      <Link href={href} className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 hover:bg-bg">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-semibold">{title}</span>
          <span className="truncate text-[13px] text-muted">{sub}</span>
        </span>
        {aside && <span className="flex-none text-[13px] text-ink2">{aside}</span>}
        <Icon d={ICONS.arrowRight} size={16} className="flex-none text-ink2" />
      </Link>
    </li>
  );
}
