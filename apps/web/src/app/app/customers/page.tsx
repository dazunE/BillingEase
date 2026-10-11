import type { Metadata } from "next";
import Link from "next/link";
import { EquationStrip } from "@/components/EquationStrip";
import { CustomerForm } from "@/components/in/CustomerForm";
import { Badge, ICONS, Icon } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { threeNumbers } from "@/lib/numbers";
import { listCustomers } from "@/lib/ops-in";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").slice(0, 100);
  const { business, db } = await requireBusiness();
  const t = today();
  const [n, rows] = await Promise.all([threeNumbers(db, business.id, "month", t), listCustomers(db, business.id, { q, today: t })]);
  const owed = rows.reduce((s, r) => s + r.openCents, 0);

  return (
    <>
      <EquationStrip n={n} current="in" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link href="/app/in" className="text-sm font-semibold text-ink2 hover:text-ink">
            Coming in
          </Link>
          <h1 className="font-display text-[clamp(28px,3.4vw,38px)] font-bold tracking-[-0.03em]">Customers</h1>
          {!q && rows.length > 0 && (
            <p className="text-[15px] text-ink2">
              {rows.length} customer{rows.length === 1 ? "" : "s"} · {formatMoney(owed)} owed to you in all
            </p>
          )}
        </div>
        <a href="#new" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-violet px-5 text-[15px] font-semibold hover:bg-[#a98ffb]">
          <Icon d={ICONS.plus} size={18} strokeWidth={2.4} />
          Add a customer
        </a>
      </div>

      <form role="search" action="/app/customers" className="flex min-h-11 w-full max-w-[420px] items-center gap-2 rounded-full border border-input bg-white pl-4 pr-1 focus-within:border-ink">
        <Icon d={ICONS.search} size={18} className="shrink-0 text-ink2" />
        <label htmlFor="cust-q" className="sr-only">
          Search customers
        </label>
        <input id="cust-q" name="q" type="search" defaultValue={q} placeholder="Name or email" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
        <button className="inline-flex min-h-9 items-center rounded-full bg-ink/[0.07] px-3.5 text-sm font-semibold hover:bg-ink/[0.11]">Search</button>
      </form>

      {rows.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-[20px] border border-line bg-white p-6 text-[15px] text-ink2">
          {q ? (
            <>
              <p>No customers match &ldquo;{q}&rdquo;.</p>
              <Link href="/app/customers" className="text-sm font-semibold text-ink underline underline-offset-4">
                Clear the search
              </Link>
            </>
          ) : (
            <p>No customers yet. Add your first one below, or just type a new name when you bill someone.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[20px] border border-line bg-white">
          <table className="w-full min-w-[340px] text-sm">
            <caption className="sr-only">Customers{q ? ` matching ${q}` : ""}</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="py-3 pl-5 pr-3 font-semibold">
                  Name
                </th>
                <th scope="col" className="px-3 py-3 font-semibold max-sm:hidden">
                  Email
                </th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">
                  Owes you
                </th>
                <th scope="col" className="py-3 pl-3 pr-5 text-right font-semibold">
                  Late
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="relative border-b border-divider last:border-0 hover:bg-bg">
                  <td className="py-3.5 pl-5 pr-3">
                    <Link href={`/app/customers/${c.id}`} className="font-semibold underline-offset-4 after:absolute after:inset-0 hover:underline">
                      {c.name}
                    </Link>
                    <span className="block truncate text-[13px] text-muted sm:hidden">{c.email ?? "No email"}</span>
                  </td>
                  <td className="max-w-[280px] truncate px-3 py-3.5 text-ink2 max-sm:hidden">{c.email ?? <span className="text-muted">No email</span>}</td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-right font-display font-bold tabular">{c.openCents > 0 ? formatMoney(c.openCents) : <span className="font-sans font-normal text-muted">—</span>}</td>
                  <td className="whitespace-nowrap py-3.5 pl-3 pr-5 text-right">{c.lateCents > 0 ? <Badge tone="late">{formatMoney(c.lateCents)} late</Badge> : <span className="text-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section id="new" aria-labelledby="new-h" className="flex scroll-mt-4 flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(20px,3vw,32px)]">
        <div className="flex flex-col gap-1">
          <h2 id="new-h" className="font-display text-2xl font-bold tracking-[-0.02em]">
            Add a customer
          </h2>
          <p className="text-sm text-ink2">A name is enough to start. Add an email so we can send invoices and reminders for you.</p>
        </div>
        <div className="max-w-[640px]">
          <CustomerForm submitLabel="Add customer" />
        </div>
      </section>
    </>
  );
}
