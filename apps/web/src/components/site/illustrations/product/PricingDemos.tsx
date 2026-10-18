"use client";

import Link from "next/link";
import { Fragment, useState, type ReactNode } from "react";
import { cx } from "@/components/ui";
import { money, signUpHref, type SiteCountry } from "@/content/site/country";
import type { Plan } from "@/content/site/plans";
import type { CompareGroup } from "@/content/site/pricing";
import { ROUTES } from "@/content/site/routes";
import { SEG, SEG_BTN } from "./cls";
import s from "./product.module.css";

type UkV = { mtd: boolean; landlord: boolean; vat: boolean; people: number; practice: boolean; clients: number };
type LkV = { vat: boolean; staff: number; people: number; practice: boolean; clients: number };

function Stepper({ label, value, min, max, onChange, id }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void; id: string }) {
  const btn = "flex size-11 items-center justify-center rounded-full border border-input bg-white disabled:opacity-40";
  return (
    <div role="group" aria-labelledby={id} className="flex items-center gap-2.5">
      <button type="button" className={btn} aria-label={`One fewer: ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
          <path d="M5 12h14" />
        </svg>
      </button>
      <output aria-live="polite" className="min-w-12 text-center font-display text-[28px] font-bold tabular-nums">
        {value}
      </output>
      <button type="button" className={btn} aria-label={`One more: ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}

function YesNo({ id, on, set }: { id: string; on: boolean; set: (b: boolean) => void }) {
  return (
    <div role="group" aria-labelledby={id} className={SEG}>
      <button type="button" aria-pressed={!on} onClick={() => set(false)} className={SEG_BTN}>
        No
      </button>
      <button type="button" aria-pressed={on} onClick={() => set(true)} className={SEG_BTN}>
        Yes
      </button>
    </div>
  );
}

function Row({ id, title, hint, children }: { id: string; title: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
        <span id={id} className="text-base font-bold">
          {title}
        </span>
        <span className="text-sm text-muted">{hint}</span>
      </div>
      {children}
    </div>
  );
}

/** "Which plan fits?" (prototype calculator, without payment fees or yearly billing). */
export function PlanCalc({ country, plans, presets, maxPeople, note }: { country: SiteCountry; plans: Plan[]; presets: { label: string; v: UkV | LkV }[]; maxPeople: number; note: string }) {
  const lk = country === "lk";
  const [v, setV] = useState<UkV & LkV>({ mtd: false, landlord: false, vat: false, staff: 0, people: 1, practice: false, clients: 20, ...(presets[0].v as Partial<UkV & LkV>) });
  const set = (p: Partial<UkV & LkV>) => setV({ ...v, ...p });
  const [free, paid, practice] = plans;
  let rec: Plan;
  let why: string;
  if (v.practice) {
    rec = practice;
    why = `${v.clients} clients at ${money(practice.price, country)} each. Every client gets everything in ${paid.name}.`;
  } else if (lk ? v.vat || v.staff > 0 || v.people > 1 : v.mtd || v.landlord || v.vat || v.people > 1) {
    rec = paid;
    const r: string[] = [];
    if (lk) {
      if (v.vat) r.push("Tax Invoices with VAT and SSCL");
      if (v.staff > 0) r.push(`payroll for ${v.staff} ${v.staff === 1 ? "person" : "people"}`);
      if (v.people > 1) r.push("your practitioner on the same books");
    } else {
      if (v.mtd) r.push("MTD quarters");
      if (v.landlord) r.push("landlord mode");
      if (v.vat) r.push("VAT invoices");
      if (v.people > 1) r.push("your accountant on the same books");
    }
    why = `You’ll want ${r.join(", ").replace(/, ([^,]*)$/, " and $1")}.`;
  } else {
    rec = free;
    why = "Free covers it. Upgrade the day you need more.";
  }
  const total = rec.id === practice.id ? practice.price * v.clients : rec.price;
  const big = v.people > maxPeople;
  const href = rec.href === "signup" ? signUpHref(country) : rec.href;
  const presetOn = (p: UkV | LkV) => Object.entries(p).every(([k, val]) => (v as Record<string, unknown>)[k] === val);

  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-7 rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
        <Row id="c-practice" title={lk ? "Are you a tax practitioner?" : "Are you an accountant or bookkeeper?"} hint="Buying for clients, not for your own business.">
          <YesNo id="c-practice" on={v.practice} set={(b) => set({ practice: b })} />
        </Row>
        <div className="h-px bg-divider" />
        {v.practice ? (
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <label htmlFor="c-clients" className="text-base font-bold">
                Clients on BillingEase
              </label>
              <span className="font-display text-2xl font-bold tabular-nums">{v.clients}</span>
            </div>
            <input id="c-clients" type="range" min={1} max={200} value={v.clients} onChange={(e) => set({ clients: Number(e.target.value) })} className="h-8 w-full cursor-pointer accent-coming" />
          </div>
        ) : lk ? (
          <>
            <Row id="c-vat" title="VAT registered?" hint="You need Tax Invoices with VAT and SSCL.">
              <YesNo id="c-vat" on={v.vat} set={(b) => set({ vat: b })} />
            </Row>
            <div className="h-px bg-divider" />
            <Row id="c-staff" title="People you pay each month" hint="Payroll with EPF, ETF, APIT and payslips.">
              <Stepper id="c-staff" label="people you pay" value={v.staff} min={0} max={50} onChange={(n) => set({ staff: n })} />
            </Row>
          </>
        ) : (
          <>
            <Row id="c-mtd" title="Need Making Tax Digital quarters?" hint="Self-employment or property income over the MTD threshold.">
              <YesNo id="c-mtd" on={v.mtd} set={(b) => set({ mtd: b })} />
            </Row>
            <div className="h-px bg-divider" />
            <Row id="c-land" title="Do you let property?" hint="Landlord mode keeps each property and mortgage interest apart.">
              <YesNo id="c-land" on={v.landlord} set={(b) => set({ landlord: b })} />
            </Row>
            <div className="h-px bg-divider" />
            <Row id="c-vatuk" title="VAT registered?" hint="VAT invoices and a VAT summary each quarter.">
              <YesNo id="c-vatuk" on={v.vat} set={(b) => set({ vat: b })} />
            </Row>
          </>
        )}
        {!v.practice && (
          <>
            <div className="h-px bg-divider" />
            <Row id="c-people" title="People who’ll sign in" hint={`Everyone, you included${lk ? " and your practitioner" : " and your accountant"}.`}>
              <Stepper id="c-people" label="people who sign in" value={v.people} min={1} max={25} onChange={(n) => set({ people: n })} />
            </Row>
          </>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-divider pt-[18px]">
          <span className="mr-1 text-sm font-semibold text-muted">Or try</span>
          {presets.map((p) => {
            const on = presetOn(p.v);
            return (
              <button key={p.label} type="button" aria-pressed={on} onClick={() => setV({ ...v, ...(p.v as Partial<UkV & LkV>) })} className={cx("min-h-11 rounded-full border px-3.5 text-[13px] font-semibold", on ? "border-coming bg-tint" : "border-input bg-white")}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div aria-live="polite" className="box-border flex min-w-0 flex-[1_1_340px] flex-col gap-5 rounded-3xl bg-ink p-[clamp(22px,2.6vw,32px)] text-white">
        <span className="flex items-center gap-2 text-sm font-semibold text-tint">
          <span aria-hidden className="size-2.5 rounded-full bg-violet" />
          We’d suggest
        </span>
        <div className="flex flex-col gap-2">
          <span className="font-display text-[44px] font-bold leading-none tracking-[-0.035em] text-violet">{rec.name}</span>
          <span className="text-[15px] leading-normal text-tint">{why}</span>
        </div>
        <dl className="flex flex-col gap-2.5 border-t border-tint/[0.16] pt-4 text-[15px]">
          <div className="flex justify-between gap-3">
            <dt className="text-tint">{rec.id === practice.id ? `${v.clients} clients × ${money(practice.price, country)}` : `${rec.name} plan`}</dt>
            <dd className="whitespace-nowrap font-bold tabular-nums">{money(total, country)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-tint/[0.16] pt-3">
            <dt className="font-bold">Each month</dt>
            <dd className="font-display text-[32px] font-bold tracking-[-0.03em] tabular-nums">{money(total, country)}</dd>
          </div>
        </dl>
        <span className="rounded-[14px] bg-tint/10 px-3.5 py-3 text-[13px] leading-normal text-tint">{note}</span>
        {big && (
          <span className="text-sm leading-normal">
            Paid plans cover up to {maxPeople} people signing in. For more,{" "}
            <Link href={ROUTES.contact.href} className="font-bold underline">
              talk to sales
            </Link>{" "}
            about a bigger plan.
          </span>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2.5">
          <Link href={big ? ROUTES.contact.href : href} className="inline-flex min-h-12 items-center rounded-full bg-violet px-6 text-[15px] font-bold text-ink hover:bg-[#a98ffb]">
            {big ? "Talk to sales" : rec.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Every feature side by side, grouped like the app (prototype comparison table). */
export function CompareTable({ country, plans, groups }: { country: SiteCountry; plans: Plan[]; groups: CompareGroup[] }) {
  const [diff, setDiff] = useState(false);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const anyOpen = groups.some((g) => !closed[g.id]);
  const colBg = ["bg-white", "bg-[#FBFAFF]", "bg-white"];
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={diff} onClick={() => setDiff(!diff)} className={cx("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold", diff ? "border-coming bg-tint" : "border-input bg-white")}>
          <span aria-hidden className={cx("size-4 rounded-[5px] border-2 border-ink", diff && "bg-violet")} />
          Only show differences
        </button>
        <button
          type="button"
          onClick={() => setClosed(Object.fromEntries(groups.map((g) => [g.id, anyOpen])))}
          className="min-h-11 rounded-full bg-ink/[0.07] px-4 text-sm font-semibold"
        >
          {anyOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <p className="basis-full text-sm text-muted min-[721px]:hidden">Swipe the table sideways to see every plan.</p>
      <div className={cx(s.tblwrap, "w-full min-w-0 basis-full")} role="region" aria-label="Plan comparison" tabIndex={0}>
        <table className={s.tbl}>
          <caption className="sr-only">Features in {plans.map((p) => p.name).join(", ")}</caption>
          <colgroup>
            <col style={{ width: "40%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="bg-white text-left text-[13px] font-semibold text-muted">
                Prices per month · placeholders
              </th>
              {plans.map((p, i) => (
                <th key={p.id} scope="col" className={p.popular ? "bg-[#F4F0FF]" : "bg-white"}>
                  <span className="flex flex-col items-center gap-1.5 pt-1.5">
                    <span className="font-display text-lg font-bold">{p.name}</span>
                    <span className="text-sm font-semibold tabular-nums text-ink2">
                      {money(p.price, country)}
                      {p.per ? ` ${p.per}` : ""}
                    </span>
                    <Link href={p.href === "signup" ? signUpHref(country) : p.href} className={cx("inline-flex min-h-11 items-center rounded-full px-3.5 text-[13px] font-bold", p.popular ? "bg-violet" : "bg-ink/[0.07]")}>
                      {i === 0 ? "Start free" : p.href === "signup" ? "Try free" : "Talk to us"}
                    </Link>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          {groups.map((g) => {
            const rows = diff ? g.rows.filter((r) => !(r[2] === r[3] && r[3] === r[4])) : g.rows;
            const open = !closed[g.id];
            return (
              <tbody key={g.id}>
                <tr>
                  <th scope="colgroup" colSpan={4} className="!static border-b-0 bg-white !px-4 !pb-1.5 !pt-[18px] text-left !shadow-none">
                    <button type="button" aria-expanded={open} onClick={() => setClosed({ ...closed, [g.id]: open })} className="inline-flex min-h-11 items-center gap-2.5 font-display text-lg font-bold">
                      <span aria-hidden className="size-3 flex-none rounded-full" style={{ background: g.dot }} />
                      {g.name}
                      <span className="font-sans text-sm font-medium text-muted">
                        {rows.length} {rows.length === 1 ? "feature" : "features"}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d={open ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
                      </svg>
                    </button>
                  </th>
                </tr>
                {open &&
                  rows.map((r) => (
                    <tr key={r[0]}>
                      <th scope="row" className="font-medium">
                        <span className="flex flex-col gap-0.5">
                          <span className="font-semibold">{r[0]}</span>
                          {r[1] && <span className="text-[13px] font-normal text-muted">{r[1]}</span>}
                        </span>
                      </th>
                      {[r[2], r[3], r[4]].map((c, i) => (
                        <td key={i} className={colBg[i]}>
                          {c === true ? (
                            <Fragment>
                              <span aria-hidden className="inline-flex size-[26px] items-center justify-center rounded-full bg-tint">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m5 12 5 5 9-10" />
                                </svg>
                              </span>
                              <span className="sr-only">Included</span>
                            </Fragment>
                          ) : c === false ? (
                            <Fragment>
                              <span aria-hidden className="text-lg text-[#8E8A97]">
                                –
                              </span>
                              <span className="sr-only">Not included</span>
                            </Fragment>
                          ) : (
                            <span className="text-sm font-semibold leading-[1.35]">{c}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            );
          })}
        </table>
      </div>
    </>
  );
}
