import { formatDate, formatMoney } from "@billingease/core";
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/components/ui";

/**
 * Pieces shared by the Yours to keep pages (prototype Quarters, TaxPeriods, BooksReports,
 * BooksTax, BooksCategories): the dark summary card, the row of period cards and line tables.
 */

type Cur = "GBP" | "LKR" | "USD";
export const pence = (minor: number, cur: Cur) => formatMoney(minor, cur, { decimals: "always" });
export const signed = (minor: number, cur: Cur) => (minor < 0 ? "−" : "") + pence(Math.abs(minor), cur);
export const shortDate = (d: string) => formatDate(d);
export const longDate = (d: string) => formatDate(d, { year: true });
export const range = (from: string, to: string) => `${formatDate(from)} – ${formatDate(to, { year: from.slice(0, 4) !== to.slice(0, 4) })}`;

export function Hero({ eyebrow, big, children, chips, tiles }: { eyebrow: string; big: ReactNode; children?: ReactNode; chips?: ReactNode; tiles?: { label: string; value: string; accent?: boolean }[] }) {
  return (
    <section className="grid items-center gap-6 rounded-[28px] bg-ink p-[clamp(22px,4vw,36px)] text-white md:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div className="flex min-w-0 flex-col gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold"><span className="size-2 rounded-full bg-violet" />{eyebrow}</span>
        <span className="font-display text-[clamp(40px,7vw,68px)] font-bold leading-[1.02] tracking-[-0.04em] text-violet tabular-nums [overflow-wrap:anywhere]">{big}</span>
        {children && <p className="max-w-[620px] text-[15.5px] leading-relaxed text-white/85">{children}</p>}
        {chips && <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-white/80">{chips}</div>}
      </div>
      {tiles && tiles.length > 0 && (
        <dl className="grid grid-cols-2 gap-2.5">
          {tiles.map((t) => (
            <div key={t.label} className="flex flex-col gap-0.5 rounded-2xl bg-white/[0.08] px-4 py-3">
              <dt className="text-xs text-white/75">{t.label}</dt>
              <dd className={cx("font-display text-[clamp(17px,2vw,21px)] font-bold tabular-nums", t.accent ? "text-violet" : "text-white")}>{t.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

const STATE: Record<string, [string, string]> = {
  sent: ["Sent", "bg-pos-bg text-pos"],
  late: ["Overdue", "bg-late-bg text-late"],
  closed: ["To send", "bg-due-bg text-due"],
  open: ["Open", "bg-surface text-ink2"],
  upcoming: ["Not started", "bg-surface text-muted"],
};

export function StatePill({ state, label }: { state: string; label?: string }) {
  const [words, tone] = STATE[state] ?? STATE.open;
  return <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", tone)}>{label ?? words}</span>;
}

/** The periods of the year as cards; the chosen one is outlined. */
export function PeriodCards({ items }: { items: { id: string; title: string; sub: string; note: string; state: string; stateLabel?: string; href: string; on: boolean }[] }) {
  return (
    <nav aria-label="Periods" className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
      {items.map((p) => (
        <Link key={p.id} href={p.href} scroll={false} aria-current={p.on ? "page" : undefined}
          className={cx("flex min-w-[200px] flex-1 flex-col gap-1 rounded-[20px] bg-white px-4 py-3.5 no-underline", p.on ? "border-2 border-ink" : "border border-line hover:border-input")}>
          <span className="flex items-center justify-between gap-2"><span className="font-display text-[17px] font-bold">{p.title}</span><StatePill state={p.state} label={p.stateLabel} /></span>
          <span className="text-[13px] text-ink2">{p.sub}</span>
          <span className="text-xs text-muted">{p.note}</span>
        </Link>
      ))}
    </nav>
  );
}

export function Panel({ id, title, aside, sub, children, className }: { id: string; title: ReactNode; aside?: ReactNode; sub?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cx("flex min-w-0 flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={id} className="font-display text-[22px] font-bold tracking-[-0.02em]">{title}</h2>
          {sub && <span className="text-[13px] text-muted">{sub}</span>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export type Row = { key: string; name: ReactNode; sub?: ReactNode; tag?: { text: string; tone: "late" | "neutral" | "violet" }; count?: string; amount: string; tone?: "late"; href?: string };

const TAG = { late: "bg-late-bg text-late", neutral: "bg-surface text-ink2", violet: "bg-tint text-ink" };

/** Name, its official name underneath, how many entries and the amount. */
export function Lines({ heading, rows, total, empty }: { heading?: string; rows: Row[]; total?: { label: string; sub?: string; amount: string; band?: boolean }; empty?: string }) {
  return (
    <div className="flex flex-col">
      {heading && <span className="border-b border-line pb-2 text-xs font-bold uppercase tracking-[0.05em] text-muted">{heading}</span>}
      {rows.length === 0 && empty && <p className="py-3 text-sm text-muted">{empty}</p>}
      <ul className="flex flex-col">
        {rows.map((r) => {
          const inner = (
            <>
              <span className="flex min-w-0 flex-col">
                <span className="flex flex-wrap items-center gap-2 text-[14.5px] font-semibold">{r.name}{r.tag && <span className={cx("rounded-full px-2 py-px text-[11px] font-bold", TAG[r.tag.tone])}>{r.tag.text}</span>}</span>
                {r.sub && <span className="text-xs text-muted">{r.sub}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-4">
                {r.count && <span className="text-[13px] text-muted max-sm:hidden">{r.count}</span>}
                <span className={cx("min-w-[96px] text-right font-semibold tabular-nums", r.tone === "late" && "text-late")}>{r.amount}</span>
              </span>
            </>
          );
          return (
            <li key={r.key} className="border-b border-divider last:border-0">
              {r.href ? <Link href={r.href} className="flex items-center justify-between gap-4 py-3 no-underline hover:bg-bg">{inner}</Link> : <div className="flex items-center justify-between gap-4 py-3">{inner}</div>}
            </li>
          );
        })}
      </ul>
      {total && (
        <div className={cx("flex items-center justify-between gap-4 py-3", total.band ? "mt-2 rounded-xl bg-tint px-3" : "border-t-2 border-ink")}>
          <span className="flex flex-col"><span className="font-bold">{total.label}</span>{total.sub && <span className="text-xs text-muted">{total.sub}</span>}</span>
          <span className="font-display text-lg font-bold tabular-nums">{total.amount}</span>
        </div>
      )}
    </div>
  );
}

/** A readiness check: green tick, or an amber flag with what to do. */
export function Checks({ items }: { items: { id: string; label: string; detail: string; ok: boolean; href: string | null; cta?: string }[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((c) => (
        <li key={c.id} className="flex items-start gap-3 rounded-2xl bg-bg p-3.5">
          <span aria-hidden className={cx("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", c.ok ? "bg-pos-bg text-pos" : "bg-due-bg text-due")}>{c.ok ? "✓" : "!"}</span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[14.5px] font-semibold">{c.label}<span className="sr-only">{c.ok ? " (done)" : " (to do)"}</span></span>
            <span className="text-[13px] text-ink2">{c.detail}</span>
          </span>
          {!c.ok && c.href && <Link href={c.href} className={cx("inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold", c.cta ? "bg-ink/[0.07] text-ink hover:bg-ink/[0.11]" : "bg-ink text-white")}>{c.cta ?? "Fix"}</Link>}
        </li>
      ))}
    </ul>
  );
}
