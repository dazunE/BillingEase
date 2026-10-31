import { formatDate, formatMoney, type Currency } from "@billingease/core";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, ICONS, Icon, cx, type Tone } from "@/components/ui";

/** Small pieces shared by the Going out pages. */

export function Crumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-semibold">
      <Link href="/app" className="flex min-h-9 items-center gap-1.5 hover:underline">
        <Icon d={ICONS.arrowLeft} size={16} /> Home
      </Link>
      {trail.map((t, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="text-muted" aria-hidden>/</span>
          {t.href ? <Link href={t.href} className="hover:underline">{t.label}</Link> : <span aria-current="page">{t.label}</span>}
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
    <span aria-hidden className={cx("flex size-10 shrink-0 items-center justify-center rounded-full bg-going-tint text-[13px] font-bold", className)}>
      {initials(name)}
    </span>
  );
}

/** The paid / still to pay bar, in the Going out colours. */
export function SplitBar({ paid, toPay, className }: { paid: number; toPay: number; className?: string }) {
  const total = paid + toPay;
  const p = total > 0 ? Math.round((paid / total) * 1000) / 10 : 0;
  return (
    <span className={cx("flex h-3 gap-0.5 overflow-hidden rounded-full bg-surface", className)} aria-hidden>
      {paid > 0 && <span className="bg-going" style={{ width: `${p}%` }} />}
      {toPay > 0 && <span className="bg-going-light" style={{ width: `${100 - p}%` }} />}
    </span>
  );
}

export function Legend({ paid, toPay, currency, paidLabel = "paid", toPayLabel = "still to pay" }: { paid: number; toPay: number; currency: Currency | string; paidLabel?: string; toPayLabel?: string }) {
  return (
    <span className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-ink2">
      <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-[3px] bg-going" aria-hidden /><strong className="tabular text-ink">{formatMoney(paid, currency)}</strong> {paidLabel}</span>
      <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-[3px] bg-going-light" aria-hidden /><strong className="tabular text-ink">{formatMoney(toPay, currency)}</strong> {toPayLabel}</span>
    </span>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span aria-hidden className={cx("size-2.5 shrink-0 rounded-full bg-going", className)} />;
}

/** The top card on each Going out page: a label, the big number and an explanation with actions. */
export function HeroCard({ label, amount, sub, children, aside }: { label: ReactNode; amount: ReactNode; sub?: ReactNode; children?: ReactNode; aside?: ReactNode }) {
  return (
    <section className="flex flex-wrap items-end gap-x-8 gap-y-5 rounded-3xl border border-line bg-white p-[clamp(20px,3vw,32px)]">
      <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-3.5">
        <h1 className="flex items-center gap-2.5 text-base font-bold"><Dot />{label}</h1>
        <span className="font-display text-[clamp(40px,6vw,64px)] font-bold leading-none tracking-[-0.03em] tabular">{amount}</span>
        {sub}
      </div>
      {(children || aside) && <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 text-ink2">{aside}{children}</div>}
    </section>
  );
}

const DUE_TONE: Record<string, Tone> = { overdue: "late", late: "late", due_soon: "due", due: "neutral", paid: "pos", void: "neutral", recorded: "pos", paused: "neutral" };

export function dueText(b: { due: string; dueDate: string; daysToDue: number; lastPaidOn?: string | null; status?: string }) {
  if (b.due === "paid") return b.lastPaidOn ? `Paid ${formatDate(b.lastPaidOn)}` : "Paid";
  if (b.due === "void") return "Voided";
  const part = b.status === "part_paid" ? "Part paid · " : "";
  if (b.due === "overdue") return `${part}${-b.daysToDue} day${b.daysToDue === -1 ? "" : "s"} late`;
  if (b.daysToDue === 0) return `${part}Due today`;
  if (b.due === "due_soon") return `${part}Due ${formatDate(b.dueDate)} · in ${b.daysToDue} day${b.daysToDue === 1 ? "" : "s"}`;
  return `${part}Due ${formatDate(b.dueDate)}`;
}

export function DueBadge({ bill, className }: { bill: { due: string; dueDate: string; daysToDue: number; lastPaidOn?: string | null; status?: string }; className?: string }) {
  return <Badge tone={DUE_TONE[bill.due] ?? "neutral"} className={className}>{dueText(bill)}</Badge>;
}

export function StateBadge({ state, children }: { state: string; children: ReactNode }) {
  return <Badge tone={DUE_TONE[state] ?? "neutral"}>{children}</Badge>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-surface px-4 py-3.5 text-[15px] text-ink2">{children}</p>;
}

export function ToolCard({ href, icon, title, line, chip, chipTone = "neutral" }: { href: string; icon: string; title: string; line: string; chip: string; chipTone?: Tone }) {
  return (
    <Link href={href} className="flex flex-col gap-1 rounded-[22px] border border-line bg-white p-[18px] hover:border-input">
      <span className="mb-2 flex items-start justify-between">
        <span className="flex size-10 items-center justify-center rounded-xl bg-going-tint"><Icon d={icon} size={19} /></span>
        <Icon d={ICONS.arrowRight} size={18} className="text-muted" />
      </span>
      <span className="text-[17px] font-bold">{title}</span>
      <span className="text-sm text-muted">{line}</span>
      <Badge tone={chipTone} className="mt-2 self-start">{chip}</Badge>
    </Link>
  );
}

/** Groups items by calendar month, in the order given. */
export function byMonth<T extends { date: string }>(items: T[]) {
  const groups: { key: string; items: T[] }[] = [];
  for (const i of items) {
    const key = i.date.slice(0, 7);
    const g = groups.find((x) => x.key === key);
    if (g) g.items.push(i);
    else groups.push({ key, items: [i] });
  }
  return groups;
}

export const fileIcon = (mime: string) => (mime === "application/pdf" ? "PDF" : "IMG");
export function fileSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
