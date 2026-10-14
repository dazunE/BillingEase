import { CashJar } from "@/components/CashJar";
import { cx } from "@/components/ui";
import { COUNTRY_META, type SiteCountry } from "@/content/site/country";
import s from "./product.module.css";

/* Decorative art for /features (prototype SiteFeatures band art and "Handled for you" tiles). All aria-hidden by the caller. */

const SAMPLE = {
  uk: {
    inv: { no: "INV-0042", who: "Kirkstall Brewing Co", what: "Autumn label designs", amt: "£1,850.00", total: "£1,850" },
    rows: [
      ["TRAIN TICKET LEEDS–HARROGATE", "Travel", "−£23.40", "#FDE6D6"],
      ["STUDIO RENT OCTOBER", "Premises", "−£450", "#EEE8FF"],
      ["PRINT SHOP BILL", "Office costs", "−£320", "#FFF0B8"],
      ["DESIGN SOFTWARE", "Office costs", "−£42", "#E2F6D5"],
    ],
    paid: "+£2,400",
    payNo: "INV-0039",
    remind: ["3 days before", "Due 20 Oct", "A week late"],
    tax: { profit: "Profit £19,220", share: "Tax estimated", keep: "£16,260 yours", owe: "£2,960 tax" },
    jar: "£16,260",
  },
  lk: {
    inv: { no: "TI-0187", who: "Kandyan Spice Co", what: "Packaging design", amt: "Rs 250,000", total: "Rs 302,375" },
    rows: [
      ["COURIER RECEIPT", "Postage", "−Rs 2,450", "#FDE6D6"],
      ["OFFICE RENT OCTOBER", "Rent", "−Rs 180,000", "#EEE8FF"],
      ["PRINTER TAX INVOICE", "Printing", "−Rs 46,000", "#FFF0B8"],
      ["INTERNET", "Utilities", "−Rs 12,500", "#E2F6D5"],
    ],
    paid: "+Rs 302,375",
    payNo: "TI-0187",
    remind: ["3 days before", "Due 20 Oct", "A week late"],
    tax: { profit: "Profit Rs 2,450,000", share: "Tax estimated", keep: "Rs 2,040,000 yours", owe: "Rs 410,000 tax" },
    jar: "Rs 2,040,000",
  },
} as const;

export function BandArt({ kind, country }: { kind: "in" | "out" | "keep"; country: SiteCountry }) {
  const d = SAMPLE[country];
  const bg = kind === "in" ? "bg-tint" : kind === "out" ? "bg-going-tint" : "bg-bg";
  return (
    <div aria-hidden className={cx("mt-2.5 box-border flex min-h-[220px] items-center justify-center rounded-[22px] p-[22px]", bg)}>
      {kind === "in" && (
        <span className="relative box-border flex w-full max-w-[280px] flex-col gap-2.5 rounded-2xl border border-line bg-white p-[18px]">
          <span className="flex justify-between text-[11px] font-bold tracking-[0.04em]">
            <span>{country === "lk" ? "TAX INVOICE" : "INVOICE"}</span>
            <span className="text-muted">{d.inv.no}</span>
          </span>
          <span className="text-[15px] font-bold">{d.inv.who}</span>
          <span className="flex justify-between text-[13px] text-ink2">
            <span>{d.inv.what}</span>
            <span className="tabular-nums">{d.inv.amt}</span>
          </span>
          {country === "lk" && (
            <>
              <span className="flex justify-between text-[13px] text-ink2">
                <span>SSCL 2.5%</span>
                <span className="tabular-nums">Rs 6,250</span>
              </span>
              <span className="flex justify-between text-[13px] text-ink2">
                <span>VAT 18%</span>
                <span className="tabular-nums">Rs 46,125</span>
              </span>
            </>
          )}
          <span className="h-px bg-line" />
          <span className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold">Total</span>
            <span className="font-display text-[22px] font-bold tabular-nums">{d.inv.total}</span>
          </span>
          <span className="inline-flex h-9 items-center self-start rounded-full bg-coming px-4 text-[13px] font-bold text-white">Record payment</span>
          <span className={cx("absolute right-3.5 top-[58px] rounded-lg border-[3px] border-pos bg-pos-bg/90 px-2.5 py-1 font-display text-lg font-extrabold tracking-[0.06em] text-pos", s.stamp)}>PAID</span>
        </span>
      )}
      {kind === "out" && (
        <span className="flex w-full max-w-[300px] flex-col gap-2">
          {d.rows.map((r, i) => (
            <span key={r[0]} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs">
              <span className="min-w-0 flex-1 truncate font-semibold">{r[0]}</span>
              <span className={cx("whitespace-nowrap rounded-full px-2 py-[3px] font-bold", s.tag)} style={{ background: r[3], animationDelay: `${i * 0.45}s` }}>
                {r[1]}
              </span>
              <span className="whitespace-nowrap font-bold tabular-nums">{r[2]}</span>
            </span>
          ))}
        </span>
      )}
      {kind === "keep" && <CashJar size={280} amount={d.jar} sym={COUNTRY_META[country].sym} className="h-auto max-w-full" />}
    </div>
  );
}

