import type { InvoiceRow, QuoteRow, Recurring } from "@billingease/contracts";
import { formatDate, formatMoney, type Currency } from "@billingease/core";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, ICONS, Icon, cx, type Tone } from "@/components/ui";

/** Small pieces shared by the Coming in pages. */

export const fmt = (minor: number, currency: Currency) => formatMoney(minor, currency);
export const fmt2 = (minor: number, currency: Currency) => formatMoney(minor, currency, { decimals: "always" });

/** 1500 → "1.5" */
export function qty(milli: number) {
  return (milli / 1000).toLocaleString("en-GB", { maximumFractionDigits: 3 });
}

export function Crumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-semibold">
      <Link href="/app" className="flex min-h-9 items-center gap-1.5 hover:underline">
        <Icon d={ICONS.arrowLeft} size={16} /> Home
      </Link>
      {trail.map((t, i) => (
        <span key={i} className="flex min-w-0 items-center gap-2">
          <span className="text-muted" aria-hidden>/</span>
          {t.href ? <Link href={t.href} className="flex min-h-9 items-center hover:underline">{t.label}</Link> : <span aria-current="page" className="truncate">{t.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function initials(name: string) {
  return name.split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w) && !/^\(?(pvt|ltd|plc|&|and|co)\)?\.?$/i.test(w)).map((w) => w[0]!.toUpperCase()).slice(0, 2).join("") || "?";
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={cx("flex size-10 shrink-0 items-center justify-center rounded-full bg-tint text-[13px] font-bold", className)}>
      {initials(name)}
    </span>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span aria-hidden className={cx("size-2.5 shrink-0 rounded-full bg-coming", className)} />;
}

/** Received and still on the way, in the Coming in colours. */
export function SplitBar({ received, onTheWay, className }: { received: number; onTheWay: number; className?: string }) {
  const total = received + onTheWay;
  const p = total > 0 ? Math.round((received / total) * 1000) / 10 : 0;
  return (
    <span className={cx("flex h-3 gap-0.5 overflow-hidden rounded-full bg-surface", className)} aria-hidden>
      {received > 0 && <span className="bg-coming" style={{ width: `${p}%` }} />}
      {onTheWay > 0 && <span className="bg-coming-light" style={{ width: `${100 - p}%` }} />}
    </span>
  );
}

export function Legend({ received, onTheWay, currency }: { received: number; onTheWay: number; currency: Currency }) {
  return (
    <span className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-ink2">
      <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-[3px] bg-coming" aria-hidden /><strong className="tabular text-ink">{fmt(received, currency)}</strong> received</span>
      <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-[3px] bg-coming-light" aria-hidden /><strong className="tabular text-ink">{fmt(onTheWay, currency)}</strong> on the way</span>
    </span>
  );
}

/** The top card on each Coming in page. */
export function HeroCard({ title, intro, chips, aside, big }: { title: ReactNode; intro?: ReactNode; chips?: ReactNode; aside?: ReactNode; big?: boolean }) {
  return (
    <section className="flex flex-wrap items-end gap-x-8 gap-y-5 rounded-3xl border border-line bg-white p-[clamp(20px,3vw,32px)]">
      <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-3.5">
        {big ? title : (
          <h1 className="flex items-center gap-2.5 font-display text-[clamp(30px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.03em]"><Dot />{title}</h1>
        )}
        {intro && <p className="text-[16px] leading-relaxed text-ink2">{intro}</p>}
        {chips && <div className="flex flex-wrap gap-2">{chips}</div>}
      </div>
      {aside && <div className="flex min-w-0 flex-[1_1_320px] flex-col items-start gap-4 text-[15px] leading-relaxed text-ink2">{aside}</div>}
    </section>
  );
}

export function Chip({ tone = "violet", label, value }: { tone?: "violet" | "late" | "pos" | "light"; label: string; value: string }) {
  const dot = { violet: "bg-coming", late: "bg-late", pos: "bg-pos", light: "bg-coming-light" }[tone];
  return (
    <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-3.5 text-sm text-ink2">
      <span className={cx("size-2 rounded-full", dot)} aria-hidden />{label} <strong className="tabular text-ink">{value}</strong>
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line px-4 py-3.5 text-[15px] text-ink2">{children}</p>;
}

export function ToolCard({ href, icon, title, line, chip, chipTone = "neutral" }: { href: string; icon: string; title: string; line: string; chip: string; chipTone?: Tone }) {
  return (
    <Link href={href} className="flex flex-col gap-1 rounded-[22px] border border-line bg-white p-[18px] hover:border-input">
      <span className="mb-2 flex items-start justify-between">
        <span className="flex size-10 items-center justify-center rounded-xl bg-tint"><Icon d={icon} size={19} /></span>
        <Icon d={ICONS.arrowRight} size={18} className="text-muted" />
      </span>
      <span className="text-[17px] font-bold">{title}</span>
      <span className="text-sm text-muted">{line}</span>
      <Badge tone={chipTone} className="mt-2 self-start">{chip}</Badge>
    </Link>
  );
}

export function invoiceStatus(r: Pick<InvoiceRow, "shown" | "kind" | "dueDate" | "daysLate">): { tone: Tone; text: string } {
  if (r.kind === "credit_note") return { tone: "pos", text: "Credit note" };
  switch (r.shown) {
    case "draft": return { tone: "neutral", text: "Draft" };
    case "late": return { tone: "late", text: `${r.daysLate} day${r.daysLate === 1 ? "" : "s"} late` };
    case "part_paid": return { tone: "due", text: "Part paid" };
    case "paid": return { tone: "pos", text: "Paid" };
    case "void": return { tone: "neutral", text: "Void" };
    default: return { tone: "info", text: `Due ${formatDate(r.dueDate)}` };
  }
}

export function InvoiceBadge({ row }: { row: Pick<InvoiceRow, "shown" | "kind" | "dueDate" | "daysLate"> }) {
  const s = invoiceStatus(row);
  return <Badge tone={s.tone}>{s.text}</Badge>;
}

export function quoteStatus(q: Pick<QuoteRow, "status" | "invoiceNumber">): { tone: Tone; text: string } {
  switch (q.status) {
    case "draft": return { tone: "neutral", text: "Draft" };
    case "sent": return { tone: "info", text: "Waiting for an answer" };
    case "accepted": return { tone: "pos", text: "Accepted" };
    case "declined": return { tone: "late", text: "Declined" };
    default: return { tone: "pos", text: q.invoiceNumber ? `Invoiced · ${q.invoiceNumber}` : "Invoiced" };
  }
}

export function QuoteBadge({ q }: { q: Pick<QuoteRow, "status" | "invoiceNumber"> }) {
  const s = quoteStatus(q);
  return <Badge tone={s.tone}>{s.text}</Badge>;
}

/** One invoice as a row in a list. */
export function InvoiceLine({ r, currency, showCustomer = true }: { r: InvoiceRow; currency: Currency; showCustomer?: boolean }) {
  return (
    <li>
      <Link href={`/app/in/invoices/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl px-3 py-3 hover:bg-bg sm:flex-nowrap">
        {showCustomer && <Avatar name={r.customerName} className="hidden sm:flex" />}
        <span className="flex min-w-0 flex-[1_1_220px] flex-col">
          <span className="truncate text-[15px] font-semibold">{showCustomer ? r.customerName : (r.number ?? "Draft")}{showCustomer ? "" : r.summary ? ` · ${r.summary}` : ""}</span>
          <span className="truncate text-[13px] text-muted">{showCustomer ? [r.summary, r.number ?? "Draft"].filter(Boolean).join(" · ") : `Dated ${formatDate(r.issueDate, { year: true })}`}</span>
        </span>
        <InvoiceBadge row={r} />
        <span className="ml-auto flex flex-col items-end">
          <strong className="tabular text-[15px]">{fmt(r.status === "paid" || r.status === "void" || r.status === "draft" || r.kind === "credit_note" ? r.total : r.open, currency)}</strong>
          {r.open !== r.total && r.status !== "paid" && r.status !== "void" && r.status !== "draft" && <span className="tabular text-xs text-muted">of {fmt(r.total, currency)}</span>}
        </span>
      </Link>
    </li>
  );
}

export function AlsoIn({ except }: { except?: string }) {
  const links = [
    { href: "/app/in", label: "Coming in" },
    { href: "/app/in/invoices", label: "All invoices" },
    { href: "/app/in/quotes", label: "Quotes" },
    { href: "/app/in/repeating", label: "Repeating invoices and credit notes" },
    { href: "/app/in/customers", label: "Customers" },
    { href: "/app/in/prices", label: "Products and services" },
  ].filter((l) => l.href !== except);
  return (
    <nav aria-label="Also in Coming in" className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-4 text-[15px]">
      <span className="text-ink2">Also in Coming in:</span>
      {links.map((l) => <Link key={l.href} href={l.href} className="flex min-h-9 items-center font-semibold underline underline-offset-4">{l.label}</Link>)}
    </nav>
  );
}

export function Tabs({ tabs, current }: { tabs: { key: string; label: string; count?: number; href: string }[]; current: string }) {
  return (
    <nav aria-label="Show" className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === current ? "page" : undefined}
          className={cx("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold", t.key === current ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-input")}>
          {t.label}
          {t.count != null && <span className={cx("rounded-full px-1.5 text-xs", t.key === current ? "bg-white/20" : "bg-surface")}>{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function Panel({ title, aside, children, id, className }: { title: ReactNode; aside?: ReactNode; children: ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={cx("flex scroll-mt-6 flex-col gap-3 rounded-3xl border border-line bg-white p-[clamp(16px,2.5vw,24px)]", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[18px] font-bold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** The message after an action: what happened, or why it didn't. */
export function Notice({ done, error, messages }: { done?: string; error?: string; messages?: Record<string, string> }) {
  if (error) return <p role="alert" className="rounded-2xl bg-late-bg px-4 py-3 text-[15px] font-semibold text-late">{error}</p>;
  const text = done ? (messages?.[done] ?? null) : null;
  if (!text) return null;
  return <p role="status" className="flex items-center gap-2 rounded-2xl bg-pos-bg px-4 py-3 text-[15px] font-semibold text-pos"><Icon d={ICONS.check} size={18} />{text}</p>;
}

export const FREQ: Record<Recurring["frequency"], string> = { weekly: "every week", monthly: "every month", quarterly: "every 3 months", yearly: "every year" };
