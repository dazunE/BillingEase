"use client";

import { useState } from "react";
import { cx } from "@/components/ui";
import { money, type SiteCountry } from "@/content/site/country";
import type { SampleExpense } from "@/content/site/going-out";
import { BTN_DARK, CHIP, INPUT, RANGE, SEG, SEG_BTN, SOFT } from "./cls";
import s from "./product.module.css";
import { Toast, useToast } from "./Toast";

const m2 = (v: number, c: SiteCountry) => (v < 0 ? "−" : "") + (c === "lk" ? "Rs " : "£") + Math.abs(v).toLocaleString("en-GB", { minimumFractionDigits: c === "lk" ? 0 : 2, maximumFractionDigits: 2 });
const PHOTO = "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7";
const CLIP = "M20 11.5 12 19.5a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17.5a2 2 0 0 1-3-3l7.5-7.5";

/** Hero: add an expense with the photo attached (replaces the prototype's receipt scanner: nothing is read). */
export function ExpenseDemo({ country, start, cats, list }: { country: SiteCountry; start: number; cats: string[]; list: SampleExpense[] }) {
  const lk = country === "lk";
  const [i, setI] = useState(0);
  const cur = list[i];
  const [total, setTotal] = useState(String(cur.total));
  const [cat, setCat] = useState(cur.cat);
  const [use, setUse] = useState(cur.use ?? 100);
  const [saved, setSaved] = useState<{ v: string; a: number; cat: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [toast, notify] = useToast();
  const amt = parseFloat(total.replace(/[^0-9.]/g, "")) || 0;
  const counts = Math.round(amt * (use / 100) * 100) / 100;
  const out = start + saved.reduce((a, x) => a + x.a, 0);
  const done = saved.length > i;
  const load = (n: number) => {
    const e = list[n];
    setI(n);
    setTotal(String(e.total));
    setCat(e.cat);
    setUse(e.use ?? 100);
    setErr(null);
  };
  const save = () => {
    if (!(amt > 0)) return setErr(`Type the total from the receipt, like ${m2(cur.total, country)}.`);
    setSaved([...saved, { v: cur.vendor, a: counts, cat }]);
    setErr(null);
    notify(`${cur.vendor} saved under ${cat} · ${m2(counts, country)} added to Going out`);
  };
  const steps = [
    { n: 1, t: "Photo attached", d: `${cur.vendor.toLowerCase().includes("invoice") ? "PDF" : "Photo"} kept with the expense, as it is`, on: true },
    { n: 2, t: "You type the total", d: amt > 0 ? m2(amt, country) + (cur.inputVat && lk ? ` · input VAT ${m2(cur.inputVat, country)}` : "") : "Waiting for the total", on: amt > 0 },
    { n: 3, t: "Category, once", d: `${cat} · counts in ${lk ? "this year’s return" : "Q3 for MTD"}`, on: true },
  ];

  return (
    <div className="box-border flex min-w-0 max-w-[580px] flex-[1_1_440px] flex-col gap-[18px] rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)] shadow-[0_30px_60px_-30px_rgba(24,22,31,0.25)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[15px] font-bold">Try it: add an expense</span>
        <span className="rounded-full bg-going-tint px-2.5 py-1 text-xs font-semibold">
          Expense {i + 1} of {list.length}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <div aria-hidden className="mx-auto box-border h-[240px] w-[150px] flex-none rounded-[28px] bg-ink p-2.5">
          <div className="relative flex h-full items-center justify-center overflow-hidden rounded-[20px] bg-going-tint">
            <span key={i} className={cx("relative box-border flex w-[104px] rotate-[-3deg] flex-col gap-1.5 bg-white px-2.5 pb-4 pt-3 shadow-[0_6px_14px_rgba(24,22,31,0.12)]", s.pop)}>
              <span className="text-center text-[9px] font-extrabold uppercase leading-tight tracking-[0.04em]">{cur.vendor}</span>
              <span className="h-[3px] rounded-sm bg-line" />
              <span className="h-[3px] w-[70%] rounded-sm bg-line" />
              <span className="h-[3px] rounded-sm bg-line" />
              <span className="h-[3px] w-1/2 rounded-sm bg-line" />
              <span className="flex justify-between border-t border-dashed border-input pt-1 text-[9px] font-extrabold">
                <span>TOTAL</span>
                <span>{m2(cur.total, country)}</span>
              </span>
            </span>
            <span className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-ink">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={CLIP} />
              </svg>
            </span>
          </div>
        </div>
        <ol aria-live="polite" className="flex min-w-0 flex-[1_1_260px] flex-col gap-2.5">
          {steps.map((st) => (
            <li key={st.n} className={cx("flex items-start gap-3 rounded-2xl px-3.5 py-3 transition-colors", st.on ? "bg-going-tint" : "bg-bg")}>
              <span className={cx("flex size-[26px] flex-none items-center justify-center rounded-full text-xs font-bold", st.on ? "bg-ink text-white" : "bg-white text-ink")}>{st.n}</span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-bold">{st.t}</span>
                <span className="text-[13px] text-ink2 [overflow-wrap:anywhere]">{st.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))" }}>
        <label className="flex flex-col gap-1 text-[13px] font-bold">
          Total
          <span className="relative">
            <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted">
              {lk ? "Rs" : "£"}
            </span>
            <input inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} disabled={done} className={cx(INPUT, "min-h-11 tabular-nums", lk ? "pl-9" : "pl-7", err && "border-late")} />
          </span>
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-bold">
          Category
          <select value={cat} onChange={(e) => setCat(e.target.value)} disabled={done} className={cx(INPUT, "min-h-11")}>
            {cats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      {!lk && cur.use !== undefined && (
        <label className="flex flex-col gap-1 text-[13px] font-bold">
          <span className="flex justify-between">
            <span>Business use</span>
            <span className="tabular-nums">
              {use}% · {m2(counts, country)} counts
            </span>
          </span>
          <input type="range" min={10} max={100} step={5} value={use} onChange={(e) => setUse(Number(e.target.value))} disabled={done} className={RANGE} />
        </label>
      )}
      {err && (
        <span role="alert" className="text-[13px] font-semibold text-late">
          {err}
        </span>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm tabular-nums text-ink2">
          <span aria-hidden className="size-2.5 rounded-full bg-going" />
          Going out <strong className="text-ink">{money(out, country)}</strong>
        </span>
        {done ? (
          <button type="button" className={cx(BTN_DARK, "bg-going text-ink hover:bg-[#d0661f]")} onClick={() => (i + 1 < list.length ? load(i + 1) : (setSaved([]), load(0)))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={PHOTO} />
            </svg>
            {i + 1 < list.length ? "Next expense" : "Start over"}
          </button>
        ) : (
          <button type="button" className={BTN_DARK} onClick={save}>
            Save expense
          </button>
        )}
      </div>
      <Toast text={toast} />
    </div>
  );
}

/** Pick a category for each new expense (replaces the prototype's bank-charge sorter). */
export function SortDemo({ country, rows, cats }: { country: SiteCountry; rows: { id: string; n: string; d: string; a: number }[]; cats: { c: string; note: string }[] }) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const left = rows.filter((r) => !picked[r.id]).length;
  return (
    <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-3 rounded-3xl bg-bg p-[clamp(20px,2.4vw,28px)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-bold">New expenses · need a category</span>
        <span className={cx("rounded-full px-2.5 py-1 text-xs font-bold", left ? "bg-due-bg text-due" : "bg-pos-bg text-pos")}>{left ? `${left} to sort` : "All sorted"}</span>
      </div>
      {rows.map((r) => {
        const p = picked[r.id];
        const note = cats.find((c) => c.c === p)?.note;
        return (
          <div key={r.id} className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-white px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 flex-col">
                <span className="font-bold">{r.n}</span>
                <span className="text-[13px] text-muted">
                  {r.d} · {p ? (note ? note : `Going out · ${p}`) : "Needs a category"}
                </span>
              </span>
              <span className={cx("whitespace-nowrap font-bold tabular-nums", p === "Personal" && "text-muted line-through")}>−{m2(r.a, country)}</span>
            </div>
            <div role="group" aria-label={`Category for ${r.n}`} className="flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <button key={c.c} type="button" aria-pressed={p === c.c} onClick={() => setPicked({ ...picked, [r.id]: c.c })} className={cx(CHIP, "min-h-9 px-3 text-[13px]")}>
                  {c.c}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {left === 0 && (
        <div role="status" className="flex items-center gap-3 rounded-[18px] bg-pos-bg py-3 pl-[18px] pr-3 text-sm font-semibold text-pos">
          <span className="min-w-0 flex-1">All four sorted. The quarter’s totals are up to date.</span>
          <button type="button" onClick={() => setPicked({})} className="min-h-8 flex-none px-3 text-[13px] underline">
            Start over
          </button>
        </div>
      )}
      <span className="text-[13px] text-muted">Pick “Personal” and it stays out of Going out.</span>
    </div>
  );
}

/** A bill: mark it paid in full, or record part now and the rest later. */
export function BillDemo({ country, b }: { country: SiteCountry; b: { ref: string; due: string; who: string; what: string; amt: number; step: number; also: [string, number][] } }) {
  const [mode, setMode] = useState<"full" | "parts">("full");
  const [first, setFirst] = useState(Math.round(b.amt / 2 / b.step) * b.step);
  const [when, setWhen] = useState("18 Oct");
  const [done, setDone] = useState(false);
  const plan: [string, number, string][] = mode === "full" ? [[`Paid in full on ${when}`, b.amt, "bg-going"]] : [["Paid now from your bank", first, "bg-going"], [`The rest on ${when}`, b.amt - first, "bg-input"]];
  return (
    <article className="flex min-w-0 flex-[1_1_420px] flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-[13px] text-muted">
            Bill {b.ref} · due {b.due}
          </span>
          <span className="text-lg font-bold">{b.who}</span>
          <span className="text-[13px] text-muted">{b.what}</span>
        </span>
        <span className="font-display text-[26px] font-bold tabular-nums">{money(b.amt, country)}</span>
      </div>
      <div role="group" aria-label="How you’re paying this bill" className={SEG}>
        {(["full", "parts"] as const).map((k) => (
          <button key={k} type="button" aria-pressed={mode === k} onClick={() => (setMode(k), setDone(false))} className={SEG_BTN}>
            {k === "full" ? "In full" : "In parts"}
          </button>
        ))}
      </div>
      {mode === "parts" && (
        <div className="flex flex-col gap-2">
          <label htmlFor="bill-first" className="text-[13px] font-bold">
            Paying now
          </label>
          <div className="flex items-center gap-3.5">
            <input id="bill-first" type="range" min={b.step} max={b.amt - b.step} step={b.step} value={first} onChange={(e) => (setFirst(Number(e.target.value)), setDone(false))} className={cx(RANGE, "flex-1 accent-going")} />
            <span className="min-w-16 text-right font-bold tabular-nums">{money(first, country)}</span>
          </div>
        </div>
      )}
      <label className="flex flex-col gap-1 text-[13px] font-bold">
        {mode === "full" ? "Paying on" : "The rest on"}
        <select value={when} onChange={(e) => (setWhen(e.target.value), setDone(false))} className={cx(INPUT, "max-w-[220px]")}>
          <option value="18 Oct">18 Oct (due date)</option>
          <option value="31 Oct">31 Oct</option>
          <option value="15 Nov">15 Nov</option>
        </select>
      </label>
      <ul className="flex flex-col gap-2">
        {plan.map(([t, a, dot]) => (
          <li key={t} className={cx(SOFT, "flex justify-between gap-3 rounded-[14px] px-3.5 py-3 text-sm")}>
            <span className="flex items-center gap-2">
              <span aria-hidden className={cx("size-2 rounded-full", dot)} />
              {t}
            </span>
            <span className="font-bold tabular-nums">{money(a, country)}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1.5 pt-1">
        <span className="text-[13px] font-bold text-muted">Also due this month</span>
        {b.also.map(([t, a]) => (
          <span key={t} className="flex justify-between gap-3 text-sm">
            <span>{t}</span>
            <span className="font-bold tabular-nums">{money(a, country)}</span>
          </span>
        ))}
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <span aria-live="polite" className="text-[13px] text-muted">
          {done ? "Recorded. You pay from your bank; BillingEase never moves money." : "You pay from your bank, then record it here."}
        </span>
        <button type="button" className={BTN_DARK} onClick={() => setDone(true)} disabled={done}>
          {done ? "Recorded" : mode === "full" ? "Mark as paid" : "Record part payment"}
        </button>
      </div>
    </article>
  );
}

/** Every-month costs: the list you set up, with a small add form. */
export function MonthlyList({ country, rows }: { country: SiteCountry; rows: [string, string, number][] }) {
  const [list, setList] = useState(rows);
  const [name, setName] = useState("");
  const [amt, setAmt] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const total = list.reduce((a, r) => a + r[2], 0);
  const add = () => {
    const v = parseFloat(amt.replace(/[^0-9.]/g, ""));
    if (!name.trim() || !(v > 0)) return setErr("Add a name and a monthly amount.");
    setList([...list, ["25th", name.trim(), v]]);
    setName("");
    setAmt("");
    setErr(null);
  };
  return (
    <article className="flex min-w-0 flex-[1_1_420px] flex-col gap-3 rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-lg font-bold">Every month</span>
          <span className="text-[13px] text-muted">Rent and subscriptions · set up once</span>
        </span>
        <span className="font-display text-[22px] font-bold tabular-nums">
          {money(total, country)}
          <span className="text-sm font-semibold text-muted"> / month</span>
        </span>
      </div>
      <ul className="flex flex-col">
        {list.map((x, i) => (
          <li key={x[1] + i} className={cx("flex items-center gap-2.5 border-b border-divider py-2 text-sm", i >= rows.length && s.rowin)}>
            <span className="w-10 flex-none text-xs tabular-nums text-muted">{x[0]}</span>
            <span className="min-w-0 flex-1 font-semibold">{x[1]}</span>
            <span className="font-bold tabular-nums">{money(x[2], country)}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 rounded-2xl bg-bg p-3.5">
        <span className="text-[13px] font-bold">Try adding one</span>
        <div className="flex flex-wrap gap-2">
          <input aria-label="Name" placeholder={country === "lk" ? "Water bill" : "Website domain"} value={name} onChange={(e) => setName(e.target.value)} className={cx(INPUT, "min-h-11 flex-[2_1_150px]")} />
          <input aria-label="Amount each month" inputMode="decimal" placeholder={country === "lk" ? "3,500" : "12"} value={amt} onChange={(e) => setAmt(e.target.value)} className={cx(INPUT, "min-h-11 flex-[1_1_90px] tabular-nums")} />
          <button type="button" className={BTN_DARK} onClick={add}>
            Add
          </button>
        </div>
        {err && (
          <span role="alert" className="text-[13px] font-semibold text-late">
            {err}
          </span>
        )}
      </div>
    </article>
  );
}

/** Payroll: UK records from payroll software; Sri Lanka EPF/ETF worked out (APIT from tables, not computed here). */
export function PayrollDemo({ country, p }: { country: SiteCountry; p: { title: string; sub: string; banner: string; run: string; people: [string, string, number, string][] } }) {
  const lk = country === "lk";
  const [people, setPeople] = useState(p.people);
  const [saved, setSaved] = useState(false);
  const gross = people.reduce((a, x) => a + x[2], 0);
  const epfE = Math.round(gross * 0.08);
  const epfR = Math.round(gross * 0.12);
  const etf = Math.round(gross * 0.03);
  const [paye, setPaye] = useState("96");
  const [ni, setNi] = useState("48");
  const ukTax = (parseFloat(paye) || 0) + (parseFloat(ni) || 0);
  const lines: [string, number][] = lk
    ? [
        ["Gross salaries", gross],
        ["EPF employee 8%", -epfE],
        ["EPF employer 12%", epfR],
        ["ETF 3%", etf],
      ]
    : [
        ["Gross pay", gross],
        ["PAYE and NI, due to HMRC by the 22nd", ukTax],
      ];
  return (
    <article className="flex min-w-0 flex-[1_1_420px] flex-col gap-4 rounded-3xl bg-bg p-[clamp(20px,2.4vw,28px)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">{p.title}</h3>
          <span className="text-[13px] text-muted">{p.sub}</span>
        </div>
        <span className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", saved ? "bg-pos-bg text-pos" : "bg-due-bg text-due")}>{saved ? "Saved" : "Draft"}</span>
      </div>
      <p className="rounded-[14px] bg-info-bg px-3.5 py-2.5 text-[13px] leading-[1.45] text-info">{p.banner}</p>
      <div className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-white p-4">
        <span className="text-[13px] text-muted">{p.run}</span>
        {people.map((x, i) => (
          <span key={x[1]} className="flex items-center gap-2.5 text-sm">
            <span aria-hidden className="flex size-[30px] flex-none items-center justify-center rounded-full text-[11px] font-bold" style={{ background: x[3] }}>
              {x[0]}
            </span>
            <span className="min-w-0 flex-1 font-semibold">{x[1]}</span>
            {lk ? (
              <span className="font-bold tabular-nums">{money(x[2], country)}</span>
            ) : (
              <input
                aria-label={`Gross pay for ${x[1]}`}
                inputMode="decimal"
                value={x[2]}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  setPeople(people.map((y, j) => (j === i ? [y[0], y[1], v, y[3]] : y)));
                  setSaved(false);
                }}
                className={cx(INPUT, "min-h-10 w-24 text-right tabular-nums")}
              />
            )}
          </span>
        ))}
        {!lk && (
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs font-bold">
              PAYE
              <input inputMode="decimal" value={paye} onChange={(e) => (setPaye(e.target.value), setSaved(false))} className={cx(INPUT, "min-h-10 tabular-nums")} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold">
              NI, employee and employer
              <input inputMode="decimal" value={ni} onChange={(e) => (setNi(e.target.value), setSaved(false))} className={cx(INPUT, "min-h-10 tabular-nums")} />
            </label>
          </div>
        )}
        <dl className="flex flex-col gap-1.5 border-t border-divider pt-2.5 text-sm">
          {lines.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-ink2">{k}</dt>
              <dd className="font-semibold tabular-nums">{m2(v, country)}</dd>
            </div>
          ))}
          {lk && (
            <div className="flex justify-between gap-3">
              <dt className="text-ink2">APIT</dt>
              <dd className="font-semibold">From the current tables</dd>
            </div>
          )}
        </dl>
        <button type="button" className={cx(BTN_DARK, "self-start")} onClick={() => setSaved(!saved)}>
          {saved ? "Undo" : lk ? "Save the pay run" : "Save the record"}
        </button>
        {saved && (
          <span role="status" className="text-[13px] text-pos">
            {lk ? "Payslips, the EPF, ETF and APIT schedules and the bank salary list are ready." : "Staff costs and the amount due to HMRC are in your books."}
          </span>
        )}
      </div>
    </article>
  );
}
