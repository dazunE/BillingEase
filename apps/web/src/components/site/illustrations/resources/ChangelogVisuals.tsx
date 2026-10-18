import type { ChangeVisual } from "@/content/site/changelog";
import type { SiteCountry } from "@/content/site/country";

/*
 * Small pictures for the big changelog entries (prototype SiteChangelog "big"
 * cards). Drawn with HTML so text stays crisp. Decorative: aria-hidden.
 */

const box = "flex flex-wrap items-center justify-center gap-4 rounded-[20px] bg-bg px-5 py-6";
const card = "rounded-[14px] border-2 border-ink bg-white p-3.5 text-[12px] leading-tight";

export function ChangelogVisual({ kind, country }: { kind: ChangeVisual; country: SiteCountry }) {
  const sym = country === "uk" ? "£" : "Rs ";
  switch (kind) {
    case "taxInvoice":
      return (
        <div aria-hidden className={box}>
          <div className={`${card} w-[230px]`}>
            <div className="flex justify-between font-bold">
              <span>{country === "uk" ? "VAT invoice" : "Tax Invoice"}</span>
              <span className="text-muted">INV-0042</span>
            </div>
            <div className="mt-2.5 flex justify-between text-ink2">
              <span>Design services</span>
              <span>{country === "uk" ? "£1,200.00" : "Rs 250,000.00"}</span>
            </div>
            {country === "lk" && (
              <div className="mt-1 flex justify-between text-ink2">
                <span>SSCL 2.5%</span>
                <span>Rs 6,250.00</span>
              </div>
            )}
            <div className="mt-1 flex justify-between text-ink2">
              <span>{country === "uk" ? "VAT 20%" : "VAT 18%"}</span>
              <span>{country === "uk" ? "£240.00" : "Rs 46,125.00"}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-ink pt-2 text-[14px] font-bold">
              <span>Total</span>
              <span>{country === "uk" ? "£1,440.00" : "Rs 302,375.00"}</span>
            </div>
          </div>
          <div className={`${card} flex w-[150px] flex-col gap-2`}>
            <span className="font-bold">Record a payment</span>
            <span className="rounded-full bg-tint px-2 py-1 text-center font-bold">{country === "uk" ? "Bank transfer" : "Cheque No. 104233"}</span>
            <span className="rounded-full bg-pos-bg px-2 py-1 text-center font-bold text-pos">Paid</span>
          </div>
        </div>
      );
    case "goingOut":
      return (
        <div aria-hidden className={box}>
          <div className={`${card} w-[200px]`}>
            <span className="font-bold">Expense</span>
            <div className="mt-2 flex justify-between text-ink2">
              <span>Office costs</span>
              <span>{sym}{country === "uk" ? "36.00" : "8,500.00"}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-bg px-2 py-1.5 text-ink2">
              <span className="flex size-6 items-center justify-center rounded bg-going-tint font-bold text-ink">PDF</span>
              receipt.pdf
            </div>
          </div>
          <div className={`${card} w-[170px]`}>
            <span className="font-bold">Bill · {country === "uk" ? "Aire Print" : "Lanka Paper Co"}</span>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
              <div className="h-full w-[60%] rounded-full bg-going" />
            </div>
            <span className="mt-1.5 block text-muted">Paid in part · 60%</span>
          </div>
        </div>
      );
    case "home":
      return (
        <div aria-hidden className={box}>
          {[
            { k: "Coming in", v: country === "uk" ? "£12,400" : "Rs 2,040,000", c: "bg-white", dot: "bg-coming" },
            { k: "Going out", v: country === "uk" ? "£4,150" : "Rs 860,000", c: "bg-white", dot: "bg-going" },
            { k: "Yours to keep", v: country === "uk" ? "£6,480" : "Rs 960,000", c: "bg-ink text-white", dot: "bg-violet" },
          ].map((n) => (
            <div key={n.k} className={`flex w-[150px] flex-col gap-1 rounded-[14px] border-2 border-ink p-3 ${n.c}`}>
              <span className="flex items-center gap-1.5 text-[12px] font-bold">
                <span className={`size-2 rounded-full ${n.dot}`} />
                {n.k}
              </span>
              <span className={`whitespace-nowrap font-display text-[17px] font-bold tracking-[-0.02em] ${n.k === "Yours to keep" ? "text-violet" : ""}`}>{n.v}</span>
            </div>
          ))}
        </div>
      );
    case "countries":
      return (
        <div aria-hidden className={box}>
          {[
            { flag: "£", name: "United Kingdom", line: "Pounds · 6 April to 5 April", on: country === "uk" },
            { flag: "Rs", name: "Sri Lanka", line: "Rupees · 1 April to 31 March", on: country === "lk" },
          ].map((c) => (
            <div key={c.name} className={`flex w-[210px] items-center gap-3 rounded-[14px] border-2 p-3 ${c.on ? "border-ink bg-white" : "border-line bg-white/60"}`}>
              <span className={`flex size-9 flex-none items-center justify-center rounded-full text-[13px] font-bold ${c.on ? "bg-violet" : "bg-surface"}`}>{c.flag}</span>
              <span className="flex flex-col">
                <span className="text-[13px] font-bold">{c.name}</span>
                <span className="text-[11px] text-muted">{c.line}</span>
              </span>
            </div>
          ))}
        </div>
      );
    case "spec":
      return (
        <div aria-hidden className={box}>
          <div className={`${card} flex w-[260px] flex-col gap-1.5`}>
            <span className="font-bold">In · Out</span>
            {["Entries you make by hand", "Your accountant sees the same books", "Bank feeds and card payments", "Receipt reading, the US"].map((x, i) => (
              <span key={x} className={`flex items-center gap-2 ${i > 1 ? "text-muted line-through" : ""}`}>
                <span className={`flex size-4 flex-none items-center justify-center rounded-full text-[10px] font-bold ${i > 1 ? "bg-surface" : "bg-pos-bg text-pos"}`}>{i > 1 ? "×" : "✓"}</span>
                {x}
              </span>
            ))}
          </div>
        </div>
      );
    case "prototype":
      return (
        <div aria-hidden className={box}>
          <svg viewBox="0 0 300 110" width="300" className="max-w-full">
            <rect x="4" y="4" width="292" height="102" rx="12" fill="#FFFFFF" stroke="#18161F" strokeWidth="2" />
            <circle cx="20" cy="18" r="4" fill="#E0752D" />
            <circle cx="32" cy="18" r="4" fill="#F4C3A1" />
            <circle cx="44" cy="18" r="4" fill="#CBC7D3" />
            <rect x="18" y="34" width="82" height="56" rx="8" fill="#EEE8FF" stroke="#18161F" strokeWidth="1.5" />
            <rect x="108" y="34" width="82" height="56" rx="8" fill="#FDE6D6" stroke="#18161F" strokeWidth="1.5" />
            <rect x="198" y="34" width="84" height="56" rx="8" fill="#18161F" />
            <path d="M28 70h50M118 70h44M208 70h56" stroke="#18161F" strokeWidth="6" strokeLinecap="round" />
            <path d="M208 70h56" stroke="#B9A3FF" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
      );
  }
}
