import { goingOut } from "@billingease/contracts";
import { formatDate, formatMoney } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveSupplier } from "@/app/app/out/actions";
import { Avatar, Crumbs, DueBadge, Empty } from "@/components/out/bits";
import { ActionButton } from "@/components/out/quick";
import { SupplierForm } from "@/components/out/SupplierForm";
import { Badge, ButtonLink, Card, ICONS, Icon } from "@/components/ui";
import { ApiFailure, load } from "@/lib/api";

export const metadata: Metadata = { title: "Supplier" };

export default async function SupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await load(goingOut.supplier, { params: { id } }).catch((err) => {
    if (err instanceof ApiFailure && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  });
  const setup = await load(goingOut.setup);
  const s = d.supplier;
  const fmt = (m: number) => formatMoney(m, setup.currency);
  const monthly = d.monthlyCosts.filter((c) => c.active);
  const payments = [
    ...d.expenses.map((e) => ({ key: `e${e.id}`, date: e.spentOn, title: e.note ?? e.categoryName ?? "To sort", sub: [e.chequeNumber ? `Cheque ${e.chequeNumber}` : e.method, e.attachmentCount ? "attached" : null].filter(Boolean).join(" · "), amount: e.gross, href: `/app/out/expenses/${e.id}` })),
    ...d.payments.map((p) => ({ key: `p${p.id}`, date: p.paidOn, title: `Bill${p.billReference ? ` ${p.billReference}` : ""}`, sub: p.chequeNumber ? `Cheque ${p.chequeNumber}${p.chequeBank ? `, ${p.chequeBank}` : ""}` : p.method, amount: p.amount, href: `/app/out/bills/${p.billId}` })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const vatLabel = setup.country === "uk" ? "VAT registration number" : "VAT registration number (TIN-VAT)";
  const details: [string, string | null][] = [
    ["Contact", s.contactName], ["Email", s.email], ["Phone", s.phone], ["Address", s.address],
    [vatLabel, s.vatNumber], ["Usually goes to", s.defaultCategoryName], ["Notes", s.notes],
  ];

  return (
    <>
      <Crumbs trail={[{ label: "Going out", href: "/app/out" }, { label: "Suppliers", href: "/app/out/suppliers" }, { label: s.name }]} />
      <Card className="flex flex-wrap items-start gap-x-6 gap-y-5 p-[clamp(20px,3vw,32px)]">
        <Avatar name={s.name} className="size-14 text-lg" />
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-2">
          <h1 className="font-display text-[clamp(26px,3.5vw,36px)] font-bold leading-tight tracking-[-0.03em]">{s.name}</h1>
          <span className="text-[15px] text-ink2">{[s.contactName, s.email, s.phone].filter(Boolean).join(" · ") || "No contact details yet"}</span>
          <span className="flex flex-wrap gap-2">
            {s.defaultCategoryName && <Badge tone="violet">{s.defaultCategoryName}</Badge>}
            {monthly.length > 0 && <Badge>Every month</Badge>}
            {s.vatNumber && <Badge tone="info">VAT registered</Badge>}
            {s.archived && <Badge tone="neutral">Archived</Badge>}
          </span>
          <div className="mt-2 flex flex-wrap gap-2.5">
            <ButtonLink href={`/app/out/bills/new?supplier=${encodeURIComponent(s.name)}`}><Icon d={ICONS.plus} size={18} strokeWidth={2.4} />Enter a bill</ButtonLink>
            {monthly.map((c) => <ButtonLink key={c.id} href="/app/out/monthly" variant="secondary">{fmt(c.amount)} every month</ButtonLink>)}
          </div>
        </div>
        <div className="flex flex-col items-start gap-0.5 sm:items-end">
          <span className="text-[13px] text-ink2">Paid this tax year ({d.taxYear})</span>
          <span className="font-display text-[clamp(28px,3.5vw,36px)] font-bold tracking-[-0.03em] tabular">{fmt(s.paidThisYear)}</span>
          <span className="text-[13px] text-ink2">{s.owed > 0 ? `${fmt(s.owed)} owed on ${s.openBills} bill${s.openBills === 1 ? "" : "s"}` : "Nothing owed right now"}</span>
        </div>
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-3 p-[clamp(18px,3vw,26px)]">
            <h2 className="font-display text-xl font-bold">Bills</h2>
            {d.bills.length === 0 ? <Empty>{monthly.length ? `You pay ${s.name} every month, so there are no bills to enter. Each payment you record shows under Payments made.` : `No bills from ${s.name} yet.`}</Empty> : (
              <ul className="flex flex-col divide-y divide-divider">
                {d.bills.map((b) => (
                  <li key={b.id}>
                    <Link href={`/app/out/bills/${b.id}`} className="flex flex-wrap items-center gap-3 py-3 hover:underline">
                      <span className="flex min-w-0 flex-[1_1_200px] flex-col"><span className="font-bold">{b.reference ?? "Bill"} · {b.description}</span><span className="text-[13px] text-muted">Dated {formatDate(b.billDate)}</span></span>
                      <DueBadge bill={b} />
                      <span className="font-bold tabular">{fmt(b.total)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="flex flex-col gap-3 p-[clamp(18px,3vw,26px)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-bold">Payments made</h2>
              <span className="text-[13px] text-muted">{fmt(s.paidThisYear)} this tax year</span>
            </div>
            {payments.length === 0 ? <Empty>Nothing paid to {s.name} yet.</Empty> : (
              <ul className="flex flex-col divide-y divide-divider">
                {payments.map((p) => (
                  <li key={p.key}>
                    <Link href={p.href} className="flex items-center gap-3 py-3 hover:underline">
                      <span className="flex min-w-0 flex-1 flex-col"><span className="font-bold">{formatDate(p.date)} · {p.title}</span><span className="text-[13px] text-muted">{p.sub}</span></span>
                      <span className="font-bold tabular">{fmt(p.amount)}</span>
                      <Icon d="m9 6 6 6-6 6" size={16} className="text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {d.monthlyCosts.length > 0 && (
            <Card className="flex flex-col gap-3 p-[clamp(18px,3vw,26px)]">
              <h2 className="font-display text-xl font-bold">Every month</h2>
              <ul className="flex flex-col divide-y divide-divider">
                {d.monthlyCosts.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="flex min-w-0 flex-1 flex-col"><span className="font-bold">{c.name}</span><span className="text-[13px] text-muted">{c.categoryName} · on day {c.dayOfMonth} · {c.method}</span></span>
                    <Badge tone={c.state === "recorded" ? "pos" : c.state === "late" ? "late" : "neutral"}>{c.state === "recorded" ? `Recorded ${formatDate(c.recordedOn!)}` : c.state === "paused" ? "Paused" : `Due ${formatDate(c.dueOn)}`}</Badge>
                    <span className="font-bold tabular">{fmt(c.amount)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        <aside className="flex flex-col gap-5">
          <Card className="flex flex-col gap-3 p-6">
            <h2 className="font-display text-xl font-bold">Details</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {details.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="min-w-0 whitespace-pre-line [overflow-wrap:anywhere]">{v}</dd></div>
              ))}
            </dl>
            <details className="group">
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-full bg-ink/[0.07] px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">Edit details</summary>
              <div className="mt-4"><SupplierForm supplier={s} categories={setup.categories} vatLabel={vatLabel} /></div>
            </details>
          </Card>
          <div className="flex flex-col gap-2 px-1">
            <p className="text-sm text-ink2">{s.archived ? "Paying them again?" : "Not paying them any more? Archiving hides them from your list; their payments stay in your books."}</p>
            <ActionButton action={archiveSupplier} fields={{ id: s.id, archived: String(!s.archived) }} variant={s.archived ? "secondary" : "danger"} className="self-start">
              {s.archived ? "Bring back" : "Archive supplier"}
            </ActionButton>
          </div>
        </aside>
      </div>
    </>
  );
}
