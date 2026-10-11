import type { HomeSummary } from "@billingease/contracts";
import { formatDate } from "@billingease/core";
import Link from "next/link";
import { ICONS, Icon } from "@/components/ui";
import { whole } from "./format";

function Bar({ parts, track = "bg-surface" }: { parts: { pct: number; className: string }[]; track?: string }) {
  return (
    <span className={`flex h-2.5 gap-0.5 overflow-hidden rounded-full ${track}`} aria-hidden>
      {parts.map((p, i) => <span key={i} className={p.className} style={{ width: `${Math.max(0, Math.min(100, p.pct))}%` }} />)}
    </span>
  );
}

const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

/** Coming in − Going out = Yours to keep, as three big cards. */
export function ThreeNumbers({ s, country, practitioner }: { s: HomeSummary; country: "uk" | "lk"; practitioner: string }) {
  const m = (n: number) => whole(n, s.currency);
  const { comingIn: i, goingOut: o, tax } = s;
  const profit = i.total - o.total;
  const taxWords = country === "lk" ? tax.label.toLowerCase() : tax.label;
  const card = "flex min-w-0 flex-[1_1_260px] flex-col gap-3.5 rounded-3xl p-6 no-underline";
  const op = "flex flex-[0_0_auto] items-center justify-center px-0.5 font-display text-[34px] font-bold text-muted max-[900px]:h-5 max-[900px]:basis-full max-[900px]:text-[26px]";
  return (
    <section aria-label="Your three numbers" className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-[13px] font-semibold text-muted">
        <span>{s.period.label} so far · {formatDate(s.period.from)} – {formatDate(s.period.soFar)}</span>
      </div>
      <div className="flex flex-wrap items-stretch gap-3">
        <Link href="/app/in" className={`${card} border border-line bg-white text-ink hover:border-input`}>
          <span className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[15px] font-bold"><span className="size-2.5 rounded-full bg-coming" />Coming in</span>
            <Icon d={ICONS.arrowRight} />
          </span>
          <span className="tabular font-display text-[clamp(30px,3.6vw,44px)] font-bold tracking-[-0.03em] [overflow-wrap:anywhere]" data-testid="coming-in">{m(i.total)}</span>
          <Bar parts={[{ pct: pct(i.received, i.total), className: "bg-coming" }, { pct: pct(i.onTheWay, i.total), className: "bg-coming-light" }]} />
          {i.total !== 0 ? (
            <span className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[13px] text-ink2">
              <span><strong className="text-ink">{m(i.received)}</strong> received</span>
              <span><strong className="text-ink">{m(i.onTheWay)}</strong> on the way</span>
            </span>
          ) : <span className="text-[13px] text-ink2">Invoices you send and payments you record add up here.</span>}
        </Link>
        <div aria-hidden className={op}>−</div>
        <Link href="/app/out" className={`${card} border border-line bg-white text-ink hover:border-input`}>
          <span className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[15px] font-bold"><span className="size-2.5 rounded-full bg-going" />Going out</span>
            <Icon d={ICONS.arrowRight} />
          </span>
          <span className="tabular font-display text-[clamp(30px,3.6vw,44px)] font-bold tracking-[-0.03em] [overflow-wrap:anywhere]" data-testid="going-out">{m(o.total)}</span>
          <Bar parts={[{ pct: pct(o.paid, o.total), className: "bg-going" }, { pct: pct(o.toPay, o.total), className: "bg-going-light" }]} />
          {o.total !== 0 ? (
            <span className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[13px] text-ink2">
              <span><strong className="text-ink">{m(o.paid)}</strong> paid</span>
              <span><strong className="text-ink">{m(o.toPay)}</strong> still to pay</span>
            </span>
          ) : <span className="text-[13px] text-ink2">{country === "lk" ? "Expenses, bills and payroll add up here." : "Expenses, bills and property costs add up here."}</span>}
        </Link>
        <div aria-hidden className={op}>=</div>
        <div className={`${card} bg-ink text-white`}>
          <span className="flex items-center gap-2 text-[15px] font-bold text-tint"><span className="size-2.5 rounded-full bg-violet" />Yours to keep</span>
          <span className="tabular font-display text-[clamp(30px,3.6vw,44px)] font-bold tracking-[-0.03em] text-violet [overflow-wrap:anywhere]" data-testid="keep">{m(s.keep)}</span>
          <Bar track="bg-tint/15" parts={[{ pct: profit > 0 ? pct(s.keep, profit) : 0, className: "bg-violet" }, { pct: profit > 0 ? pct(tax.share, profit) : 0, className: "bg-tint/45" }]} />
          <span className="text-[13px] leading-[1.45] text-tint">
            {profit > 0
              ? tax.share > 0
                ? <>after about <strong className="text-white">{m(tax.share)}</strong> {taxWords} set aside for this period, from an estimate of {m(tax.yearEstimate)} for {tax.taxYear}.</>
                : <>No {taxWords} expected on this yet.</>
              : <>No profit yet, so no {taxWords} to set aside.</>}
          </span>
          {tax.yearEstimate > 0 && (
            <details className="text-[13px] text-tint">
              <summary className="min-h-9 cursor-pointer font-semibold text-white">How the estimate works</summary>
              <ul className="mt-1 flex flex-col gap-1">
                <li>{(country === "uk" ? "Tax year" : "Year of assessment")} {tax.taxYear} profit so far {m(tax.yearToDateProfit)}, about {m(tax.projectedProfit)} over a full year.</li>
                {tax.lines.map((l) => <li key={l.label} className="flex justify-between gap-3"><span>{l.label} <span className="opacity-75">· {l.note}</span></span><span className="tabular">{m(l.amount)}</span></li>)}
              </ul>
            </details>
          )}
          <span className="mt-auto text-xs text-tint/80">{tax.wording.replace("your accountant", `your ${practitioner}`)}{tax.verified ? "" : " · rates to be checked"}</span>
        </div>
      </div>
    </section>
  );
}