/** The small animated tiles in the dark "You add what happened" section. */
export function TapArt({ kind, country }: { kind: "paid" | "sort" | "remind" | "tax"; country: SiteCountry }) {
  const d = SAMPLE[country];
  return (
    <div aria-hidden className="relative box-border flex h-[116px] items-center justify-center overflow-hidden rounded-2xl bg-[#2E2A37] p-3">
      {kind === "paid" && (
        <span className="relative flex items-center gap-3">
          <span className={cx("inline-flex h-[30px] items-center rounded-full bg-coming px-3 text-xs font-bold text-white", s.coin)}>{d.paid}</span>
          <span className="relative box-border flex h-[76px] w-24 flex-col gap-1.5 rounded-[10px] bg-white p-2.5">
            <span className="text-[9px] font-bold text-ink">{d.payNo}</span>
            <span className="h-[5px] w-4/5 rounded bg-surface" />
            <span className="h-[5px] w-[55%] rounded bg-surface" />
            <span className={cx("absolute bottom-2 right-1.5 rounded-md border-2 border-pos bg-pos-bg px-1.5 py-0.5 font-display text-[11px] font-extrabold text-pos", s.stamp4)}>PAID</span>
          </span>
        </span>
      )}
      {kind === "sort" && (
        <span className="flex w-full flex-col gap-1.5">
          {d.rows.slice(0, 3).map((r, i) => (
            <span key={r[0]} className="flex items-center gap-2 rounded-lg bg-white px-2 py-[5px] text-[11px] text-ink">
              <span className="min-w-0 flex-1 truncate font-semibold">{r[0]}</span>
              <span className={cx("rounded-full px-[7px] py-px font-bold", s.tagShort)} style={{ background: r[3], animationDelay: `${i * 0.45}s` }}>
                {r[1]}
              </span>
            </span>
          ))}
        </span>
      )}
      {kind === "remind" && (
        <span className="flex w-full flex-col items-center gap-3">
          <svg className={s.ring} width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#B9A3FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" />
          </svg>
          <span className="relative flex w-full max-w-[220px] items-center justify-between">
            <span className="absolute left-1.5 right-1.5 top-[5px] h-0.5 bg-ink2" />
            {d.remind.map((t, i) => (
              <span key={t} className="relative flex flex-col items-center gap-1.5">
                <span className={cx("size-3 rounded-full bg-ink2", s.light)} style={{ animationDelay: `${i * 1.2}s` }} />
                <span className="whitespace-nowrap text-[10px] text-[#D9D4E6]">{t}</span>
              </span>
            ))}
          </span>
        </span>
      )}
      {kind === "tax" && (
        <span className="flex w-full flex-col gap-2.5">
          <span className="flex justify-between text-[11px] text-[#D9D4E6]">
            <span>{d.tax.profit}</span>
            <span>{d.tax.share}</span>
          </span>
          <span className="flex h-[18px] gap-0.5 overflow-hidden rounded-full bg-ink2">
            <span className={cx("bg-violet", s.grow)} style={{ ["--w" as string]: "83%" }} />
            <span className={cx("bg-[#E3C38F]", s.growTax)} style={{ ["--w" as string]: "17%" }} />
          </span>
          <span className="flex justify-between text-xs font-bold text-white">
            <span>{d.tax.keep}</span>
            <span className="text-[#E3C38F]">{d.tax.owe}</span>
          </span>
        </span>
      )}
    </div>
  );
}
