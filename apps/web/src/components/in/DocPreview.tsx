import { describeRate, formatMoney, rulesFor, type CountryCode, type Currency } from "@billingease/core";
import { BrandMark, cx } from "@/components/ui";
import { qty } from "./bits";

/** What the preview shows. Laid out like the PDF the customer gets. */
export type PreviewData = {
  kind: "invoice" | "credit_note" | "quote";
  country: CountryCode;
  /** The document's currency: the amounts are in it. */
  currency: string;
  /** For a document in another currency: the same totals in the home currency, and the rate. */
  home?: { currency: Currency; rate: string; net: number; vat: number; sscl: number; total: number; indicative?: boolean } | null;
  title: string;
  number: string | null;
  status: string;
  seller: { name: string; address?: string | null; email?: string | null; phone?: string | null; taxId?: string | null; vatNumber?: string | null };
  buyer: { name: string; address?: string | null; email?: string | null; taxId?: string | null; vatNumber?: string | null } | null;
  dates: [string, string][];
  vatRegistered: boolean;
  lines: { description: string; quantityMilli: number; unitPrice: number; discount: number; vatRateId: string | null; net: number; vat: number; sscl: number }[];
  net: number; vat: number; sscl: number; total: number; paid: number; credited: number;
  paymentDetails?: string | null;
  note?: string | null;
  notes?: string | null;
  modeOfPayment?: string | null;
};

