"use client";

import { useState } from "react";
import { cx } from "@/components/ui";
import type { SmallPage } from "@/content/site/small-businesses";

const YES = "m5 12 5 5 9-10";
const NO = "M6 12h12";
const PART = "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6";

function CellMark({ v }: { v: string }) {
  const yes = v === "yes";
  const no = v === "no";
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold", yes ? "text-pos" : no ? "text-muted" : "text-info")}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={yes ? YES : no ? NO : PART} />
      </svg>
      {yes ? "Yes" : no ? "No" : v}
    </span>
  );
}

/** Roles in plain words: pick a role, its column lights up (prototype SiteTeams §3). */
export function RolesTable({ roles }: { roles: SmallPage["roles"] }) {
  const [k, setK] = useState(roles.cols.length - 1);
  const col = roles.cols[k];
  const can = roles.rows.filter((r) => r.cells[k] !== "no").length;
  return (
    <>
      <div role="group" aria-label="Pick a role" className="flex flex-wrap gap-1 self-start rounded-3xl bg-surface p-1">
        {roles.cols.map((c, i) => (
          <button key={c.key} type="button" aria-pressed={i === k} onClick={() => setK(i)} className={cx("min-h-11 rounded-full px-4 text-sm font-semibold", i === k ? "bg-ink text-white" : "text-ink")}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-stretch gap-4">
        <div aria-live="polite" className="flex min-w-0 flex-[1_1_260px] flex-col gap-4 rounded-3xl bg-ink p-[26px] text-white">
          <span className="flex items-center gap-2 text-[13px] font-bold text-tint">
            <span aria-hidden className="size-2 rounded-full bg-violet" />
            Can do {can} of {roles.rows.length} things
          </span>
          <span className="font-display text-[28px] font-bold tracking-[-0.02em] text-violet">{col.label}</span>
          <p className="text-[15px] leading-normal text-tint">{col.desc}</p>
          <span className="mt-auto flex items-center gap-3 border-t border-white/15 pt-4">
            <span aria-hidden className="flex size-9 flex-none items-center justify-center rounded-full bg-tint font-display text-xs font-bold text-ink">
              {col.who
                .split(",")[0]
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase())
                .join("")}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-bold">{col.who}</span>
              <span className="text-xs text-tint">{col.hint} · invented example</span>
            </span>
          </span>
        </div>
        <ul className="hidden min-w-0 flex-[999_1_560px] flex-col rounded-3xl border border-line bg-white px-4 py-1 max-[760px]:flex" aria-label={`What ${col.label} can do`}>
          {roles.rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-3 border-b border-divider py-3 last:border-b-0">
              <span className="flex min-w-0 flex-col">
                <span className="text-[13px] font-bold">{r.label}</span>
                <span className="text-xs text-muted">{r.sub}</span>
              </span>
              <CellMark v={r.cells[k]} />
            </li>
          ))}
        </ul>
        <div className="min-w-0 flex-[999_1_560px] rounded-3xl border border-line bg-white p-[clamp(12px,2vw,18px)] max-[760px]:hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: roles.cols.length > 2 ? 600 : 460 }}>
              <caption className="pb-2 text-left text-xs text-muted">What each role can do · Yes · No · or a limited version</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="py-2.5 pr-3 text-left text-xs font-bold text-muted">
                    Permission
                  </th>
                  {roles.cols.map((c, i) => (
                    <th key={c.key} scope="col" className={cx("rounded-t-xl px-2.5 py-2.5 text-left text-xs font-bold", i === k && "bg-tint")}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.rows.map((r, n) => (
                  <tr key={r.label} className="border-b border-divider">
                    <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                      <span className="block text-[13px] font-bold">{r.label}</span>
                      <span className="block text-xs text-muted">{r.sub}</span>
                    </th>
                    {r.cells.map((v, i) => (
                      <td key={i} className={cx("px-2.5 py-2.5", i === k && "bg-tint", i === k && n === roles.rows.length - 1 && "rounded-b-xl")}>
                        <CellMark v={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <p className="text-[13px] text-muted">{roles.note}</p>
    </>
  );
}
