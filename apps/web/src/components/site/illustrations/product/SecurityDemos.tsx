"use client";

import { useId, useState } from "react";
import { cx } from "@/components/ui";
import type { SiteCountry } from "@/content/site/country";
import { BTN_DARK, CHIP, INPUT } from "./cls";
import { onTabKeys } from "./Tabs";
import s from "./product.module.css";

type Role = { id: string; name: string; init: string; who: string; line: string; tint: string; items: [string, boolean][] };

/** "Everyone sees only their part": role tabs (prototype SiteSecurity roles). */
export function RoleTabs({ roles }: { roles: Role[] }) {
  const [cur, setCur] = useState(0);
  const base = useId();
  const r = roles[cur];
  return (
    <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
      <div role="tablist" aria-label="Who" className="flex flex-wrap gap-2">
        {roles.map((x, i) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            id={`${base}-t${i}`}
            aria-selected={i === cur}
            aria-controls={`${base}-p`}
            tabIndex={i === cur ? 0 : -1}
            onClick={() => setCur(i)}
            onKeyDown={(e) => onTabKeys(e, roles.length, cur, setCur)}
            className="min-h-11 rounded-full border border-input bg-white px-[18px] text-[15px] font-semibold aria-selected:border-ink aria-selected:bg-ink aria-selected:text-white"
          >
            {x.name}
          </button>
        ))}
      </div>
      <div id={`${base}-p`} role="tabpanel" aria-labelledby={`${base}-t${cur}`} className="flex flex-col gap-[18px] rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
        <div className="flex items-center gap-3.5">
          <span aria-hidden className="flex size-12 flex-none items-center justify-center rounded-full text-sm font-bold" style={{ background: r.tint }}>
            {r.init}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[17px] font-bold">{r.who}</span>
            <span className="text-sm text-muted">{r.line}</span>
          </span>
        </div>
        <ul className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}>
          {r.items.map(([t, yes]) => (
            <li key={t} className={cx("flex items-start gap-2.5 rounded-2xl px-3.5 py-3 text-[15px]", yes ? "bg-pos-bg/60" : "bg-bg")}>
              <span aria-hidden className={cx("mt-px flex size-[22px] flex-none items-center justify-center rounded-full", yes ? "bg-pos-bg" : "bg-surface")}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={yes ? "#2F5711" : "#47444F"} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={yes ? "m5 12 5 5 9-10" : "M6 6l12 12M18 6 6 18"} />
                </svg>
              </span>
              <span className={yes ? "text-ink" : "text-ink2"}>
                {yes ? t : `Can’t ${t[0].toLowerCase()}${t.slice(1)}`}
                <span className="sr-only">{yes ? " (allowed)" : ""}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type Entry = { id: number; date: string; text: string; amt: number; kind: "post" | "rev" | "fix"; locked?: boolean };

/** Ledger demo: fixing an amount posts a reversal and a new entry; a locked period refuses changes. */
export function LedgerDemo({ country }: { country: SiteCountry }) {
  const lk = country === "lk";
  const start: Entry[] = lk
    ? [
        { id: 1, date: "28 Aug", text: "Office rent · August", amt: 180000, kind: "post", locked: true },
        { id: 2, date: "3 Oct", text: "Courier receipt", amt: 4250, kind: "post" },
      ]
    : [
        { id: 1, date: "28 Jun", text: "Studio rent · June", amt: 450, kind: "post", locked: true },
        { id: 2, date: "3 Oct", text: "Train ticket to Harrogate", amt: 32.4, kind: "post" },
      ];
  const right = lk ? 2450 : 23.4;
  const [rows, setRows] = useState<Entry[]>(start);
  const [val, setVal] = useState(String(right));
  const [msg, setMsg] = useState<{ t: string; bad?: boolean } | null>(null);
  const fixed = rows.some((r) => r.kind === "fix");
  const fmt = (v: number) => (v < 0 ? "−" : "") + (lk ? "Rs " : "£") + Math.abs(v).toLocaleString("en-GB", { minimumFractionDigits: lk ? 0 : 2, maximumFractionDigits: 2 });
  const fix = () => {
    const v = parseFloat(val.replace(/[^0-9.]/g, ""));
    if (!(v > 0)) return setMsg({ t: "Type the right amount first.", bad: true });
    const e = rows[1];
    setRows([...rows, { id: 3, date: "Today", text: `Reversal of “${e.text}”`, amt: -e.amt, kind: "rev" }, { id: 4, date: e.date, text: `${e.text} (corrected)`, amt: v, kind: "fix" }]);
    setMsg({ t: `Fixed. The original stays, a reversal cancels it, and the corrected ${fmt(v)} is posted. Going out changed by ${fmt(v - e.amt)}.` });
  };
  const tryLocked = () => setMsg({ t: lk ? "August 2026 is filed and locked. Ask your practitioner to reopen it, or use a later date." : "Q1 is filed and locked. Ask your accountant to reopen it, or use a later date.", bad: true });
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-3 rounded-3xl border border-line bg-white p-[clamp(20px,3vw,32px)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-display text-[22px] font-bold tracking-[-0.02em]">The ledger</span>
          <span className="text-[13px] text-muted">Sample entries · newest last</span>
        </div>
        <ol className="flex flex-col">
          {rows.map((r) => (
            <li key={r.id} className={cx("flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-divider py-3 text-sm", r.id > 2 && s.rowin)}>
              <span className="w-14 flex-none text-xs tabular-nums text-muted">{r.date}</span>
              <span className="flex min-w-0 flex-[1_1_180px] items-center gap-2 font-semibold">
                {r.text}
                {r.locked && <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold">Locked · {lk ? "August, filed" : "Q1, filed"}</span>}
                {r.kind === "rev" && <span className="rounded-full bg-due-bg px-2 py-0.5 text-[11px] font-bold text-due">Reversal</span>}
                {r.kind === "fix" && <span className="rounded-full bg-pos-bg px-2 py-0.5 text-[11px] font-bold text-pos">New entry</span>}
              </span>
              <span className={cx("font-bold tabular-nums", r.kind === "post" && fixed && r.id === 2 && "text-muted line-through")}>{fmt(-r.amt)}</span>
            </li>
          ))}
        </ol>
        <div aria-live="polite" className="min-h-[52px]">
          {msg && <p className={cx("rounded-2xl px-4 py-3 text-sm leading-normal", msg.bad ? "bg-late-bg text-late" : "bg-pos-bg text-pos")}>{msg.t}</p>}
        </div>
      </div>
      <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 rounded-3xl bg-bg p-[clamp(20px,3vw,28px)]">
        <span className="text-[15px] font-bold">Try it</span>
        <label className="flex flex-col gap-1.5 text-[13px] font-bold">
          {lk ? "The courier receipt was really" : "The train ticket was really"}
          <input value={val} onChange={(e) => setVal(e.target.value)} disabled={fixed} inputMode="decimal" className={cx(INPUT, "min-h-11 tabular-nums")} />
        </label>
        <button type="button" className={cx(BTN_DARK, "self-start")} onClick={fix} disabled={fixed}>
          Fix the amount
        </button>
        <div className="h-px bg-line" />
        <button type="button" className={cx(CHIP, "self-start")} onClick={tryLocked}>
          Change the {lk ? "August rent" : "June rent"}
        </button>
        {fixed && (
          <button type="button" className="min-h-11 self-start text-sm font-semibold underline" onClick={() => (setRows(start), setMsg(null), setVal(String(right)))}>
            Start over
          </button>
        )}
        <span className="mt-auto text-[13px] leading-[1.45] text-muted">The same rules run in the real app. Nothing is ever deleted from the ledger.</span>
      </div>
    </div>
  );
}
