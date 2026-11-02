"use client";

import type { PayrollYear, RunSchedules } from "@billingease/contracts";
import { useState } from "react";
import { cx, Icon, ICONS } from "@/components/ui";
import { payrollYearTable, scheduleTable, SCHEDULE_LABELS, SCHEDULES, showCell, tableCsv, type ScheduleKind, type Table } from "@/lib/payroll-tables";

/** A schedule as a table you can read, copy as CSV or download (prototype .pr-tbl). */
function TableView({ t, label, download }: { t: Table; label: string; download: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const csv = tableCsv(t);
  const numeric = t.cols.map((_, i) => [...t.rows, t.total].some((r) => typeof r[i] === "number"));
  const copy = async () => {
    setShown(true);
    try {
      await navigator.clipboard.writeText(csv);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-[15px] font-bold">{t.title}</span>
        <span className="text-[13px] text-muted">{t.head}</span>
      </div>
      <div className="overflow-x-auto rounded-[14px] border border-surface">
        <table className="w-full min-w-[560px] border-collapse text-left text-[13px] tabular-nums" aria-label={label}>
          <thead>
            <tr>{t.cols.map((c, i) => <th key={c} scope="col" className={cx("whitespace-nowrap bg-bg px-3 py-2 text-xs font-semibold text-ink2", numeric[i] && "text-right")}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {t.rows.map((r, j) => (
              <tr key={j}>
                {r.map((c, i) => i === 0
                  ? <th key={i} scope="row" className="whitespace-nowrap border-t border-surface px-3 py-2 font-semibold">{c}</th>
                  : <td key={i} className={cx("whitespace-nowrap border-t border-surface px-3 py-2", numeric[i] && "text-right", c === "" && "text-muted")}>{c === "" ? "—" : showCell(c)}</td>)}
              </tr>
            ))}
            <tr className="font-bold">
              {t.total.map((c, i) => i === 0
                ? <th key={i} scope="row" className="border-t-2 border-line px-3 py-2">{c}</th>
                : <td key={i} className={cx("whitespace-nowrap border-t-2 border-line px-3 py-2", numeric[i] && "text-right")}>{showCell(c)}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <button type="button" onClick={copy} className="inline-flex min-h-10 items-center rounded-full bg-ink/[0.07] px-4 text-sm font-semibold hover:bg-ink/[0.11]">Copy (CSV)</button>
        <a href={download} download className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ink/[0.07] px-4 text-sm font-semibold no-underline hover:bg-ink/[0.11]"><Icon d={ICONS.download} size={16} />Download CSV</a>
        {t.due && <span className="text-[13px] text-muted">{t.due}</span>}
        {copied && <span role="status" className="text-[13px] font-semibold text-pos">Copied</span>}
      </div>
      {shown && (
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">CSV, ready to paste into a spreadsheet
          <textarea readOnly value={csv} onFocus={(e) => e.currentTarget.select()} className="min-h-[110px] w-full resize-y rounded-[10px] border border-input bg-white px-3 py-2.5 font-mono text-[13px] font-normal leading-normal" />
        </label>
      )}
    </div>
  );
}

/** Sri Lanka, an approved run: the EPF C form, ETF, APIT and the bank's transfer list. */
export function RunSchedulesView({ data }: { data: RunSchedules }) {
  const [tab, setTab] = useState<ScheduleKind>("epf");
  const t = scheduleTable(tab, data);
  const missing = tab === "bank" ? data.rows.filter((r) => !r.bankAccount && !r.bankName).length : tab === "apit" ? 0 : data.rows.filter((r) => !r.nic || !r.epfNumber).length;
  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Schedule" className="inline-flex max-w-full flex-wrap gap-1 self-start rounded-[22px] bg-surface p-1">
        {SCHEDULES.map((k) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)}
            className={cx("min-h-[38px] rounded-full px-3.5 text-sm font-semibold", tab === k ? "bg-ink text-white" : "text-ink hover:bg-white/60")}>{SCHEDULE_LABELS[k]}</button>
        ))}
      </div>
      <TableView key={tab} t={t} label={SCHEDULE_LABELS[tab]} download={`/app/out/payroll/${data.runId}/schedules/${tab}`} />
      {missing > 0 && (
        <p className="rounded-2xl bg-due-bg px-4 py-3 text-[13px] text-due">
          {missing} {missing === 1 ? "person has" : "people have"} no {tab === "bank" ? "bank details" : "NIC or EPF member number"} yet. Add {missing === 1 ? "it" : "them"} on their page under People on payroll.
        </p>
      )}
    </div>
  );
}

/** The year-end pack's payroll: each person's year and the totals. */
export function PayrollYearView({ data, yearLabel, download }: { data: PayrollYear; yearLabel: string; download: string }) {
  return <TableView t={payrollYearTable(data, yearLabel)} label="Payroll for the year" download={download} />;
}
