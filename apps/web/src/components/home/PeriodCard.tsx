import type { HomeSummary } from "@billingease/contracts";
import { formatDate } from "@billingease/core";
import { Badge } from "@/components/ui";
import { inDays, whole } from "./format";

type Card = NonNullable<HomeSummary["periodCard"]>;

function Stat({ label, value, tone }: { label: string; value: string; tone: "in" | "out" | "dark" | "plain" }) {
  const t = { in: "bg-tint", out: "bg-going-tint", dark: "bg-ink text-violet", plain: "bg-surface" }[tone];
  return (
    <span className={`flex min-w-0 flex-col gap-0.5 rounded-2xl p-3 ${t}`}>
      <span className={`text-xs font-semibold ${tone === "dark" ? "text-tint" : "text-ink2"}`}>{label}</span>
      <span className="tabular font-display text-lg font-bold tracking-[-0.02em] [overflow-wrap:anywhere] sm:text-xl">{value}</span>
    </span>
  );
}

const dueTone = (days: number) => (days < 0 ? "late" : days <= 10 ? "due" : "neutral") as "late" | "due" | "neutral";

/** UK: this MTD quarter. Sri Lanka: this month's VAT and SSCL return (only when registered). */
export function PeriodCard({ card, currency, practitioner }: { card: Card; currency: "GBP" | "LKR" | "USD"; practitioner: string }) {
  const m = (n: number) => whole(n, currency);
  if (card.kind === "quarter") {
    const c = card.current, p = card.previous;
    return (
      <section aria-labelledby="qc-h" className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,2.4vw,26px)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="qc-h" className="font-display text-xl font-bold tracking-[-0.02em]">{c.label} is open: {formatDate(c.from)} – {formatDate(c.to, { year: true })}</h2>
            <span className="text-[13px] text-muted">Making Tax Digital for Income Tax · quarterly update</span>
          </div>
          <Badge tone="neutral">Update due {formatDate(c.due, { year: true })}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <Stat label="Income" value={m(c.income)} tone="in" />
          <Stat label="Expenses" value={m(c.expenses)} tone="out" />
          <Stat label="Profit" value={m(c.profit)} tone="dark" />
        </div>
        {p && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-due-bg px-4 py-3 text-sm text-due">
            <strong>{p.label} has closed ({formatDate(p.from)} – {formatDate(p.to)}).</strong>
            <span>Its update is due {formatDate(p.due, { year: true })}, {inDays(p.daysToDue)}: profit {m(p.profit)}. Your {practitioner} sends it to HMRC.</span>
          </p>
        )}
        <span className="text-[13px] text-muted">Record income and expenses as they happen. Each quarter they&apos;re totalled in HMRC&apos;s categories so the update goes in on time.</span>
      </section>
    );
  }
  const c = card.current, p = card.previous;
  const tile = (x: typeof c, title: string) => (
    <article className="flex flex-col gap-3 rounded-[20px] border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold">{title}</span>
        <Badge tone={dueTone(x.daysToDue)}>Due {formatDate(x.due)} · {inDays(x.daysToDue)}</Badge>
      </div>
      <div className={`grid gap-2 ${card.vat && card.sscl ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
        {card.vat && <Stat label="VAT on sales" value={m(x.outputVat)} tone="in" />}
        {card.vat && <Stat label="VAT on purchases" value={m(x.inputVat)} tone="out" />}
        {card.vat && <Stat label="VAT payable" value={m(x.vatPayable)} tone="dark" />}
        {card.sscl && <Stat label="SSCL" value={m(x.sscl)} tone="plain" />}
      </div>
    </article>
  );
  return (
    <section aria-labelledby="mc-h" data-testid="vat-card" className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,2.4vw,26px)]">
      <div className="flex flex-col gap-1">
        <h2 id="mc-h" className="font-display text-xl font-bold tracking-[-0.02em]">{card.title}</h2>
        <span className="text-[13px] text-muted">Monthly, to the Inland Revenue Department · due on the 20th of the next month</span>
      </div>
      {p && tile(p, `${p.label.split(" ")[0]} return`)}
      {tile(c, `${c.label.split(" ")[0]} so far`)}
      <span className="text-[13px] text-muted">Output VAT on your Tax Invoices, input VAT on suppliers&apos; bills{card.sscl ? " and SSCL" : ""}, in the order of the IRD return. Your {practitioner} checks them before they go in.</span>
    </section>
  );
}