export function DocPreview({ d, compact = false }: { d: PreviewData; compact?: boolean }) {
  const rules = rulesFor(d.country);
  const lk = d.country === "lk";
  const m = (minor: number) => formatMoney(minor, d.currency, { decimals: "always", homeOf: d.home?.currency });
  const hm = (minor: number) => formatMoney(minor, d.home!.currency, { decimals: "always" });
  const mode = d.vatRegistered ? (lk ? "lktax" : "ukvat") : lk && d.sscl > 0 ? "lktax" : "plain";
  const rateLabel = (id: string | null) => (id ? (rules.vatRates.find((r) => r.id === id)?.label ?? id).replace(/ \(.*\)$/, "") : "-");
  const byRate = new Map<string, { label: string; base: number; vat: number }>();
  for (const l of d.lines) {
    if (!l.vatRateId) continue;
    const row = byRate.get(l.vatRateId) ?? { label: rules.vatRates.find((r) => r.id === l.vatRateId)?.label ?? l.vatRateId, base: 0, vat: 0 };
    row.base += l.net + (rules.ssclInVatBase ? l.sscl : 0);
    row.vat += l.vat;
    byRate.set(l.vatRateId, row);
  }
  const rates = [...byRate.values()];
  const open = d.total - d.paid - d.credited;
  const sellerTax = lk
    ? [d.seller.taxId && `${rules.wording.taxIdLabel}: ${d.seller.taxId}`, d.seller.vatNumber && `${rules.wording.vatIdLabel}: ${d.seller.vatNumber}`]
    : [d.seller.vatNumber && `${rules.wording.vatIdLabel}: ${d.seller.vatNumber}`];
  const buyerTax = d.buyer
    ? lk
      ? [d.buyer.taxId && `${rules.wording.taxIdLabel}: ${d.buyer.taxId}`, d.buyer.vatNumber && `${rules.wording.vatIdLabel}: ${d.buyer.vatNumber}`]
      : [d.buyer.vatNumber && `${rules.wording.vatIdLabel}: ${d.buyer.vatNumber}`]
    : [];
  const pad = compact ? "p-5" : "p-[clamp(18px,3vw,36px)]";

  return (
    <article aria-label={`${d.title} preview`} className={cx("flex flex-col gap-5 rounded-[18px] border border-line bg-white text-[13px] text-ink shadow-[0_6px_24px_rgba(24,22,31,0.06)]", pad)}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-2.5"><BrandMark size={26} /><span className="font-display text-[17px] font-bold">{d.seller.name}</span></span>
          <span className="text-xs leading-relaxed text-ink2">
            {[d.seller.address, [d.seller.email, d.seller.phone].filter(Boolean).join(" · "), ...sellerTax].filter(Boolean).map((s, i) => <span key={i} className="block break-words">{s}</span>)}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-display text-[22px] font-bold leading-tight">{d.title}</span>
          <span className="text-xs font-bold text-ink2">{d.number ?? "Draft"}</span>
        </div>
      </header>

      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{d.kind === "quote" ? "Quote for" : lk ? "Purchaser" : "Bill to"}</span>
          <span className="text-[15px] font-bold">{d.buyer?.name ?? "Choose a customer"}</span>
          {d.buyer && [d.buyer.address, d.buyer.email, ...buyerTax].filter(Boolean).map((s, i) => <span key={i} className="break-words text-xs text-ink2">{s}</span>)}
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 self-start text-xs">
          {d.dates.map(([k, v]) => (
            <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="text-right font-bold">{v}</dd></div>
          ))}
        </dl>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[300px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-ink text-left text-[10.5px] uppercase tracking-wide text-muted">
              <th className="py-1.5 pr-2 font-bold">Description</th>
              <th className="py-1.5 pr-2 text-right font-bold">Qty</th>
              <th className="py-1.5 pr-2 text-right font-bold">{lk ? "Unit price" : "Price"}</th>
              {mode === "ukvat" && <th className="py-1.5 pr-2 text-right font-bold">VAT rate</th>}
              <th className="py-1.5 text-right font-bold">{mode === "ukvat" ? "Net" : lk ? "Value" : "Amount"}</th>
              {mode === "ukvat" && <th className="py-1.5 pl-2 text-right font-bold">VAT</th>}
            </tr>
          </thead>
          <tbody>
            {d.lines.length === 0 && (
              <tr><td colSpan={6} className="py-3 text-muted">No lines yet</td></tr>
            )}
            {d.lines.map((l, i) => (
              <tr key={i} className="border-b border-divider align-top">
                <td className="py-2 pr-2">
                  <span className="block break-words">{l.description || "—"}</span>
                  {l.discount > 0 && <span className="block text-[11px] text-muted">Less discount {m(l.discount)}</span>}
                  {mode === "lktax" && d.vatRegistered && <span className="block text-[11px] text-muted">VAT {rateLabel(l.vatRateId)}{l.sscl > 0 ? " · SSCL" : ""}</span>}
                </td>
                <td className="tabular py-2 pr-2 text-right">{qty(l.quantityMilli)}</td>
                <td className="tabular whitespace-nowrap py-2 pr-2 text-right">{m(l.unitPrice)}</td>
                {mode === "ukvat" && <td className="tabular py-2 pr-2 text-right">{rateLabel(l.vatRateId)}</td>}
                <td className="tabular whitespace-nowrap py-2 text-right">{m(l.net)}</td>
                {mode === "ukvat" && <td className="tabular whitespace-nowrap py-2 pl-2 text-right">{m(l.vat)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto grid w-full max-w-[340px] grid-cols-[1fr_auto] gap-x-4 gap-y-1.5">
        {mode === "plain" && <Row label="Total" value={m(d.total)} strong />}
        {mode === "ukvat" && (
          <>
            <Row label="Total excluding VAT" value={m(d.net)} />
            <Row label="VAT" value={m(d.vat)} />
            <Row label="Total including VAT" value={m(d.total)} strong />
          </>
        )}
        {mode === "lktax" && (
          <>
            <Row label="Value of supply" value={m(d.net)} />
            {d.sscl > 0 && <Row label={`SSCL ${rules.ssclBps / 100}%`} sub="Social Security Contribution Levy" value={m(d.sscl)} />}
            {rates.map((r) => <Row key={r.label} label={`VAT ${r.label}`} sub={`on ${m(r.base)}${d.sscl > 0 && rules.ssclInVatBase ? " (value plus SSCL)" : ""}`} value={m(r.vat)} />)}
            <Row label={d.sscl > 0 && d.vatRegistered ? "Total including SSCL and VAT" : d.sscl > 0 ? "Total including SSCL" : "Total including VAT"} value={m(d.total)} strong />
          </>
        )}
        {d.kind === "invoice" && d.credited > 0 && <Row label="Credited" value={`−${m(d.credited)}`} />}
        {d.kind === "invoice" && d.paid > 0 && <Row label="Paid" value={`−${m(d.paid)}`} />}
        {d.kind === "invoice" && (
          <div className="col-span-2 mt-1 flex items-baseline justify-between border-t border-ink pt-2">
            <span className="font-bold">{d.status === "paid" ? "Balance" : "Amount due"}</span>
            <span className="tabular font-display text-[22px] font-bold">{m(d.status === "void" ? 0 : open)}</span>
          </div>
        )}
      </dl>

      {d.home && (
        <dl className="ml-auto grid w-full max-w-[340px] grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-xl bg-bg px-3 py-2.5 text-xs" data-testid="preview-home">
          <div className="col-span-2 text-[11px] text-muted">{d.home.indicative ? "For reference, at" : "Converted at"} {describeRate(d.currency, d.home.currency, d.home.rate)}</div>
          {(d.home.vat > 0 || d.home.sscl > 0) && <Row label={`${mode === "lktax" ? "Value of supply" : "Excluding VAT"} in ${d.home.currency}`} value={hm(d.home.net)} />}
          {d.home.sscl > 0 && <Row label={`SSCL in ${d.home.currency}`} value={hm(d.home.sscl)} />}
          {d.home.vat > 0 && <Row label={`VAT in ${d.home.currency}`} value={hm(d.home.vat)} />}
          <Row label={`Total in ${d.home.currency}`} value={hm(d.home.total)} strong />
        </dl>
      )}

      {mode === "ukvat" && rates.length > 0 && (
        <table className="w-full max-w-[360px] text-xs">
          <thead><tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wide text-muted"><th className="py-1 font-bold">VAT summary</th><th className="py-1 text-right font-bold">Net</th><th className="py-1 text-right font-bold">VAT</th></tr></thead>
          <tbody>{rates.map((r) => <tr key={r.label}><td className="py-1">{r.label}</td><td className="tabular py-1 text-right">{m(r.base)}</td><td className="tabular py-1 text-right">{m(r.vat)}</td></tr>)}</tbody>
        </table>
      )}

      {lk && d.kind === "invoice" && d.modeOfPayment && (
        <p className="text-xs"><strong>Mode of payment</strong> <span className="text-ink2">{d.modeOfPayment}</span></p>
      )}
      {d.status === "void" && <p className="rounded-xl bg-surface px-4 py-3 text-xs font-bold">This was voided. Nothing is owed on it.</p>}
      {d.kind === "invoice" && d.status === "paid" && <p className="rounded-xl bg-pos-bg px-4 py-3 text-xs font-bold text-pos">Paid in full. Thank you!</p>}
      {d.notes && <p className="whitespace-pre-line rounded-xl bg-surface px-4 py-3 text-xs">{d.kind === "credit_note" ? <><strong>Reason</strong><br /></> : null}{d.notes}</p>}
      {d.kind !== "credit_note" && d.kind !== "quote" && d.paymentDetails && <p className="whitespace-pre-line rounded-xl bg-tint px-4 py-3 text-xs"><strong>How to pay</strong><br />{d.paymentDetails}</p>}
      {d.note && <p className="whitespace-pre-line rounded-xl bg-surface px-4 py-3 text-xs">{d.note}</p>}
      {lk && d.sscl > 0 && rules.ssclInVatBase && (
        <p className="text-[11px] text-muted">SSCL is shown as its own line and included in the value VAT is charged on (to confirm with IRD).</p>
      )}
    </article>
  );
}

function Row({ label, sub, value, strong }: { label: string; sub?: string; value: string; strong?: boolean }) {
  return (
    <div className={cx("col-span-2 flex items-start justify-between gap-4", strong && "border-t border-ink pt-1.5")}>
      <span className={cx("flex flex-col", strong ? "font-bold" : "text-ink2")}>{label}{sub && <span className="text-[11px] font-normal text-muted">{sub}</span>}</span>
      <span className={cx("tabular whitespace-nowrap", strong && "font-bold")}>{value}</span>
    </div>
  );
}
