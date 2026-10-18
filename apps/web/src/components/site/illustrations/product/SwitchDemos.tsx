"use client";

import { useId, useState, type ReactNode } from "react";
import { cx } from "@/components/ui";
import type { Source } from "@/content/site/switch";
import { onTabKeys } from "./Tabs";

const TICK = "m5 12 5 5 9-10";

/** "Where are you coming from?" tabs, plus the plain-words table that follows the chosen source. */
export function SourceTabs({ sources, wordsHeading }: { sources: Source[]; wordsHeading: ReactNode }) {
  const [cur, setCur] = useState(0);
  const base = useId();
  const src = sources[cur];
  return (
    <>
      <div role="tablist" aria-label="Where you’re coming from" className="flex flex-wrap gap-2">
        {sources.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${base}-t${i}`}
            aria-selected={i === cur}
            aria-controls={`${base}-p`}
            tabIndex={i === cur ? 0 : -1}
            onClick={() => setCur(i)}
            onKeyDown={(e) => onTabKeys(e, sources.length, cur, setCur)}
            className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-input bg-white py-1 pl-1.5 pr-4 text-[15px] font-semibold aria-selected:border-ink aria-selected:bg-ink aria-selected:text-white"
          >
            <span aria-hidden className="flex size-9 items-center justify-center rounded-full font-display text-xs font-extrabold text-ink" style={{ background: t.tint }}>
              {t.mono}
            </span>
            <span>{t.name.replace(/^a /, "").replace(/^./, (c) => c.toUpperCase())}</span>
          </button>
        ))}
      </div>
      <div id={`${base}-p`} role="tabpanel" aria-labelledby={`${base}-t${cur}`} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-stretch gap-4">
          <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-5 rounded-3xl bg-bg p-[clamp(20px,2.4vw,28px)]">
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">What comes across from {src.name}</h3>
              <span className="text-sm text-muted">{src.how}</span>
            </div>
            <ul className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))" }}>
              {src.moves.map((m) => (
                <li key={m.t} className={cx("flex items-start gap-3 rounded-[18px] p-4", m.planned ? "border border-dashed border-input bg-transparent" : "bg-white")}>
                  <span aria-hidden className={cx("mt-0.5 flex size-6 flex-none items-center justify-center rounded-full", m.planned ? "bg-due-bg" : "bg-tint")}>
                    {m.planned ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B5000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d={TICK} />
                      </svg>
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col gap-[3px]">
                    <span className="flex flex-wrap items-center gap-2 text-[15px] font-bold">
                      {m.t}
                      {m.planned && <span className="rounded-full bg-due-bg px-2 py-0.5 text-[11px] font-bold text-due">Planned</span>}
                    </span>
                    <span className="text-sm leading-[1.45] text-ink2">{m.d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="flex items-start gap-2.5 border-t border-line pt-4 text-sm leading-[1.5] text-ink2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#47444F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-px flex-none">
                <path d="M4 7h16v13H4zM8 7V4h8v3M9 12h6" />
              </svg>
              <span>{src.stays}</span>
            </p>
          </div>
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
            <div aria-hidden className="flex flex-col gap-3.5 rounded-3xl border border-line bg-white p-[22px]">
              <span className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full font-display text-xs font-extrabold" style={{ background: src.tint }}>
                  {src.mono}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-bold">Moving in by hand</span>
                  <span className="text-xs text-muted">A sample evening</span>
                </span>
              </span>
              {src.progress.map(([t, n, of]) => (
                <span key={t} className="flex flex-col gap-1.5">
                  <span className="flex justify-between gap-2 text-[13px]">
                    <span className="font-semibold">{t}</span>
                    <span className="tabular-nums text-muted">
                      {n} of {of}
                    </span>
                  </span>
                  <span className="block h-2 overflow-hidden rounded-full bg-surface">
                    <span className={cx("block h-full rounded-full transition-[width] duration-700", n === of ? "bg-pos" : "bg-coming")} style={{ width: `${Math.round((n / of) * 100)}%` }} />
                  </span>
                </span>
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-3xl bg-ink p-[22px] text-white">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-tint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B9A3FF" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
                </svg>
                How long it takes
              </span>
              <span className="font-display text-[32px] font-bold tracking-[-0.03em] text-violet">{src.time}</span>
              <span className="text-sm leading-normal text-tint">{src.timeNote}</span>
            </div>
          </div>
        </div>
        <ol className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))" }}>
          {src.steps.map((s, i) => (
            <li key={s.t} className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-6">
              <span className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-ink font-display text-base font-bold text-white">{i + 1}</span>
                <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold">{s.mins}</span>
              </span>
              <span className="font-display text-xl font-bold tracking-[-0.02em]">{s.t}</span>
              <span className="text-[15px] leading-[1.55] text-ink2">{s.d}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* What changes, in plain words: follows the chosen source */}
      <div className="mt-[clamp(48px,7vw,96px)] flex flex-wrap items-start gap-x-16 gap-y-8">
        <div className="flex min-w-0 flex-[0_1_400px] flex-col gap-4">
          {wordsHeading}
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-bg py-1.5 pl-1.5 pr-3 text-[13px] font-semibold">
            <span aria-hidden className="flex size-[22px] items-center justify-center rounded-full font-display text-[10px] font-extrabold" style={{ background: src.tint }}>
              {src.mono}
            </span>
            Showing {src.name} · change it above
          </span>
        </div>
        <div className="min-w-0 flex-[999_1_520px] overflow-hidden rounded-3xl border border-line bg-white">
          <table className="w-full border-collapse text-[15px]">
            <caption className="sr-only">Names in {src.name} and in BillingEase</caption>
            <thead>
              <tr className="bg-bg">
                <th scope="col" className="w-[42%] px-5 py-3.5 text-left text-[13px] font-bold text-muted first-letter:uppercase">
                  In {src.name}
                </th>
                <th scope="col" className="px-5 py-3.5 text-left text-[13px] font-bold text-muted">
                  In BillingEase
                </th>
              </tr>
            </thead>
            <tbody>
              {src.words.map(([a, b, c]) => (
                <tr key={a} className="border-t border-divider">
                  <td className="px-5 py-4 align-top text-ink2">{a}</td>
                  <td className="px-5 py-4 align-top">
                    <span className="flex flex-col gap-0.5">
                      <span className="font-bold">{b}</span>
                      <span className="text-[13px] text-muted">{c}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/** The moving checklist (replaces the prototype's "we'll move it for you" form; we don't offer that). */
export function MoveChecklist({ items, done: doneText }: { items: [string, string, string][]; done: ReactNode }) {
  const [on, setOn] = useState<Record<string, boolean>>({ date: true });
  const n = items.filter((i) => on[i[0]]).length;
  const all = n === items.length;
  const next = items.find((i) => !on[i[0]]);
  return (
    <div className="box-border flex min-w-0 flex-col gap-5 rounded-3xl border border-line bg-white p-[clamp(20px,3vw,32px)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">Your moving checklist</h3>
        <span className="text-sm font-semibold tabular-nums text-muted">
          {n} of {items.length} done
        </span>
      </div>
      <span aria-hidden className="block h-2.5 overflow-hidden rounded-full bg-surface">
        <span className="block h-full rounded-full bg-coming transition-[width] duration-500" style={{ width: `${Math.round((n / items.length) * 100)}%` }} />
      </span>
      <ul className="flex flex-col gap-2">
        {items.map(([id, t, d]) => {
          const c = !!on[id];
          return (
            <li key={id}>
              <button type="button" role="checkbox" aria-checked={c} onClick={() => setOn({ ...on, [id]: !c })} className={cx("flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left", c ? "border-transparent bg-bg" : "border-line bg-white")}>
                <span aria-hidden className={cx("flex size-6 flex-none items-center justify-center rounded-md border-2", c ? "border-coming bg-coming" : "border-input")}>
                  {c && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={TICK} />
                    </svg>
                  )}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className={cx("text-[15px] font-semibold", c && "text-muted line-through")}>{t}</span>
                  <span className="text-[13px] text-muted">{d}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div aria-live="polite" className={cx("rounded-2xl px-4 py-3.5 text-sm leading-normal", all ? "bg-pos-bg text-pos" : "bg-tint text-ink")}>
        {all ? doneText : next ? <>Next up: <strong>{next[1].toLowerCase()}</strong>. {next[2]}.</> : null}
      </div>
    </div>
  );
}
