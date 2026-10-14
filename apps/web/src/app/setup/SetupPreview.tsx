import Link from "next/link";
import { formatDate, rulesFor, today } from "@billingease/core";
import { BrandMark, cx } from "@/components/ui";
import { money, type Cty } from "@/components/auth/country";

/** The answers setup collects (what the form posts, as state). */
export type Answers = {
  country: Cty;
  name: string;
  ownerName: string;
  town: string;
  kind: string;
  vat: boolean;
  vatNumber: string;
  taxId: string;
  sscl: boolean;
  quarterType: "standard" | "calendar";
  basis: "cash" | "accrual";
};

type Feature = { g: "in" | "out" | "keep" | "acct"; k: string; t: string; why?: string; on: boolean };

/** Every feature the preview can show, and when it appears, for the country's rules. */
export function featuresFor(a: Answers): Feature[] {
  const r = rulesFor(a.country);
  const noun = r.wording.practitionerNoun;
  if (a.country === "lk") {
    const vat = a.vat, sscl = a.sscl;
    return [
      { g: "in", k: "invoices", t: vat ? `${r.wording.vatInvoiceTitle}s with VAT${sscl ? " and SSCL" : ""} lines` : "Invoices in rupees", on: true },
      { g: "in", k: "quotes", t: "Quotes you can mark accepted", on: true },
      { g: "in", k: "pay", t: `Payments by ${r.receiveMethods.map((m) => m.toLowerCase().replace("bank transfer", "transfer").replace("lankaqr", "LankaQR")).join(", ").replace(/, ([^,]*)$/, " or $1")}`, on: true },
      { g: "in", k: "whatsapp", t: "Reminders by email and WhatsApp", on: r.features.whatsapp },
      { g: "out", k: "expenses", t: "Expenses with attachments", on: true },
      { g: "out", k: "bills", t: vat ? "Bills with input VAT" : "Bills to pay", why: vat ? "Because you’re VAT registered" : undefined, on: true },
      { g: "out", k: "monthly", t: "Every-month costs", on: true },
      { g: "out", k: "payroll", t: "Payroll with EPF, ETF and APIT, and payslips", on: r.features.payroll === "full" },
      { g: "keep", k: "estimate", t: "Income tax estimate", on: true },
      { g: "keep", k: "vat", t: "VAT periods, in return order", why: "Because you’re VAT registered", on: vat },
      { g: "keep", k: "sscl", t: "SSCL periods", why: "Because you pay SSCL", on: sscl },
      { g: "keep", k: "handoff", t: `Year-end hand-off to ${r.wording.practitionerTool}`, on: true },
      { g: "acct", k: "pview", t: `Your ${noun} sees the same books`, on: true },
      { g: "acct", k: "ask", t: "Ask: answers from Sri Lankan tax sources", on: true },
    ];
  }
  const trade = a.kind === "sole_trader" || a.kind === "both";
  const land = a.kind === "landlord" || a.kind === "both";
  return [
    { g: "in", k: "invoices", t: a.vat ? `${r.wording.vatInvoiceTitle}s with your VAT number` : "Invoices in pounds", on: trade },
    { g: "in", k: "quotes", t: "Quotes you can mark accepted", on: trade },
    { g: "in", k: "rent", t: "Rent from your property", why: "Because you let property", on: land },
    { g: "in", k: "pay", t: "Payments you record yourself", on: true },
    { g: "out", k: "expenses", t: "Expenses in HMRC’s categories", on: true },
    { g: "out", k: "bills", t: "Bills to pay", on: true },
    { g: "out", k: "monthly", t: "Every-month costs", on: true },
    { g: "out", k: "mileage", t: "Mileage", why: "Because you’re self-employed", on: trade && r.features.mileage },
    { g: "out", k: "propcosts", t: "Property costs, mortgage interest kept apart", why: "Because you let property", on: land && r.features.landlord },
    { g: "keep", k: "estimate", t: "Income Tax and NI estimate", on: true },
    { g: "keep", k: "quarters", t: `${a.quarterType === "calendar" ? "Calendar" : "Standard"} MTD quarters`, on: r.features.mtdQuarters },
    { g: "keep", k: "properties", t: "Your properties, each with its own figures", why: "Because you let property", on: land },
    { g: "keep", k: "vat", t: "VAT summary per quarter", why: "Because you’re VAT registered", on: a.vat },
    { g: "acct", k: "pview", t: `Your ${noun} sees the same books`, on: true },
    { g: "acct", k: "ask", t: "Ask: answers from HMRC guidance", on: true },
  ];
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The right-hand card: their future home, filling in as they answer. */
export function SetupPreview({ answers: a, done, prev }: { answers: Answers; done: boolean; prev: string[] | null }) {
  const lk = a.country === "lk";
  const r = rulesFor(a.country);
  const zero = money(0, a.country);
  const feats = featuresFor(a);
  const d = today();
  const date = `${WEEKDAY[new Date(`${d}T12:00:00Z`).getUTCDay()]} ${formatDate(d, { year: true })}`;
  const GROUPS = [
    { g: "in", name: "Coming in", dot: "bg-coming" },
    { g: "out", name: "Going out", dot: "bg-going" },
    { g: "keep", name: "Yours to keep", dot: "bg-ink border-2 border-violet" },
    { g: "acct", name: lk ? "Your practitioner" : "Your accountant", dot: "bg-white border-2 border-ink rounded-[3px]" },
  ] as const;
  const hidden = feats.filter((f) => !f.on).length;
  const shown = feats.length - hidden;

  return (
    <aside aria-labelledby="pv-h" className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 rounded-3xl border border-line bg-white p-5 min-[1000px]:sticky min-[1000px]:top-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h2 id="pv-h" className="font-display text-lg font-bold tracking-[-0.02em]">{done ? "Your home" : "Your home, as you answer"}</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-tint px-2.5 py-[3px] text-xs font-semibold"><span className="size-1.5 rounded-full bg-coming" />Live preview</span>
      </div>

      <div className="flex flex-col gap-3 rounded-[18px] bg-bg p-3.5">
        <div className="flex items-center justify-between gap-2.5">
          <span className="flex min-w-0 items-center gap-2">
            <BrandMark size={22} />
            <span className="truncate text-[13px] font-bold">{a.name.trim() || "Your business"}</span>
          </span>
          <span className="whitespace-nowrap text-xs text-muted">{date}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Tile label="Coming in" dot="bg-coming" value={zero} />
          <Tile label="Going out" dot="bg-going" value={zero} />
          <div className="col-span-2 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[14px] bg-ink px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-xs font-bold text-tint"><span className="size-[7px] rounded-full bg-violet" />Yours to keep</span>
            <span className="tabular whitespace-nowrap font-display text-xl font-bold tracking-[-0.02em] text-violet">{zero}</span>
          </div>
        </div>
        <span className="text-xs text-muted">
          Starts at {zero} and fills in as you add invoices and costs. Yours to keep is after {lk ? "income tax" : r.wording.taxLabel}.
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-bold">What you&apos;ll find behind each number</span>
        <span className="text-xs text-muted">Only what fits your answers. Everything else stays out of the way.</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-x-3.5 gap-y-4">
        {GROUPS.map((G) => {
          const items = feats.filter((f) => f.g === G.g && f.on);
          return (
            <div key={G.g} className="flex min-w-0 flex-col gap-2">
              <span className="flex items-center gap-[7px] text-[13px] font-bold">
                <span className={cx("box-border size-[9px] rounded-full", G.dot)} />
                {G.name} <span className="font-semibold text-muted">{items.length}</span>
              </span>
              <ul className="flex flex-col gap-1">
                {items.map((f) => {
                  const isNew = !!prev && !prev.includes(f.k);
                  return (
                    <li key={f.k} className={cx("flex flex-col gap-px rounded-[10px] px-[9px] py-1.5", isNew ? "bg-tint" : "bg-bg")}>
                      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] font-semibold leading-[1.35]">
                        {f.t}
                        {isNew && <span className="rounded-full bg-ink px-[7px] text-[10.5px] font-bold leading-[18px] tracking-[0.02em] text-white">NEW</span>}
                      </span>
                      {f.why && <span className="text-[11.5px] leading-[1.35] text-muted">{f.why}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-divider pt-3 text-[13px] text-ink2">
        <span>{hidden ? `${shown} features shown · ${hidden} hidden until you need them` : `All ${shown} features shown`}</span>
        <Link href="/features" className="font-semibold text-ink underline underline-offset-2">See everything</Link>
      </div>
    </aside>
  );
}

function Tile({ label, dot, value }: { label: string; dot: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[14px] border border-line bg-white px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-xs font-bold"><span className={cx("size-[7px] rounded-full", dot)} />{label}</span>
      <span className="tabular whitespace-nowrap font-display text-[17px] font-bold tracking-[-0.02em]">{value}</span>
    </div>
  );
}
