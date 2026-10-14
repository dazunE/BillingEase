"use client";

import { useId, useState } from "react";
import { cx } from "@/components/ui";
import { money, type SiteCountry } from "@/content/site/country";
import { LK_PAYSLIP, LK_RATES, UK_PAYRUN } from "@/content/site/small-businesses";

function Money({ label, hint, value, onChange, sym }: { label: string; hint?: string; value: number; onChange: (v: number) => void; sym: string }) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-[1_1_140px] flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-bold">
        {label}
      </label>
      <span className="flex min-h-11 items-center gap-1.5 rounded-xl border border-input bg-white px-3 focus-within:outline-3 focus-within:outline-coming">
        <span className="text-sm text-muted">{sym}</span>
        <input
          id={id}
          inputMode="numeric"
          value={value ? value.toLocaleString("en-GB") : ""}
          onChange={(e) => onChange(Math.min(10_000_000, +e.target.value.replace(/[^\d]/g, "") || 0))}
          className="tabular w-full min-w-0 bg-transparent text-[15px] outline-none"
        />
      </span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

function Rows({ rows }: { rows: [string, string, string?][] }) {
  return (
    <dl className="flex flex-col gap-1.5 text-sm">
      {rows.map(([l, v, cls]) => (
        <div key={l} className={cx("flex justify-between gap-3", cls)}>
          <dt>{l}</dt>
          <dd className="tabular font-bold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The payroll section's demo: UK pay run records, or a Sri Lanka payslip (prototype SiteTeams "Payroll, an add-on", reworked). */
export function PayrollDemo({ country, banner }: { country: SiteCountry; banner: string }) {
  return country === "uk" ? <UkRecords banner={banner} /> : <LkPayslip banner={banner} />;
}

function UkRecords({ banner }: { banner: string }) {
  const [r, setR] = useState(UK_PAYRUN);
  const set = (k: keyof typeof UK_PAYRUN) => (v: number) => setR((o) => ({ ...o, [k]: v }));
  const costs = r.gross + r.erNi + r.erPension;
  const hmrc = r.paye + r.eeNi + r.erNi;
  const pension = r.eePension + r.erPension;
  const net = r.gross - r.paye - r.eeNi - r.eePension;
  const m = (v: number) => money(v, "uk");
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-start gap-3 rounded-2xl bg-info-bg px-4 py-3 text-sm text-info">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-px flex-none">
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8h.01M11 12h1v5h1" />
        </svg>
        <span className="font-semibold">{banner}</span>
      </p>
      <div className="flex flex-wrap items-stretch gap-x-10 gap-y-7 rounded-[28px] border border-line bg-white p-[clamp(20px,3vw,36px)]">
        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display text-xl font-bold tracking-[-0.02em]">Pay run · 25 October</span>
            <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold">Typed in from payroll software</span>
          </span>
          <div className="flex flex-wrap gap-3">
            <Money sym="£" label="Gross pay" value={r.gross} onChange={set("gross")} />
            <Money sym="£" label="PAYE" value={r.paye} onChange={set("paye")} />
            <Money sym="£" label="Employee NI" value={r.eeNi} onChange={set("eeNi")} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Money sym="£" label="Employer NI" value={r.erNi} onChange={set("erNi")} />
            <Money sym="£" label="Employee pension" value={r.eePension} onChange={set("eePension")} />
            <Money sym="£" label="Employer pension" value={r.erPension} onChange={set("erPension")} />
          </div>
          <span className="text-xs text-muted">Aire Valley Electrical’s apprentice, invented figures.</span>
        </div>
        <div aria-live="polite" className="box-border flex min-w-0 flex-[1_1_320px] flex-col gap-4 rounded-[22px] bg-bg p-[clamp(18px,2.6vw,26px)]">
          <span className="text-[13px] font-semibold text-muted">What lands in the books</span>
          <div className="flex flex-col gap-1 rounded-2xl bg-going-tint p-4">
            <span className="text-[13px] font-bold">Staff costs, in Going out</span>
            <span className="tabular font-display text-[34px] font-bold leading-none tracking-[-0.03em]">{m(costs)}</span>
            <span className="text-xs text-ink2">Gross pay, employer NI and employer pension</span>
          </div>
          <Rows
            rows={[
              ["Net pay to your staff", m(net)],
              ["Owed to HMRC, due by the 22nd", m(hmrc)],
              ["Owed to the pension provider", m(pension)],
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function LkPayslip({ banner }: { banner: string }) {
  const [basic, setBasic] = useState(LK_PAYSLIP.basic);
  const [allow, setAllow] = useState(LK_PAYSLIP.allowance);
  const epfEe = Math.round(basic * LK_RATES.epfEe);
  const epfEr = Math.round(basic * LK_RATES.epfEr);
  const etf = Math.round(basic * LK_RATES.etf);
  const gross = basic + allow;
  const m = (v: number) => money(v, "lk");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-stretch gap-x-10 gap-y-7 rounded-[28px] border border-line bg-white p-[clamp(20px,3vw,36px)]">
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
          <span className="font-display text-xl font-bold tracking-[-0.02em]">One person, one month</span>
          <div className="flex flex-wrap gap-3">
            <Money sym="Rs" label="Basic salary" hint="EPF and ETF are worked out on this" value={basic} onChange={setBasic} />
            <Money sym="Rs" label="Fixed allowances" hint="Which count for EPF is set per allowance" value={allow} onChange={setAllow} />
          </div>
          <div className="flex flex-col gap-2 rounded-2xl bg-bg p-4 text-sm">
            <span className="text-[13px] font-bold">Each month, ready for you</span>
            <ul className="flex flex-col gap-1.5 text-ink2">
              {["Payslips as PDFs, to email or download", "EPF and ETF contribution schedules", "APIT schedule", "Bank salary transfer list"].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 flex-none">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div aria-live="polite" className="box-border flex min-w-0 flex-[1_1_340px] flex-col gap-3 rounded-[22px] border-2 border-ink bg-white p-[clamp(18px,2.6vw,26px)]">
          <span className="flex items-center justify-between gap-2">
            <span className="font-display text-xs font-extrabold tracking-[0.08em]">PAYSLIP · OCTOBER</span>
            <span className="text-xs text-muted">Serendib Design Studio</span>
          </span>
          <Rows
            rows={[
              ["Basic salary", m(basic)],
              ["Fixed allowances", m(allow)],
              ["Gross pay", m(gross), "border-t border-line pt-1.5"],
              ["EPF, employee 8%", `−${m(epfEe)}`],
              ["APIT, from the current tables", "worked out"],
            ]}
          />
          <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
            <span className="text-sm font-semibold text-muted">Net pay before APIT</span>
            <span className="tabular font-display text-[26px] font-bold tracking-[-0.02em]">{m(gross - epfEe)}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-tint p-3 text-[13px]">
            <span className="font-bold">Paid by the business on top</span>
            <Rows
              rows={[
                ["EPF, employer 12%", m(epfEr)],
                ["ETF, employer 3%", m(etf)],
              ]}
            />
          </div>
        </div>
      </div>
      <p className="flex items-start gap-3 rounded-2xl bg-info-bg px-4 py-3 text-sm text-info">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-px flex-none">
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8h.01M11 12h1v5h1" />
        </svg>
        <span className="font-semibold">{banner}</span>
      </p>
    </div>
  );
}
